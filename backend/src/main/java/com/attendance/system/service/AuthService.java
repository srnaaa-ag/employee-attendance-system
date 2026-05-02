package com.attendance.system.service;

import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;
import com.attendance.system.repository.EmployeeRepository;
import com.attendance.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public Employee register(User user, Employee employee) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setIs_active(true);
        User savedUser = userRepository.save(user);
        employee.setUser(savedUser);       
        return employeeRepository.save(employee);
    }

    public Map<String, String> login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Employee employee = employeeRepository.findByUser(user);

        String token = jwtService.generateToken((UserDetails)user);
        return Map.of(
                "token", token,
                "role", user.getRole().name(),
                "email", user.getEmail(),
                "fullName", employee.getFirst_name() + " " + employee.getLast_name()
        );
    }
}