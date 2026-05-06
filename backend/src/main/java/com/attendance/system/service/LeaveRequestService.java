package com.attendance.system.service;

import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.LeaveRequest;
import com.attendance.system.model.domain.Notification;
import com.attendance.system.model.domain.User;
import com.attendance.system.model.enums.LeaveRequestStatus;
import com.attendance.system.repository.LeaveRequestRepository;
import com.attendance.system.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserService userService;
    private final NotificationRepository notificationRepository;

    public LeaveRequest createLeaveRequest(LeaveRequest leaveRequest) {
        if (leaveRequest.getStartDate().isAfter(leaveRequest.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        if (hasOverlappingLeaveRequests(
                leaveRequest.getEmployee().getId(),
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate())) {
            throw new IllegalStateException("Overlapping leave request exists");
        }

        leaveRequest.setStatus(LeaveRequestStatus.PENDING);
        leaveRequest.setCreated_at(LocalDateTime.now());

        return leaveRequestRepository.save(leaveRequest);
    }

    @Transactional(readOnly = true)
    public LeaveRequest getLeaveRequestById(Long id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getLeaveRequestsByEmployeeId(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getLeaveRequestsByStatus(LeaveRequestStatus status) {
        return leaveRequestRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getLeaveRequestsByDateRange(LocalDate startDate, LocalDate endDate) {
        return leaveRequestRepository.findByStartDateBetween(startDate, endDate);
    }

    public LeaveRequest updateLeaveRequest(Long id, LeaveRequest updatedRequest) {
        LeaveRequest existingRequest = getLeaveRequestById(id);

        if (existingRequest.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Cannot update leave request with status: " + existingRequest.getStatus());
        }

        if (updatedRequest.getStartDate().isAfter(updatedRequest.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        existingRequest.setStartDate(updatedRequest.getStartDate());
        existingRequest.setEndDate(updatedRequest.getEndDate());
        existingRequest.setLeave_type(updatedRequest.getLeave_type());
        existingRequest.setReason(updatedRequest.getReason());

        return leaveRequestRepository.save(existingRequest);
    }

    public LeaveRequest approveLeaveRequest(Long id, Long reviewerId, String adminComment) {
        LeaveRequest request = getLeaveRequestById(id);

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Can only approve pending leave requests");
        }

        User reviewer = userService.findById(reviewerId);

        request.setStatus(LeaveRequestStatus.APPROVED);
        request.setReviewedBy(reviewer);
        request.setReviewed_at(LocalDateTime.now());
        request.setAdminComment(normalizeAdminComment(adminComment));

        LeaveRequest saved = leaveRequestRepository.save(request);
        notifyEmployeeAboutReview(saved, LeaveRequestStatus.APPROVED);
        return saved;
    }

    public LeaveRequest rejectLeaveRequest(Long id, Long reviewerId, String adminComment) {
        LeaveRequest request = getLeaveRequestById(id);

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Can only reject pending leave requests");
        }

        User reviewer = userService.findById(reviewerId);

        request.setStatus(LeaveRequestStatus.REJECTED);
        request.setReviewedBy(reviewer);
        request.setReviewed_at(LocalDateTime.now());
        request.setAdminComment(normalizeAdminComment(adminComment));

        LeaveRequest saved = leaveRequestRepository.save(request);
        notifyEmployeeAboutReview(saved, LeaveRequestStatus.REJECTED);
        return saved;
    }

    private static String normalizeAdminComment(String adminComment) {
        if (adminComment == null) {
            return null;
        }
        String trimmed = adminComment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
    private void notifyEmployeeAboutReview(LeaveRequest request, LeaveRequestStatus status) {
        Employee employee = request.getEmployee();
        if (employee == null || employee.getUser() == null) {
            return;
        }
        String headline = status == LeaveRequestStatus.APPROVED
                ? "Вашето барање за отсуство е одобрено."
                : "Вашето барање за отсуство е одбиено.";
        String adminComment = request.getAdminComment();
        String message = adminComment != null
                ? headline + " Коментар на администратор: " + adminComment
                : headline;
        Notification notification = new Notification();
        notification.setType("LEAVE_REQUEST_" + status.name());
        notification.setMessage(message);
        notification.set_read(false);
        notification.setCreated_at(LocalDateTime.now());
        notification.setUser(employee.getUser());
        notificationRepository.save(notification);
    }

    public LeaveRequest cancelLeaveRequest(Long id) {
        LeaveRequest request = getLeaveRequestById(id);

        if (request.getStatus() == LeaveRequestStatus.REJECTED ||
                request.getStatus() == LeaveRequestStatus.CANCELLED) {
            throw new IllegalStateException("Cannot cancel leave request with status: " + request.getStatus());
        }

        request.setStatus(LeaveRequestStatus.CANCELLED);
        request.setReviewed_at(LocalDateTime.now());

        return leaveRequestRepository.save(request);
    }

    public void deleteLeaveRequest(Long id) {
        LeaveRequest request = getLeaveRequestById(id);

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Can only delete pending leave requests");
        }

        leaveRequestRepository.delete(request);
    }

    @Transactional(readOnly = true)
    public boolean hasOverlappingLeaveRequests(Long employeeId, LocalDate startDate, LocalDate endDate) {
        List<LeaveRequest> requests = getLeaveRequestsByEmployeeId(employeeId);
        return requests.stream()
                .filter(r -> r.getStatus() == LeaveRequestStatus.APPROVED ||
                        r.getStatus() == LeaveRequestStatus.PENDING)
                .anyMatch(r -> datesOverlap(startDate, endDate, r.getStartDate(), r.getEndDate()));
    }

    private boolean datesOverlap(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        return !start1.isAfter(end2) && !end1.isBefore(start2);
    }
}