package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** WORK | LATE | ABSENT — фронтендот мапира етикети на македонски. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardRecentRowDTO {
    private String date;
    private String checkIn;
    private String checkOut;
    private String status;
}
