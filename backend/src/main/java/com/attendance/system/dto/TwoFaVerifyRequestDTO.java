package com.attendance.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TwoFaVerifyRequestDTO {
    @NotBlank
    private String pendingToken;

    @NotBlank
    private String code;
}
