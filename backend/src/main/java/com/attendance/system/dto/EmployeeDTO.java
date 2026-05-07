package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
public class EmployeeDTO {

    private Long id;

    private String firstName;
    private String lastName;

    private String department;
    private String position;

    private LocalDate employmentDate;

    private Double allowed_latitude;
    private Double allowed_longitude;
    private Double allowed_radius_meters;

    private LocalTime work_start_time;
    private LocalTime work_end_time;
    private String workScheduleLabel;

    private String email;
    private String phone;
    private String role;

    private String profilePicture;
    private Boolean hasFacePhoto;
}