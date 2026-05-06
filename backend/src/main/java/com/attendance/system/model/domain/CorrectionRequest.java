package com.attendance.system.model.domain;

import com.attendance.system.model.enums.CorrectionType;
import com.attendance.system.model.enums.LeaveRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "correction_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorrectionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private CorrectionType correctionType;

    @Column(name = "target_date")
    private LocalDate targetDate;

    // За CHECK_IN_TIME / CHECK_OUT_TIME
    @Column(name = "requested_check_in")
    private LocalTime requestedCheckIn;

    @Column(name = "requested_check_out")
    private LocalTime requestedCheckOut;

    // За ABSENCE_TYPE
    @Column(name = "requested_absence_type")
    private String requestedAbsenceType;

    private String reason;

    @Enumerated(EnumType.STRING)
    private LeaveRequestStatus status;

    private LocalDateTime created_at;
    private LocalDateTime reviewed_at;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "admin_comment", length = 500)
    private String adminComment;
}