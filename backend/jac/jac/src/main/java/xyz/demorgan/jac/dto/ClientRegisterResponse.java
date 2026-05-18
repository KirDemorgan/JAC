package xyz.demorgan.jac.dto;

import lombok.Data;

@Data
public class ClientRegisterResponse {
    private String clientId;
    private String apiKey;
    private String issuedAt;
    private String expiresAt;
}

