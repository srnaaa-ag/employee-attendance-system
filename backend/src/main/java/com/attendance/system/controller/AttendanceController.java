package com.attendance.system.controller;

import com.attendance.system.dto.DashboardAttendanceDTO;
import com.attendance.system.model.domain.User;
import com.attendance.system.service.AttendanceDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
public class AttendanceController {

    private final AttendanceDashboardService attendanceDashboardService;

    @GetMapping("/me/dashboard")
    public ResponseEntity<DashboardAttendanceDTO> myDashboard(
            Authentication authentication,
            @RequestParam(name = "recentLimit", defaultValue = "10") int recentLimit) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(attendanceDashboardService.buildDashboard(user, recentLimit));
    }

    /** Алијас за постари клиенти што повикуваат /attendance/recent?limit= */
    @GetMapping("/recent")
    public ResponseEntity<DashboardAttendanceDTO> recent(
            Authentication authentication,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(attendanceDashboardService.buildDashboard(user, limit));
    }
}
