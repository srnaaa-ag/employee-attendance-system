package com.attendance.system.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CorrectionRequestReviewDTO {
    private String adminComment;
}