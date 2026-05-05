package com.attendance.system.dto;

import com.attendance.system.model.enums.CorrectionType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CorrectionRequestCreateDTO {

    @NotNull(message = "Correction type is required")
    private CorrectionType correctionType;

    @NotNull(message = "Target date is required")
    private LocalDate targetDate;

    private LocalTime requestedCheckIn;
    private LocalTime requestedCheckOut;
    private String requestedAbsenceType;

    private String reason;
}