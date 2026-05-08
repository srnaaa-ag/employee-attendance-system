package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeReportRowDTO {

    private Long employeeId;
    private String fullName;
    private String department;
    private int presentDays;
    private int approvedLeaveDays;
    private String workedHoursFormatted;
    private int lateCount;
    private String warning;
}
