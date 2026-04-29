package com.attendance.system.dto;

import com.attendance.system.model.enums.LeaveRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequestResponseDTO {

    private Long id;
    private LocalDate startDate;
    private LocalDate endDate;
    private String leaveType;
    private String reason;
    private LeaveRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    
    private Long employeeId;
    private String employeeName;
    
    private Long reviewedById;
    private String reviewedByName;
}