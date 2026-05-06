package com.attendance.system.service;

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

    private static final LocalTime EXPECTED_START = LocalTime.of(8, 0);
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm", Locale.ROOT);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy", Locale.ROOT);

    private final EmployeeService employeeService;
    private final AttendanceRecordRepository attendanceRecordRepository;

    public DashboardAttendanceDTO buildDashboard(User user, int recentLimit) {
        Employee emp = employeeService.findByUser(user);
        if (emp == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Нема поврзан запис за вработен.");
        }
        Long eid = emp.getId();
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();

        List<AttendanceRecord> todayRecords =
                attendanceRecordRepository.findByEmployeeAndCheckInRange(eid, dayStart, dayEnd);
        AttendanceRecord todayMain = todayRecords.stream()
                .max(Comparator.comparing(AttendanceRecord::getCheck_in_time, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);

        String todayCheckIn = null;
        String todayWorked = null;
        if (todayMain != null && todayMain.getCheck_in_time() != null) {
            todayCheckIn = todayMain.getCheck_in_time().toLocalTime().format(TIME_FMT);
            if (todayMain.getWorked_hours() != null && todayMain.getWorked_hours() > 0) {
                todayWorked = formatHours(todayMain.getWorked_hours());
            } else if (todayMain.getCheck_out_time() == null) {
                todayWorked = null;
            }
        }

        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDateTime monthRangeStart = monthStart.atStartOfDay();
        LocalDateTime monthRangeEnd = monthStart.plusMonths(1).atStartOfDay();
        List<AttendanceRecord> monthRecords =
                attendanceRecordRepository.findByEmployeeAndCheckInRange(eid, monthRangeStart, monthRangeEnd);
        int lateMinutesSum = 0;
        for (AttendanceRecord r : monthRecords) {
            if (r.getCheck_in_time() == null || r.getStatus() == null) {
                continue;
            }
            if (!r.getStatus().toLowerCase(Locale.ROOT).contains("late")) {
                continue;
            }
            LocalTime in = r.getCheck_in_time().toLocalTime();
            if (in.isAfter(EXPECTED_START)) {
                lateMinutesSum += (int) Duration.between(EXPECTED_START, in).toMinutes();
            }
        }
        String monthLateTotal = formatMinutesAsClock(lateMinutesSum);

        int limit = Math.min(Math.max(recentLimit, 1), 50);
        List<AttendanceRecord> recent =
                attendanceRecordRepository.findRecentByEmployeeId(eid, PageRequest.of(0, limit));

        List<DashboardRecentRowDTO> rows = new ArrayList<>();
        for (AttendanceRecord r : recent) {
            rows.add(toRecentRow(r));
        }

        return DashboardAttendanceDTO.builder()
                .todayCheckIn(todayCheckIn)
                .todayWorkedHours(todayWorked)
                .monthLateTotal(monthLateTotal)
                .recent(rows)
                .build();
    }

    private static DashboardRecentRowDTO toRecentRow(AttendanceRecord r) {
        LocalDateTime in = r.getCheck_in_time();
        LocalDateTime out = r.getCheck_out_time();
        String dateStr = in != null ? in.toLocalDate().format(DATE_FMT) : "—";
        String inStr = in != null ? in.toLocalTime().format(TIME_FMT) : "—";
        String outStr = out != null ? out.toLocalTime().format(TIME_FMT) : "—";
        String status = mapStatus(r);
        return DashboardRecentRowDTO.builder()
                .date(dateStr)
                .checkIn(inStr)
                .checkOut(outStr)
                .status(status)
                .build();
    }

    private static String mapStatus(AttendanceRecord r) {
        if (r.getCheck_in_time() == null) {
            return "ABSENT";
        }
        if (r.getStatus() != null && r.getStatus().toLowerCase(Locale.ROOT).contains("late")) {
            return "LATE";
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
        int h = totalMinutes / 60;
        int m = totalMinutes % 60;
        return String.format("%d:%02d", h, m);
    }

    private static String formatMinutesAsClock(int totalMinutes) {
        if (totalMinutes <= 0) {
            return "00:00";
        }
        int h = totalMinutes / 60;
        int m = totalMinutes % 60;
        return String.format("%02d:%02d", h, m);
    }
}
