package com.attendance.system.controller;

import com.attendance.system.dto.EmployeeRegistrationRequest;
import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;
import com.attendance.system.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Employee> registerEmployee(@RequestBody EmployeeRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(authService.register(request.getUser(), request.getEmployee()));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody User request) {
        return ResponseEntity.ok(authService.login(request.getEmail(), request.getPassword()));
    }
}