package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
