package com.attendance.system.controller;

import com.attendance.system.dto.*;
import com.attendance.system.model.domain.*;
import com.attendance.system.model.enums.*;
import com.attendance.system.service.*;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;
    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<?> createLeaveRequest(@Valid @RequestBody LeaveRequestCreateDTO dto,Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            Employee employee = employeeService.findByUser(user);

            LeaveRequest leaveRequest = LeaveRequest.builder()
                    .startDate(dto.getStartDate())
                    .endDate(dto.getEndDate())
                    .leave_type(dto.getLeaveType())
                    .reason(dto.getReason())
                    .employee(employee)
                    .build();

            LeaveRequest created = leaveRequestService.createLeaveRequest(leaveRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponseDTO(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<LeaveRequestResponseDTO>> getAllLeaveRequests() {
        List<LeaveRequestResponseDTO> requests = leaveRequestService.getAllLeaveRequests()
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveRequestResponseDTO> getLeaveRequestById(@PathVariable Long id) {
        LeaveRequest request = leaveRequestService.getLeaveRequestById(id);
        return ResponseEntity.ok(toResponseDTO(request));
    }

    @GetMapping("/employee/me")
    public ResponseEntity<List<LeaveRequestResponseDTO>> getMyLeaveRequests(Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        Employee employee = employeeService.findByUser(user);

        List<LeaveRequestResponseDTO> requests = leaveRequestService.getLeaveRequestsByEmployeeId(employee.getId())
                .stream()
                .map(this::toResponseDTO)
                .toList();

        return ResponseEntity.ok(requests);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequestResponseDTO>> getLeaveRequestsByEmployeeId(
            @PathVariable Long employeeId) {
        List<LeaveRequestResponseDTO> requests = leaveRequestService.getLeaveRequestsByEmployeeId(employeeId)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getLeaveRequestsByStatus(@PathVariable String status) {
        try {
            LeaveRequestStatus requestStatus = LeaveRequestStatus.valueOf(status.toUpperCase());
            List<LeaveRequestResponseDTO> requests = leaveRequestService.getLeaveRequestsByStatus(requestStatus)
                    .stream()
                    .map(this::toResponseDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(requests);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status: " + status);
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<LeaveRequestResponseDTO>> getLeaveRequestsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "dd.MM.yyyy") LocalDate startDate,
            @RequestParam @DateTimeFormat(pattern = "dd.MM.yyyy") LocalDate endDate) {
        List<LeaveRequestResponseDTO> requests = leaveRequestService
                .getLeaveRequestsByDateRange(startDate, endDate)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLeaveRequest(
            @PathVariable Long id,
            @Valid @RequestBody LeaveRequestUpdateDTO dto) {
        try {
            LeaveRequest updateRequest = LeaveRequest.builder()
                    .startDate(dto.getStartDate())
                    .endDate(dto.getEndDate())
                    .leave_type(dto.getLeaveType())
                    .reason(dto.getReason())
                    .build();

            LeaveRequest updated = leaveRequestService.updateLeaveRequest(id, updateRequest);
            return ResponseEntity.ok(toResponseDTO(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approveLeaveRequest(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) LeaveRequestReviewDTO body,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            String comment = body != null ? body.getAdminComment() : null;
            LeaveRequest approved = leaveRequestService.approveLeaveRequest(id, user.getId(), comment);            return ResponseEntity.ok(toResponseDTO(approved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectLeaveRequest(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) LeaveRequestReviewDTO body,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            String comment = body != null ? body.getAdminComment() : null;
            LeaveRequest rejected = leaveRequestService.rejectLeaveRequest(id, user.getId(), comment);            return ResponseEntity.ok(toResponseDTO(rejected));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelLeaveRequest(@PathVariable Long id) {
        try {
            LeaveRequest cancelled = leaveRequestService.cancelLeaveRequest(id);
            return ResponseEntity.ok(toResponseDTO(cancelled));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLeaveRequest(@PathVariable Long id) {
        try {
            leaveRequestService.deleteLeaveRequest(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    private LeaveRequestResponseDTO toResponseDTO(LeaveRequest request) {
        return LeaveRequestResponseDTO.builder()
                .id(request.getId())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .leaveType(request.getLeave_type().name())
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