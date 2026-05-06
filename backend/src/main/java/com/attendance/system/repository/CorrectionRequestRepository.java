package com.attendance.system.repository;

import com.attendance.system.model.domain.CorrectionRequest;
import com.attendance.system.model.enums.LeaveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorrectionRequestRepository extends JpaRepository<CorrectionRequest, Long> {
    List<CorrectionRequest> findByEmployeeId(Long employeeId);
    List<CorrectionRequest> findByStatus(LeaveRequestStatus status);
}