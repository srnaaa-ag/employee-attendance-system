package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardAttendanceDTO {
    /** HH:mm или null ако нема доаѓање денес */
    private String todayCheckIn;
    /** H:MM (на пр. 6:45) или null */
    private String todayWorkedHours;
    /** Вкупно доцнење во месецот како HH:mm (сума на минути после 08:00 за записи со late во статус) */
    private String monthLateTotal;
    private List<DashboardRecentRowDTO> recent;
}
