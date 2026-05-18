package xyz.demorgan.jac.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class ClientRegisterRequest {
    private String clientId;

    @NotBlank
    private String hostname;
    private String username;
    private String os;
    private String osVersion;
    private String arch;
    private String appVersion;
    private String ip;
    private List<String> tags;
}

