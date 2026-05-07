package com.attendance.system.repository;

import com.attendance.system.model.domain.AttendanceRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    @Query("select a from AttendanceRecord a where a.check_in_time >= :from and a.check_in_time < :toExclusive")
    List<AttendanceRecord> findByCheckInTimeRange(
            @Param("from") LocalDateTime from,
            @Param("toExclusive") LocalDateTime toExclusive
    );

    @Query("""
           select a from AttendanceRecord a
           where a.employee.id = :eid
             and a.check_in_time >= :start
             and a.check_in_time < :end
           order by a.check_in_time desc
           """)
    List<AttendanceRecord> findByEmployeeAndCheckInRange(
            @Param("eid") Long employeeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
           select a from AttendanceRecord a
           where a.employee.id = :eid
           order by a.check_in_time desc
           """)
    List<AttendanceRecord> findRecentByEmployeeId(
            @Param("eid") Long employeeId,
            Pageable pageable
    );

    @Query("""
           select a from AttendanceRecord a
           where a.employee.id = :eid
             and a.check_in_time >= :start
             and a.check_in_time < :end
           order by a.check_in_time desc
           """)
    Optional<AttendanceRecord> findLatestTodayRecord(
            @Param("eid") Long employeeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}