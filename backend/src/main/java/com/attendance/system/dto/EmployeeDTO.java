package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class EmployeeDTO {

    private Long id;

    private String firstName;
    private String lastName;

    private String department;
    private String position;

    private LocalDate employmentDate;

    private String email;
    private String role;
}
