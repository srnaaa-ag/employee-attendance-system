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

    public List<EmployeeReportRowDTO> buildEmployeeReport(LocalDate from, LocalDate to) {
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
                if (r.getCheck_in_time() != null) {
                    distinctDays.add(r.getCheck_in_time().toLocalDate());
                }
                if (r.getWorked_hours() != null) {
                    workedSum += r.getWorked_hours();
                }
                if (r.getStatus() != null && r.getStatus().toLowerCase().contains("late")) {
                    late++;
                }
            }

            rows.add(EmployeeReportRowDTO.builder()
                    .employeeId(id)
                    .fullName((emp.getFirst_name() + " " + emp.getLast_name()).trim())
                    .department(emp.getDepartment() != null ? emp.getDepartment() : "—")
                    .presentDays(distinctDays.size())
                    .approvedLeaveDays(leaveDaysByEmployee.getOrDefault(id, 0))
                    .workedHoursFormatted(formatHours(workedSum))
                    .lateCount(late)
                    .warning("Нема")
                    .build());
        }

        rows.sort((a, b) -> a.getFullName().compareToIgnoreCase(b.getFullName()));
        return rows;
    }

    private Map<Long, Integer> computeApprovedLeaveDaysByEmployee(LocalDate from, LocalDate to) {
        List<LeaveRequest> approved = leaveRequestRepository.findByStatus(LeaveRequestStatus.APPROVED);
        Map<Long, Integer> map = new HashMap<>();
        for (LeaveRequest req : approved) {
            if (req.getEmployee() == null || req.getEmployee().getId() == null) {
                continue;
            }
            int overlap = overlappingCalendarDays(
                    req.getStartDate(), req.getEndDate(), from, to);
            if (overlap <= 0) {
                continue;
            }
            Long eid = req.getEmployee().getId();
            map.merge(eid, overlap, Integer::sum);
        }
        return map;
    }

    private static int overlappingCalendarDays(LocalDate leaveStart, LocalDate leaveEnd, LocalDate rangeFrom, LocalDate rangeTo) {
        if (leaveStart == null || leaveEnd == null) {
            return 0;
        }
        LocalDate start = leaveStart.isAfter(rangeFrom) ? leaveStart : rangeFrom;
        LocalDate end = leaveEnd.isBefore(rangeTo) ? leaveEnd : rangeTo;
        if (start.isAfter(end)) {
            return 0;
        }
        int n = 0;
        LocalDate d = start;
        while (!d.isAfter(end)) {
            n++;
            d = d.plusDays(1);
        }
        return n;
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
