package com.attendance.system.model.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.attendance.system.model.enums.LeaveRequestStatus;
import com.attendance.system.model.enums.LeaveType;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "leave_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "start_date")
    @JsonFormat(pattern = "dd.MM.yyyy")
    private LocalDate startDate;

    @Column(name = "end_date")
    @JsonFormat(pattern = "dd.MM.yyyy")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private LeaveType leave_type;
    private String reason;

    @Enumerated(EnumType.STRING)
    private LeaveRequestStatus status;

    private LocalDateTime created_at;
    private LocalDateTime reviewed_at;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    // reviewer (User)
    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "admin_comment", length = 500)
    private String adminComment;
}
