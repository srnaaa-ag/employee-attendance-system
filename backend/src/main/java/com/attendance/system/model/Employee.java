package com.attendance.system.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required!")
    private String first_name;

    @NotBlank(message = "Last name is required")
    private String last_name;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Position is required")
    private String position;

    @NotNull(message = "Employment date is required")
    private LocalDate employment_date;

    @NotNull(message = "Allowed latitude is required")
    private Double allowed_latitude;

    @NotNull(message = "Allowed longitude is required")
    private Double allowed_longitude;

    @NotNull(message = "Allowed radius is required")
    private Double allowed_radius_meters;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
