package com.attendance.system.controller;

import com.attendance.system.dto.AttendanceActionRequestDTO;
import com.attendance.system.dto.DashboardAttendanceDTO;
import com.attendance.system.model.domain.User;
import com.attendance.system.service.AttendanceDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
public class AttendanceController {

    private final AttendanceDashboardService attendanceDashboardService;

    @GetMapping("/me/dashboard")
    public ResponseEntity<DashboardAttendanceDTO> myDashboard(
            Authentication authentication,
            @RequestParam(name = "recentLimit", defaultValue = "10") int recentLimit
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(attendanceDashboardService.buildDashboard(user, recentLimit));
    }

    /** Алијас за постари клиенти што повикуваат /attendance/recent?limit= */
    @GetMapping("/recent")
    public ResponseEntity<DashboardAttendanceDTO> recent(
            Authentication authentication,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(attendanceDashboardService.buildDashboard(user, limit));
    }

    @PostMapping("/check-in")
    public ResponseEntity<DashboardAttendanceDTO> checkIn(
            Authentication authentication,
            @RequestBody AttendanceActionRequestDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(attendanceDashboardService.checkIn(user, request));
    }

    @PostMapping("/check-out")
    public ResponseEntity<DashboardAttendanceDTO> checkOut(
            Authentication authentication,
            @RequestBody AttendanceActionRequestDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(attendanceDashboardService.checkOut(user, request));
    }
}