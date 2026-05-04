package com.attendance.system.dto;

import lombok.Data;

@Data
public class UpdateProfileRequestDTO {
    private String first_name;
    private String last_name;
    private String department;
    private String position;
}