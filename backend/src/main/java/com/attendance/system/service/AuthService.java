package com.attendance.system.service;

import com.attendance.system.dto.LoginResponseDTO;
import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;
import com.attendance.system.repository.EmployeeRepository;
import com.attendance.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TwoFactorService twoFactorService;

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

    public LoginResponseDTO login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Employee employee = employeeRepository.findByUser(user);
        if (employee == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Нема поврзан вработен.");
        }

        if (twoFactorService.isEnabled()) {
            String loginEmail = TwilioVerifyService.normalizeEmail(user.getEmail());
            String otpHint = twoFactorService.sendCode(loginEmail);

            String pendingToken = jwtService.generatePending2FaToken(user.getEmail());
            return LoginResponseDTO.builder()
                    .requires2fa(true)
                    .pendingToken(pendingToken)
                    .maskedEmail(TwilioVerifyService.maskEmail(loginEmail))
                    .otpHint(otpHint)
                    .email(user.getEmail())
                    .build();
        }

        return buildSuccessResponse(user, employee);
    }

    public LoginResponseDTO verifyTwoFactor(String pendingToken, String code) {
        String email;
        try {
            email = jwtService.validatePending2FaTokenAndGetEmail(pendingToken);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сесијата за 2FA истече. Најавете се повторно.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Корисникот не постои."));

        Employee employee = employeeRepository.findByUser(user);
        if (employee == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Нема поврзан вработен.");
        }

        String loginEmail = TwilioVerifyService.normalizeEmail(user.getEmail());
        twoFactorService.verifyCode(loginEmail, code);

        return buildSuccessResponse(user, employee);
    }

    private LoginResponseDTO buildSuccessResponse(User user, Employee employee) {
        String token = jwtService.generateToken((UserDetails) user);
        return LoginResponseDTO.builder()
                .requires2fa(false)
                .token(token)
                .role(user.getRole().name())
                .email(user.getEmail())
                .fullName(employee.getFirst_name() + " " + employee.getLast_name())
                .build();
    }
}
