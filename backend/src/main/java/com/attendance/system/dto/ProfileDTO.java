package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ProfileDTO {

    private Long id;

    private String first_name;
    private String last_name;

    private String department;
    private String position;

    private LocalDate employment_date;

    private Double allowed_latitude;
    private Double allowed_longitude;
    private Double allowed_radius_meters;

    private String email;
    private String phone;
    private String role;

    private String profilePicture;
    private Boolean hasFacePhoto;
}