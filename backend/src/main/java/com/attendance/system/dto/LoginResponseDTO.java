package com.attendance.system.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponseDTO {
    private boolean requires2fa;
    private String pendingToken;
    private String maskedEmail;
    private String otpHint;

    private String token;
    private String role;
    private String email;
    private String fullName;
}
