package com.attendance.system.model.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime check_in_time;
    private LocalDateTime check_out_time;
    private Double check_in_latitude;
    private Double check_in_longitude;
    private Double check_out_latitude;
    private Double check_out_longitude;
    private String status;
    private Double worked_hours;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;
}