package com.attendance.system.service;

import com.attendance.system.dto.AttendanceActionRequestDTO;
import com.attendance.system.dto.DashboardAttendanceDTO;
import com.attendance.system.dto.DashboardRecentRowDTO;
import com.attendance.system.model.domain.AttendanceRecord;
import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;
import com.attendance.system.repository.AttendanceRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceDashboardService {

    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("HH:mm", Locale.ROOT);

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy", Locale.ROOT);

    private final EmployeeService employeeService;
    private final AttendanceRecordRepository attendanceRecordRepository;

    public DashboardAttendanceDTO buildDashboard(User user, int recentLimit) {
        Employee employee = getEmployeeForUser(user);

        Long employeeId = employee.getId();

        LocalTime workStart = EmployeeService.getWorkStart(employee);
        LocalTime workEnd = EmployeeService.getWorkEnd(employee);

        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();

        List<AttendanceRecord> todayRecords =
                attendanceRecordRepository.findByEmployeeAndCheckInRange(employeeId, dayStart, dayEnd);

        AttendanceRecord todayMain = todayRecords.stream()
                .max(Comparator.comparing(
                        AttendanceRecord::getCheck_in_time,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .orElse(null);

        String todayCheckIn = null;
        String todayCheckOut = null;
        String todayWorked = null;
        String attendanceState = "NOT_STARTED";
        String nextAction = "CHECK_IN";

        if (todayMain != null && todayMain.getCheck_in_time() != null) {
            todayCheckIn = todayMain.getCheck_in_time().toLocalTime().format(TIME_FMT);

            if (todayMain.getCheck_out_time() == null) {
                attendanceState = "CHECKED_IN";
                nextAction = "CHECK_OUT";
            } else {
                todayCheckOut = todayMain.getCheck_out_time().toLocalTime().format(TIME_FMT);
                attendanceState = "COMPLETED";
                nextAction = "DONE";

                if (todayMain.getWorked_hours() != null) {
                    todayWorked = formatHours(todayMain.getWorked_hours());
                }
            }
        }

        String monthLateTotal = calculateMonthLateTotal(employeeId, today, workStart);

        int limit = Math.min(Math.max(recentLimit, 1), 50);

        List<AttendanceRecord> recent =
                attendanceRecordRepository.findRecentByEmployeeId(employeeId, PageRequest.of(0, limit));

        List<DashboardRecentRowDTO> rows = new ArrayList<>();

        for (AttendanceRecord record : recent) {
            rows.add(toRecentRow(record));
        }

        return DashboardAttendanceDTO.builder()
                .todayCheckIn(todayCheckIn)
                .todayCheckOut(todayCheckOut)
                .todayWorkedHours(todayWorked)
                .monthLateTotal(monthLateTotal)
                .attendanceState(attendanceState)
                .nextAction(nextAction)
                .workStartTime(workStart.format(TIME_FMT))
                .workEndTime(workEnd.format(TIME_FMT))
                .workScheduleLabel(EmployeeService.formatWorkSchedule(workStart, workEnd))
                .recent(rows)
                .build();
    }

    @Transactional
    public DashboardAttendanceDTO checkIn(User user, AttendanceActionRequestDTO request) {
        Employee employee = getEmployeeForUser(user);
        LocalTime workStart = EmployeeService.getWorkStart(employee);

        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();

        AttendanceRecord existingTodayRecord =
                attendanceRecordRepository
                        .findLatestTodayRecord(employee.getId(), dayStart, dayEnd)
                        .orElse(null);

        if (existingTodayRecord != null) {
            if (existingTodayRecord.getCheck_out_time() == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Веќе имате активен check-in за денес."
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Денешната евиденција е веќе завршена."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setCheck_in_time(now);
        record.setCheck_in_latitude(request.getLatitude());
        record.setCheck_in_longitude(request.getLongitude());
        record.setStatus(isLate(now, workStart) ? "LATE" : "WORK");
        record.setWorked_hours(null);

        attendanceRecordRepository.save(record);

        return buildDashboard(user, 10);
    }

    @Transactional
    public DashboardAttendanceDTO checkOut(User user, AttendanceActionRequestDTO request) {
        Employee employee = getEmployeeForUser(user);

        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();

        AttendanceRecord activeRecord =
                attendanceRecordRepository
                        .findLatestTodayRecord(employee.getId(), dayStart, dayEnd)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Немате активен check-in за денес."
                        ));

        if (activeRecord.getCheck_out_time() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Денешната евиденција е веќе завршена."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        activeRecord.setCheck_out_time(now);
        activeRecord.setCheck_out_latitude(request.getLatitude());
        activeRecord.setCheck_out_longitude(request.getLongitude());

        double workedHours = Duration
                .between(activeRecord.getCheck_in_time(), now)
                .toMinutes() / 60.0;

        activeRecord.setWorked_hours(workedHours);

        if (activeRecord.getStatus() == null || activeRecord.getStatus().isBlank()) {
            LocalTime workStart = EmployeeService.getWorkStart(employee);
            activeRecord.setStatus(isLate(activeRecord.getCheck_in_time(), workStart) ? "LATE" : "WORK");
        }

        attendanceRecordRepository.save(activeRecord);

        return buildDashboard(user, 10);
    }

    private Employee getEmployeeForUser(User user) {
        Employee employee = employeeService.findByUser(user);

        if (employee == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Нема поврзан запис за вработен."
            );
        }

        return employee;
    }

    private static boolean isLate(LocalDateTime checkInTime, LocalTime workStart) {
        return checkInTime.toLocalTime().isAfter(workStart);
    }

    private String calculateMonthLateTotal(Long employeeId, LocalDate today, LocalTime workStart) {
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDateTime monthRangeStart = monthStart.atStartOfDay();
        LocalDateTime monthRangeEnd = monthStart.plusMonths(1).atStartOfDay();

        List<AttendanceRecord> monthRecords =
                attendanceRecordRepository.findByEmployeeAndCheckInRange(
                        employeeId,
                        monthRangeStart,
                        monthRangeEnd
                );

        int lateMinutesSum = 0;

        for (AttendanceRecord record : monthRecords) {
            if (record.getCheck_in_time() == null || record.getStatus() == null) {
                continue;
            }

            if (!record.getStatus().toLowerCase(Locale.ROOT).contains("late")) {
                continue;
            }

            LocalTime checkIn = record.getCheck_in_time().toLocalTime();

            if (checkIn.isAfter(workStart)) {
                lateMinutesSum += (int) Duration.between(workStart, checkIn).toMinutes();
            }
        }

        return formatMinutesAsClock(lateMinutesSum);
    }

    private static DashboardRecentRowDTO toRecentRow(AttendanceRecord record) {
        LocalDateTime checkIn = record.getCheck_in_time();
        LocalDateTime checkOut = record.getCheck_out_time();

        String dateStr = checkIn != null
                ? checkIn.toLocalDate().format(DATE_FMT)
                : "—";

        String checkInStr = checkIn != null
                ? checkIn.toLocalTime().format(TIME_FMT)
                : "—";

        String checkOutStr = checkOut != null
                ? checkOut.toLocalTime().format(TIME_FMT)
                : "—";

        String status = mapStatus(record);

        return DashboardRecentRowDTO.builder()
                .date(dateStr)
                .checkIn(checkInStr)
                .checkOut(checkOutStr)
                .status(status)
                .build();
    }

    private static String mapStatus(AttendanceRecord record) {
        if (record.getCheck_in_time() == null) {
            return "ABSENT";
        }

        if (record.getStatus() != null &&
                record.getStatus().toLowerCase(Locale.ROOT).contains("late")) {
            return "LATE";
        }

        if (record.getCheck_out_time() != null) {
            return "COMPLETED";
        }

        return "WORK";
    }

    private static String formatHours(double totalHours) {
        if (totalHours <= 0 && totalHours > -1e-6) {
            return "0:00";
        }

        int totalMinutes = (int) Math.round(totalHours * 60);

        if (totalMinutes < 0) {
            totalMinutes = 0;
        }

        int hours = totalMinutes / 60;
        int minutes = totalMinutes % 60;

        return String.format("%d:%02d", hours, minutes);
    }

    private static String formatMinutesAsClock(int totalMinutes) {
        if (totalMinutes <= 0) {
            return "00:00";
        }

        int hours = totalMinutes / 60;
        int minutes = totalMinutes % 60;

        return String.format("%02d:%02d", hours, minutes);
    }
}