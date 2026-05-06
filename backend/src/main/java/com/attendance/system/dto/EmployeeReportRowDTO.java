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
    /** Различни календарски денови со барем еден check-in во периодот. */
    private int presentDays;
    /** Одобрени денови отсуство (пресек со периодот). */
    private int approvedLeaveDays;
    /** Вкупно работни часови како H:MM (од полето worked_hours). */
    private String workedHoursFormatted;
    private int lateCount;
    /** За идна интеграција со известувања; засега „Нема“. */
    private String warning;
}
