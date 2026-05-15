package com.attendance.system.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OtpStore {

    private static final long TTL_SECONDS = 600;

    private final Map<String, OtpEntry> codesByEmail = new ConcurrentHashMap<>();

    public void save(String email, String code) {
        codesByEmail.put(
                normalizeKey(email),
                new OtpEntry(code, Instant.now().plusSeconds(TTL_SECONDS))
        );
    }

    public boolean verifyAndConsume(String email, String code) {
        String key = normalizeKey(email);
        OtpEntry entry = codesByEmail.get(key);
        if (entry == null) {
            return false;
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            codesByEmail.remove(key);
            return false;
        }
        if (!entry.code().equals(code.trim())) {
            return false;
        }
        codesByEmail.remove(key);
        return true;
    }

    private static String normalizeKey(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private record OtpEntry(String code, Instant expiresAt) {}
}
