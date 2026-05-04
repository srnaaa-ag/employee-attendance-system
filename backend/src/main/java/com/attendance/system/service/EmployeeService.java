package com.attendance.system.service;

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

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Employee not found with id: " + id));
    }

    public Employee findByUser(User user) {
        return employeeRepository.findByUser(user);
    }

    public Employee createEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee employee) {
        Employee emp = getEmployeeById(id);
        emp.setFirst_name(employee.getFirst_name());
        emp.setLast_name(employee.getLast_name());
        emp.setAllowed_latitude(employee.getAllowed_latitude());
        emp.setAllowed_longitude(employee.getAllowed_longitude());
        emp.setDepartment(employee.getDepartment());
        emp.setAllowed_radius_meters(employee.getAllowed_radius_meters());
        emp.setEmployment_date(employee.getEmployment_date());
        emp.setPosition(employee.getPosition());

        return employeeRepository.save(emp);
    }

    public void deleteEmployee(Long id) {
        Employee emp = getEmployeeById(id);
        employeeRepository.delete(emp);
    }

    public Employee updateProfile(Long id, UpdateProfileRequestDTO request) {
        Employee emp = getEmployeeById(id);
        emp.setFirst_name(request.getFirst_name());
        emp.setLast_name(request.getLast_name());
        emp.setDepartment(request.getDepartment());
        emp.setPosition(request.getPosition());
        return employeeRepository.save(emp);
    }
}
