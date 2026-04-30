package com.attendance.system.repository;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.attendance.system.model.domain.LeaveRequest;
import com.attendance.system.model.enums.LeaveRequestStatus;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest,Long> {

    List<LeaveRequest> findByEmployeeId(Long employeeId);
    
    List<LeaveRequest> findByStatus(LeaveRequestStatus status);
    
    List<LeaveRequest> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<LeaveRequest> findByEmployeeIdAndStatus(Long employeeId, LeaveRequestStatus status);
    
}
