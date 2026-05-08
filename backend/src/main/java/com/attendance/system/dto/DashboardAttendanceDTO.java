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

    /** HH:mm или null ако нема check-in денес */
    private String todayCheckIn;

    /** HH:mm или null ако нема check-out денес */
    private String todayCheckOut;

    /** H:MM или null ако денот не е завршен */
    private String todayWorkedHours;

    private String monthLateTotal;

    /**
     * NOT_STARTED = нема check-in денес
     * CHECKED_IN = има check-in, нема check-out
     * COMPLETED = има check-in и check-out
     */
    private String attendanceState;

    /**
     * Следна очекувана акција за frontend:
     * CHECK_IN / CHECK_OUT / DONE
     */
    private String nextAction;

    /** Засега default работно време */
    private String workStartTime;
    private String workEndTime;
    private String workScheduleLabel;

    private List<DashboardRecentRowDTO> recent;
}