package com.attendance.system.config.initialization;

import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.enums.Role;
import com.attendance.system.model.domain.User;
import com.attendance.system.repository.EmployeeRepository;
import com.attendance.system.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private static final String SUPERADMIN_EMAIL = "superadmin@admin.com";

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
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
    }
}
