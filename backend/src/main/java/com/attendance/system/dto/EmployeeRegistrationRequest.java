package com.attendance.system.dto;

import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;

import lombok.Data;

@Data
public class EmployeeRegistrationRequest {
    private User user;
    private Employee employee;
}