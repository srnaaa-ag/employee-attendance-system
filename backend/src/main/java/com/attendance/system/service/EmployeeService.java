package com.attendance.system.service;

import com.attendance.system.dto.EmployeeDTO;
import com.attendance.system.dto.UpdateProfileRequestDTO;
import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;
import com.attendance.system.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private static final LocalTime DEFAULT_WORK_START = LocalTime.of(8, 0);
    private static final LocalTime DEFAULT_WORK_END = LocalTime.of(16, 0);
    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("HH:mm", Locale.ROOT);

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
        applyDefaultWorkTimeIfMissing(employee);
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

        if (employee.getWork_start_time() != null) {
            existingEmployee.setWork_start_time(employee.getWork_start_time());
        }

        if (employee.getWork_end_time() != null) {
            existingEmployee.setWork_end_time(employee.getWork_end_time());
        }

        applyDefaultWorkTimeIfMissing(existingEmployee);

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

        LocalTime workStart = getWorkStart(employee);
        LocalTime workEnd = getWorkEnd(employee);

        return new EmployeeDTO(
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
                formatWorkSchedule(workStart, workEnd),
                user != null ? user.getEmail() : null,
                user != null ? user.getPhone() : null,
                user != null && user.getRole() != null ? user.getRole().name() : null,
                profilePicture,
                hasFacePhoto
        );
    }

    private void applyDefaultWorkTimeIfMissing(Employee employee) {
        if (employee.getWork_start_time() == null) {
            employee.setWork_start_time(DEFAULT_WORK_START);
        }

        if (employee.getWork_end_time() == null) {
            employee.setWork_end_time(DEFAULT_WORK_END);
        }
    }

    public static LocalTime getWorkStart(Employee employee) {
        return employee.getWork_start_time() != null
                ? employee.getWork_start_time()
                : DEFAULT_WORK_START;
    }

    public static LocalTime getWorkEnd(Employee employee) {
        return employee.getWork_end_time() != null
                ? employee.getWork_end_time()
                : DEFAULT_WORK_END;
    }

    public static String formatWorkSchedule(LocalTime start, LocalTime end) {
        return start.format(TIME_FMT) + " - " + end.format(TIME_FMT);
    }
}