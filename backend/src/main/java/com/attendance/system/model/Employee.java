package com.attendance.system.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;


@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String first_name;
    private String last_name;
    private String department;
    private String position;
    private LocalDate employment_date;
    private Double allowed_latitude;
    private Double allowed_longitude;
    private Double allowed_radius_meters;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
