package xyz.demorgan.jac.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProcessEventRequest {
    private String eventId;

    @NotBlank
    private String processName;

    private Integer pid;
    private String path;
    private String cmdline;
    private String user;
    private String startTime;
    private String endTime;

    @NotBlank
    private String status;
    private Boolean matchesForbiddenRule;
}

