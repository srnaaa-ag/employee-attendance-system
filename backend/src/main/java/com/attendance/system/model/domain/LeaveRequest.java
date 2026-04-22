package com.attendance.system.model.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate start_date;
    private LocalDate end_date;
    private String leave_type;
    private String reason;
    private String status;

    private LocalDateTime created_at;
    private LocalDateTime reviewed_at;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    // reviewer (User)
    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;
}
