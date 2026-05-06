package com.attendance.system.model.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "suspicious_activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuspiciousActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String activity_type;
    private String description;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createt_at;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;
}