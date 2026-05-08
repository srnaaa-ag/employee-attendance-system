package com.attendance.system.service;

import com.attendance.system.model.domain.CorrectionRequest;
import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.Notification;
import com.attendance.system.model.domain.User;
import com.attendance.system.model.enums.LeaveRequestStatus;
import com.attendance.system.model.enums.Role;
import com.attendance.system.repository.CorrectionRequestRepository;
import com.attendance.system.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CorrectionRequestService {

    private final CorrectionRequestRepository correctionRequestRepository;
    private final UserService userService;
    private final NotificationRepository notificationRepository;

    public CorrectionRequest createCorrectionRequest(CorrectionRequest request) {
        validateRequestByType(request);
        request.setStatus(LeaveRequestStatus.PENDING);
        request.setCreated_at(LocalDateTime.now());
        return correctionRequestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public CorrectionRequest getCorrectionRequestById(Long id) {
        return correctionRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Correction request not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<CorrectionRequest> getAllCorrectionRequests() {
        return correctionRequestRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<CorrectionRequest> getCorrectionRequestsByEmployeeId(Long employeeId) {
        return correctionRequestRepository.findByEmployeeId(employeeId);
    }

    @Transactional(readOnly = true)
    public List<CorrectionRequest> getCorrectionRequestsByStatus(LeaveRequestStatus status) {
        return correctionRequestRepository.findByStatus(status);
    }

    public CorrectionRequest approveCorrectionRequest(Long id, Long reviewerId, String adminComment) {
        CorrectionRequest request = getCorrectionRequestById(id);

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Can only approve pending correction requests");
        }

        User reviewer = userService.findById(reviewerId);
        request.setStatus(LeaveRequestStatus.APPROVED);
        request.setReviewedBy(reviewer);
        request.setReviewed_at(LocalDateTime.now());
        request.setAdminComment(normalizeAdminComment(adminComment));

        CorrectionRequest saved = correctionRequestRepository.save(request);
        notifyEmployee(saved, LeaveRequestStatus.APPROVED);
        return saved;
    }

    public CorrectionRequest rejectCorrectionRequest(Long id, Long reviewerId, String adminComment) {
        CorrectionRequest request = getCorrectionRequestById(id);

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Can only reject pending correction requests");
        }

        User reviewer = userService.findById(reviewerId);
        request.setStatus(LeaveRequestStatus.REJECTED);
        request.setReviewedBy(reviewer);
        request.setReviewed_at(LocalDateTime.now());
        request.setAdminComment(normalizeAdminComment(adminComment));

        CorrectionRequest saved = correctionRequestRepository.save(request);
        notifyEmployee(saved, LeaveRequestStatus.REJECTED);
        return saved;
    }

    public CorrectionRequest cancelCorrectionRequest(Long id, User requester) {
        CorrectionRequest request = getCorrectionRequestById(id);

        if (requester == null) {
            throw new IllegalStateException("Unauthorized cancel attempt");
        }

        if (requester.getRole() == Role.EMPLOYEE) {
            Long ownerUserId = request.getEmployee() != null && request.getEmployee().getUser() != null
                    ? request.getEmployee().getUser().getId()
                    : null;

            if (ownerUserId == null || !ownerUserId.equals(requester.getId())) {
                throw new IllegalStateException("Cannot cancel another employee's correction request");
            }
        }

        if (request.getStatus() == LeaveRequestStatus.REJECTED ||
                request.getStatus() == LeaveRequestStatus.CANCELLED) {
            throw new IllegalStateException("Cannot cancel request with status: " + request.getStatus());
        }

        request.setStatus(LeaveRequestStatus.CANCELLED);
        request.setReviewed_at(LocalDateTime.now());
        return correctionRequestRepository.save(request);
    }

    public void deleteCorrectionRequest(Long id) {
        CorrectionRequest request = getCorrectionRequestById(id);

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Can only delete pending correction requests");
        }

        correctionRequestRepository.delete(request);
    }

    private static String normalizeAdminComment(String adminComment) {
        if (adminComment == null) return null;
        String trimmed = adminComment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static void validateRequestByType(CorrectionRequest request) {
        if (request.getCorrectionType() == null) {
            throw new IllegalArgumentException("Correction type is required");
        }

        switch (request.getCorrectionType()) {
            case CHECK_IN_TIME -> {
                if (request.getRequestedCheckIn() == null) {
                    throw new IllegalArgumentException("Requested check-in time is required");
                }
            }
            case CHECK_OUT_TIME -> {
                if (request.getRequestedCheckOut() == null) {
                    throw new IllegalArgumentException("Requested check-out time is required");
                }
            }
            case ABSENCE_TYPE -> {
                if (request.getRequestedAbsenceType() == null ||
                        request.getRequestedAbsenceType().isBlank()) {
                    throw new IllegalArgumentException("Requested absence type is required");
                }
            }
        }
    }

    private void notifyEmployee(CorrectionRequest request, LeaveRequestStatus status) {
        Employee employee = request.getEmployee();
        if (employee == null || employee.getUser() == null) return;

        String headline = status == LeaveRequestStatus.APPROVED
                ? "Вашето барање за корекција е одобрено."
                : "Вашето барање за корекција е одбиено.";
        String adminComment = request.getAdminComment();
        String message = adminComment != null
                ? headline + " Коментар на администратор: " + adminComment
                : headline;

        Notification notification = new Notification();
        notification.setType("CORRECTION_REQUEST_" + status.name());
        notification.setMessage(message);
        notification.set_read(false);
        notification.setCreated_at(LocalDateTime.now());
        notification.setUser(employee.getUser());
        notificationRepository.save(notification);
    }
}