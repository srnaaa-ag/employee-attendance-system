package com.attendance.system.config.initialization;

import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.enums.Role;
import com.attendance.system.model.domain.User;
import com.attendance.system.repository.EmployeeRepository;
import com.attendance.system.repository.UserRepository;

import com.attendance.system.model.domain.LeaveRequest;
import com.attendance.system.model.enums.LeaveRequestStatus;
import com.attendance.system.model.enums.LeaveType;
import com.attendance.system.repository.LeaveRequestRepository;

import java.time.LocalDateTime;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private static final String SUPERADMIN_EMAIL = "system.administrator123@gmail.com";

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final LeaveRequestRepository leaveRequestRepository;

    @PostConstruct
    public void init() {

        // ===== SUPER ADMIN =====
        User superAdmin = userRepository.findByEmail(SUPERADMIN_EMAIL).orElseGet(() -> {
            User u = new User();
            u.setEmail(SUPERADMIN_EMAIL);
            u.setPassword(passwordEncoder.encode("superadmin123"));
            u.setRole(Role.SUPER_ADMIN);
            u.setIs_active(true);
            return userRepository.save(u);
        });

        if (employeeRepository.findByUser(superAdmin) == null) {
            Employee emp = new Employee();
            emp.setFirst_name("Super");
            emp.setLast_name("Admin");
            emp.setDepartment("Administration");
            emp.setPosition("Super Administrator");
            emp.setEmployment_date(LocalDate.now());
            emp.setAllowed_latitude(41.9973);
            emp.setAllowed_longitude(21.4280);
            emp.setAllowed_radius_meters(500.0);
            emp.setUser(superAdmin);
            employeeRepository.save(emp);
        }

        // ===== ADMIN =====
        String adminEmail = "admin@admin.com";

        User admin = userRepository.findByEmail(adminEmail).orElseGet(() -> {
            User u = new User();
            u.setEmail(adminEmail);
            u.setPassword(passwordEncoder.encode("admin123"));
            u.setRole(Role.ADMIN);
            u.setIs_active(true);
            return userRepository.save(u);
        });

        if (employeeRepository.findByUser(admin) == null) {
            Employee emp = new Employee();
            emp.setFirst_name("Admin");
            emp.setLast_name("User");
            emp.setDepartment("HR");
            emp.setPosition("HR Manager");
            emp.setEmployment_date(LocalDate.now());
            emp.setAllowed_latitude(41.9973);
            emp.setAllowed_longitude(21.4280);
            emp.setAllowed_radius_meters(500.0);
            emp.setUser(admin);
            employeeRepository.save(emp);
        }

        if (leaveRequestRepository.count() == 0) {
            Employee adminEmp = employeeRepository.findByUser(admin);
            if (adminEmp != null) {
                LeaveRequest sampleAdminLeave = LeaveRequest.builder()
                        .startDate(LocalDate.now().plusDays(3))
                        .endDate(LocalDate.now().plusDays(4))
                        .leave_type(LeaveType.ANNUAL)
                        .reason("Краток одмор")
                        .status(LeaveRequestStatus.PENDING)
                        .created_at(LocalDateTime.now())
                        .employee(adminEmp)
                        .build();

                leaveRequestRepository.save(sampleAdminLeave);
            }
        }
    }
}
