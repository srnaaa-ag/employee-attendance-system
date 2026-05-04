package com.attendance.system.dto;
import jakarta.validation.constraints.Size;
import lombok.Data;
@Data
public class LeaveRequestReviewDTO {

    @Size(max = 500, message = "Коментарот не смее да надмине 500 знаци")
    private String adminComment;

}
