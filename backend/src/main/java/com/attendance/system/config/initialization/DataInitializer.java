package com.attendance.system.config.initialization;

import com.attendance.system.model.enums.Role;
import com.attendance.system.model.domain.User;
import com.attendance.system.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
        if (userRepository.findByEmail("superadmin@admin.com").isEmpty()) {
            User superAdmin = new User();
            superAdmin.setEmail("superadmin@admin.com");
            superAdmin.setPassword(passwordEncoder.encode("superadmin123"));
            superAdmin.setRole(Role.SUPER_ADMIN);
            superAdmin.setIs_active(true);
            userRepository.save(superAdmin);
        }
    }
}