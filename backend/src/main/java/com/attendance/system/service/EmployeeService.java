package com.attendance.system.service;

import com.attendance.system.dto.EmployeeDTO;
import com.attendance.system.dto.UpdateProfileRequestDTO;
import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;
import com.attendance.system.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserService userService;

    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    public Employee findByUser(User user) {
        return employeeRepository.findByUser(user);
    }

    public Employee createEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee employee) {
        Employee existingEmployee = getEmployeeById(id);

        existingEmployee.setFirst_name(employee.getFirst_name());
        existingEmployee.setLast_name(employee.getLast_name());
        existingEmployee.setDepartment(employee.getDepartment());
        existingEmployee.setPosition(employee.getPosition());
        existingEmployee.setEmployment_date(employee.getEmployment_date());
        existingEmployee.setAllowed_latitude(employee.getAllowed_latitude());
        existingEmployee.setAllowed_longitude(employee.getAllowed_longitude());
        existingEmployee.setAllowed_radius_meters(employee.getAllowed_radius_meters());

        /*
         * The frontend stores the employee face-reference image in user.profilePicture.
         * Attendance.jsx later reads this field and uses it as the reference image
         * for face-api.js face recognition.
         */
        if (employee.getUser() != null && existingEmployee.getUser() != null) {
            User incomingUser = employee.getUser();
            User existingUser = existingEmployee.getUser();

            if (incomingUser.getEmail() != null && !incomingUser.getEmail().isBlank()) {
                existingUser.setEmail(incomingUser.getEmail());
            }

            if (incomingUser.getPhone() != null) {
                existingUser.setPhone(incomingUser.getPhone());
            }

            if (incomingUser.getProfilePicture() != null) {
                existingUser.setProfilePicture(incomingUser.getProfilePicture());
            }

            userService.save(existingUser);
        }

        return employeeRepository.save(existingEmployee);
    }

    public void deleteEmployee(Long id) {
        Employee employee = getEmployeeById(id);
        employeeRepository.delete(employee);
    }

    public Employee updateProfile(Long id, UpdateProfileRequestDTO request) {
        Employee employee = getEmployeeById(id);

        employee.setFirst_name(request.getFirst_name());
        employee.setLast_name(request.getLast_name());

        User user = employee.getUser();

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getProfilePicture() != null) {
            user.setProfilePicture(request.getProfilePicture());
        }

        userService.save(user);

        return employeeRepository.save(employee);
    }

    public EmployeeDTO mapToDTO(Employee employee) {
        User user = employee.getUser();

        String profilePicture = user != null ? user.getProfilePicture() : null;
        boolean hasFacePhoto = profilePicture != null && !profilePicture.isBlank();

        return new EmployeeDTO(
                employee.getId(),
                employee.getFirst_name(),
                employee.getLast_name(),
                employee.getDepartment(),
                employee.getPosition(),
                employee.getEmployment_date(),
                user != null ? user.getEmail() : null,
                user != null ? user.getPhone() : null,
                user != null && user.getRole() != null ? user.getRole().name() : null,
                profilePicture,
                hasFacePhoto
        );
    }
}