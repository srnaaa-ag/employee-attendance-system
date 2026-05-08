package com.attendance.system.service;

import com.attendance.system.dto.EmployeeReportRowDTO;
import com.attendance.system.model.domain.AttendanceRecord;
import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.LeaveRequest;
import com.attendance.system.model.enums.LeaveRequestStatus;
import com.attendance.system.repository.AttendanceRecordRepository;
import com.attendance.system.repository.EmployeeRepository;
import com.attendance.system.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public List<EmployeeReportRowDTO> buildEmployeeReport(
            LocalDate from, LocalDate to, boolean warningFullMonthOfTo) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("from must be before or equal to to");
        }

        LocalDateTime rangeStart = from.atStartOfDay();
        LocalDateTime rangeEndExclusive = to.plusDays(1).atStartOfDay();

        List<AttendanceRecord> records =
                attendanceRecordRepository.findByCheckInTimeRange(rangeStart, rangeEndExclusive);

        Map<Long, List<AttendanceRecord>> byEmployee = records.stream()
                .filter(r -> r.getEmployee() != null && r.getEmployee().getId() != null)
                .collect(Collectors.groupingBy(r -> r.getEmployee().getId()));

        Map<Long, Integer> lateForWarningByEmployee = warningFullMonthOfTo
                ? countLateByEmployeeForCalendarMonthOf(to)
                : null;

        Map<Long, Integer> leaveDaysByEmployee = computeApprovedLeaveDaysByEmployee(from, to);

        List<Employee> employees = employeeRepository.findAll();
        List<EmployeeReportRowDTO> rows = new ArrayList<>();

        for (Employee emp : employees) {
            Long id = emp.getId();
            List<AttendanceRecord> empRecords = byEmployee.getOrDefault(id, List.of());

            Set<LocalDate> distinctDays = new HashSet<>();
            double workedSum = 0;
            int late = 0;
            for (AttendanceRecord r : empRecords) {
                if (r.getCheck_in_time() != null && r.getCheck_out_time() != null) {
                    distinctDays.add(r.getCheck_in_time().toLocalDate());
                }
                workedSum += workedHoursFromRecord(r);
                if (r.getStatus() != null && r.getStatus().toLowerCase().contains("late")) {
                    late++;
                }
            }

            int lateForWarning = warningFullMonthOfTo && lateForWarningByEmployee != null
                    ? lateForWarningByEmployee.getOrDefault(id, 0)
                    : late;

            rows.add(EmployeeReportRowDTO.builder()
                    .employeeId(id)
                    .fullName((emp.getFirst_name() + " " + emp.getLast_name()).trim())
                    .department(emp.getDepartment() != null ? emp.getDepartment() : "—")
                    .presentDays(distinctDays.size())
                    .approvedLeaveDays(leaveDaysByEmployee.getOrDefault(id, 0))
                    .workedHoursFormatted(formatHours(workedSum))
                    .lateCount(late)
                    .warning(warningForLateCount(lateForWarning))
                    .build());
        }

        rows.sort((a, b) -> a.getFullName().compareToIgnoreCase(b.getFullName()));
        return rows;
    }

    private Map<Long, Integer> countLateByEmployeeForCalendarMonthOf(LocalDate toDate) {
        LocalDate monthStart = toDate.withDayOfMonth(1);
        LocalDate monthEnd = toDate.withDayOfMonth(toDate.lengthOfMonth());
        LocalDateTime start = monthStart.atStartOfDay();
        LocalDateTime endExclusive = monthEnd.plusDays(1).atStartOfDay();
        List<AttendanceRecord> monthRecords =
                attendanceRecordRepository.findByCheckInTimeRange(start, endExclusive);
        Map<Long, Integer> map = new HashMap<>();
        for (AttendanceRecord r : monthRecords) {
            if (r.getEmployee() == null || r.getEmployee().getId() == null) {
                continue;
            }
            if (r.getStatus() == null || !r.getStatus().toLowerCase().contains("late")) {
                continue;
            }
            Long eid = r.getEmployee().getId();
            map.merge(eid, 1, Integer::sum);
        }
        return map;
    }


    private Map<Long, Integer> computeApprovedLeaveDaysByEmployee(LocalDate from, LocalDate to) {
        List<LeaveRequest> approved = leaveRequestRepository.findByStatus(LeaveRequestStatus.APPROVED);
        Map<Long, Set<LocalDate>> daysByEmployee = new HashMap<>();
        for (LeaveRequest req : approved) {
            if (req.getEmployee() == null || req.getEmployee().getId() == null) {
                continue;
            }
            LocalDate leaveStart = req.getStartDate();
            LocalDate leaveEnd = req.getEndDate();
            if (leaveStart == null || leaveEnd == null) {
                continue;
            }
            LocalDate start = leaveStart.isAfter(from) ? leaveStart : from;
            LocalDate end = leaveEnd.isBefore(to) ? leaveEnd : to;
            if (start.isAfter(end)) {
                continue;
            }
            Long eid = req.getEmployee().getId();
            Set<LocalDate> days = daysByEmployee.computeIfAbsent(eid, k -> new HashSet<>());
            LocalDate d = start;
            while (!d.isAfter(end)) {
                days.add(d);
                d = d.plusDays(1);
            }
        }
        Map<Long, Integer> map = new HashMap<>();
        daysByEmployee.forEach((eid, days) -> map.put(eid, days.size()));
        return map;
    }

    private static double workedHoursFromRecord(AttendanceRecord r) {
        if (r.getCheck_in_time() != null && r.getCheck_out_time() != null) {
            long minutes = Duration.between(r.getCheck_in_time(), r.getCheck_out_time()).toMinutes();
            if (minutes < 0) {
                return 0;
            }
            return minutes / 60.0;
        }
        if (r.getWorked_hours() != null) {
            return r.getWorked_hours();
        }
        return 0;
    }

    private static String warningForLateCount(int lateCount) {
        if (lateCount < 3) {
            return "Нема";
        }
        if (lateCount <= 5) {
            return "Усно предупредување";
        }
        return "Писмено предупредување";
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
}
