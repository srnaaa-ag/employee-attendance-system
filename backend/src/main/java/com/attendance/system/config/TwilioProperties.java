package com.attendance.system.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class TwilioProperties {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    /** Алтернатива на API Key — од Console → Live credentials → Auth Token */
    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.api-key-sid:}")
    private String apiKeySid;

    @Value("${twilio.api-key-secret:}")
    private String apiKeySecret;

    @Value("${twilio.verify-service-sid:}")
    private String verifyServiceSid;

    @PostConstruct
    void trimValues() {
        accountSid = trim(accountSid);
        authToken = trim(authToken);
        apiKeySid = trim(apiKeySid);
        apiKeySecret = trim(apiKeySecret);
        verifyServiceSid = trim(verifyServiceSid);
    }

    public boolean usesApiKeyAuth() {
        return isPresent(accountSid) && isPresent(apiKeySid) && isPresent(apiKeySecret);
    }

    public boolean usesAuthTokenAuth() {
        return isPresent(accountSid) && isPresent(authToken);
    }

    public boolean isConfigured() {
        if (!isPresent(verifyServiceSid) || !verifyServiceSid.startsWith("VA")) {
            return false;
        }
        if (usesApiKeyAuth()) {
            return apiKeySid.startsWith("SK") && !looksLikePlaceholder(apiKeySecret);
        }
        if (usesAuthTokenAuth()) {
            return accountSid.startsWith("AC") && !looksLikePlaceholder(authToken);
        }
        return false;
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static boolean looksLikePlaceholder(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String v = value.toUpperCase();
        return v.contains("ВНЕСИ")
                || v.contains("PLACEHOLDER")
                || v.contains("YOUR_")
                || v.contains("HERE")
                || v.contains("XXXX");
    }
}
