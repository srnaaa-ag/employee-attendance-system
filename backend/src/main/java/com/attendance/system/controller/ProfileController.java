package com.attendance.system.controller;

import com.attendance.system.dto.UpdateProfileRequestDTO;
import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;
import com.attendance.system.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;


@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
public class ProfileController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<Employee> getMyProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(employeeService.findByUser(user));
    }

    @PutMapping
    public ResponseEntity<Employee> updateMyProfile(Authentication authentication, @RequestBody UpdateProfileRequestDTO request) {
        User user = (User) authentication.getPrincipal();
        Employee emp = employeeService.findByUser(user);
        return ResponseEntity.ok(employeeService.updateProfile(emp.getId(), request));
    }
}

//package com.attendance.system.controller;
//
//import com.attendance.system.dto.UpdateProfileRequest;
//import com.attendance.system.model.domain.Employee;
//import com.attendance.system.service.EmployeeService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/profile")
//@RequiredArgsConstructor
//@PreAuthorize("hasRole('EMPLOYEE')")
//public class ProfileController {
//
//    private final EmployeeService employeeService;
//
//    @GetMapping("/{id}")
//    public ResponseEntity<Employee> getProfile(@PathVariable Long id) {
//        return ResponseEntity.ok(employeeService.getEmployeeById(id));
//    }
//
//    @PutMapping("/{id}")
//    public ResponseEntity<Employee> updateProfile(@PathVariable Long id, @RequestBody UpdateProfileRequest request) {
//        return ResponseEntity.ok(employeeService.updateProfile(id, request));
//    }
//}