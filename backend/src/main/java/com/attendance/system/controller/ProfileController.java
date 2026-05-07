package com.attendance.system.controller;

import com.attendance.system.dto.ProfileDTO;
import com.attendance.system.dto.UpdateProfileRequestDTO;
import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;
import com.attendance.system.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
public class ProfileController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<ProfileDTO> getMyProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        Employee employee = employeeService.findByUser(user);

        if (employee == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(mapToProfileDTO(employee));
    }

    @PutMapping
    public ResponseEntity<ProfileDTO> updateMyProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequestDTO request
    ) {
        User user = (User) authentication.getPrincipal();

        Employee employee = employeeService.findByUser(user);

        if (employee == null) {
            return ResponseEntity.notFound().build();
        }

        Employee updatedEmployee = employeeService.updateProfile(employee.getId(), request);

        return ResponseEntity.ok(mapToProfileDTO(updatedEmployee));
    }

    private ProfileDTO mapToProfileDTO(Employee employee) {
        User user = employee.getUser();

        String profilePicture = user != null ? user.getProfilePicture() : null;
        boolean hasFacePhoto = profilePicture != null && !profilePicture.isBlank();

        LocalTime workStart = EmployeeService.getWorkStart(employee);
        LocalTime workEnd = EmployeeService.getWorkEnd(employee);

        return new ProfileDTO(
                employee.getId(),
                employee.getFirst_name(),
                employee.getLast_name(),
                employee.getDepartment(),
                employee.getPosition(),
                employee.getEmployment_date(),
                employee.getAllowed_latitude(),
                employee.getAllowed_longitude(),
                employee.getAllowed_radius_meters(),
                workStart,
                workEnd,
                EmployeeService.formatWorkSchedule(workStart, workEnd),
                user != null ? user.getEmail() : null,
                user != null ? user.getPhone() : null,
                user != null && user.getRole() != null ? user.getRole().name() : null,
                profilePicture,
                hasFacePhoto
        );
    }
}