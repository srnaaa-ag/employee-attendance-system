package com.attendance.system.controller;

import com.attendance.system.dto.*;
import com.attendance.system.model.domain.*;
import com.attendance.system.model.enums.LeaveRequestStatus;
import com.attendance.system.service.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/correction-requests")
@RequiredArgsConstructor
public class CorrectionRequestController {

    private final CorrectionRequestService correctionRequestService;
    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<?> createCorrectionRequest(
            @Valid @RequestBody CorrectionRequestCreateDTO dto,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            Employee employee = employeeService.findByUser(user);

            CorrectionRequest request = CorrectionRequest.builder()
                    .correctionType(dto.getCorrectionType())
                    .targetDate(dto.getTargetDate())
                    .requestedCheckIn(dto.getRequestedCheckIn())
                    .requestedCheckOut(dto.getRequestedCheckOut())
                    .requestedAbsenceType(dto.getRequestedAbsenceType())
                    .reason(dto.getReason())
                    .employee(employee)
                    .build();

            CorrectionRequest created = correctionRequestService.createCorrectionRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponseDTO(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<CorrectionRequestResponseDTO>> getAllCorrectionRequests() {
        List<CorrectionRequestResponseDTO> requests = correctionRequestService.getAllCorrectionRequests()
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CorrectionRequestResponseDTO> getCorrectionRequestById(@PathVariable Long id) {
        CorrectionRequest request = correctionRequestService.getCorrectionRequestById(id);
        return ResponseEntity.ok(toResponseDTO(request));
    }

    @GetMapping("/employee/me")
    public ResponseEntity<List<CorrectionRequestResponseDTO>> getMyCorrectionRequests(
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Employee employee = employeeService.findByUser(user);

        List<CorrectionRequestResponseDTO> requests = correctionRequestService
                .getCorrectionRequestsByEmployeeId(employee.getId())
                .stream()
                .map(this::toResponseDTO)
                .toList();

        return ResponseEntity.ok(requests);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<CorrectionRequestResponseDTO>> getCorrectionRequestsByEmployeeId(
            @PathVariable Long employeeId) {
        List<CorrectionRequestResponseDTO> requests = correctionRequestService
                .getCorrectionRequestsByEmployeeId(employeeId)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getCorrectionRequestsByStatus(@PathVariable String status) {
        try {
            LeaveRequestStatus requestStatus = LeaveRequestStatus.valueOf(status.toUpperCase());
            List<CorrectionRequestResponseDTO> requests = correctionRequestService
                    .getCorrectionRequestsByStatus(requestStatus)
                    .stream()
                    .map(this::toResponseDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(requests);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status: " + status);
        }
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approveCorrectionRequest(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CorrectionRequestReviewDTO body,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            String comment = body != null ? body.getAdminComment() : null;
            CorrectionRequest approved = correctionRequestService.approveCorrectionRequest(id, user.getId(), comment);
            return ResponseEntity.ok(toResponseDTO(approved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectCorrectionRequest(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CorrectionRequestReviewDTO body,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            String comment = body != null ? body.getAdminComment() : null;
            CorrectionRequest rejected = correctionRequestService.rejectCorrectionRequest(id, user.getId(), comment);
            return ResponseEntity.ok(toResponseDTO(rejected));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelCorrectionRequest(@PathVariable Long id) {
        try {
            CorrectionRequest cancelled = correctionRequestService.cancelCorrectionRequest(id);
            return ResponseEntity.ok(toResponseDTO(cancelled));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCorrectionRequest(@PathVariable Long id) {
        try {
            correctionRequestService.deleteCorrectionRequest(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    private CorrectionRequestResponseDTO toResponseDTO(CorrectionRequest request) {
        return CorrectionRequestResponseDTO.builder()
                .id(request.getId())
                .correctionType(request.getCorrectionType())
                .targetDate(request.getTargetDate())
                .requestedCheckIn(request.getRequestedCheckIn())
                .requestedCheckOut(request.getRequestedCheckOut())
                .requestedAbsenceType(request.getRequestedAbsenceType())
                .reason(request.getReason())
                .status(request.getStatus())
                .createdAt(request.getCreated_at())
                .reviewedAt(request.getReviewed_at())
                .employeeId(request.getEmployee() != null ? request.getEmployee().getId() : null)
                .employeeName(request.getEmployee() != null
                        ? request.getEmployee().getFirst_name() + " " + request.getEmployee().getLast_name()
                        : null)
                .reviewedById(request.getReviewedBy() != null ? request.getReviewedBy().getId() : null)
                .reviewedByName(request.getReviewedBy() != null ? request.getReviewedBy().getUsername() : null)
                .adminComment(request.getAdminComment())
                .build();
    }
}