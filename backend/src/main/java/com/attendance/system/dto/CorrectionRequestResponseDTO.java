package com.attendance.system.dto;

import com.attendance.system.model.enums.CorrectionType;
import com.attendance.system.model.enums.LeaveRequestStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CorrectionRequestResponseDTO {

    private Long id;
    private CorrectionType correctionType;
    private LocalDate targetDate;
    private LocalTime requestedCheckIn;
    private LocalTime requestedCheckOut;
    private String requestedAbsenceType;
    private String reason;
    private LeaveRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    private Long employeeId;
    private String employeeName;

    private Long reviewedById;
    private String reviewedByName;
    private String adminComment;
}