package com.attendance.system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.attendance.system.model.domain.Employee;
import com.attendance.system.model.domain.User;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Employee findByUser(User user);
}
