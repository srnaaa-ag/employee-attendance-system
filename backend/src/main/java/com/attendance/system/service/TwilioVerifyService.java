package com.attendance.system.service;

import com.attendance.system.config.TwilioProperties;
import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class TwilioVerifyService {

    private final TwilioProperties twilioProperties;

    @PostConstruct
    void initTwilioClient() {
        if (!twilioProperties.isConfigured()) {
            log.warn("Twilio Verify не е конфигуриран — пополнете application-local.properties");
            return;
        }
        if (twilioProperties.usesApiKeyAuth()) {
            Twilio.init(
                    twilioProperties.getApiKeySid(),
                    twilioProperties.getApiKeySecret(),
                    twilioProperties.getAccountSid()
            );
            log.info("Twilio Verify (API Key) — Account {}", maskSid(twilioProperties.getAccountSid()));
        } else if (twilioProperties.usesAuthTokenAuth()) {
            Twilio.init(twilioProperties.getAccountSid(), twilioProperties.getAuthToken());
            log.info("Twilio Verify (Auth Token) — Account {}", maskSid(twilioProperties.getAccountSid()));
        }
    }

    public void sendEmailCode(String email) {
        ensureConfigured();
        String normalized = normalizeEmail(email);
        try {
            Verification verification = Verification.creator(
                            twilioProperties.getVerifyServiceSid(),
                            normalized,
                            "email"
                    )
                    .create();
            log.info("Twilio Verify email sent to {}, status={}", maskEmail(normalized), verification.getStatus());
        } catch (ApiException ex) {
            log.error("Twilio Verify send failed: {} - {}", ex.getCode(), ex.getMessage());
            throw twilioError(ex, "Неуспешно испраќање на код на email.");
        } catch (Exception ex) {
            log.error("Twilio Verify send failed", ex);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Неуспешно испраќање на код на email."
            );
        }
    }

    public void verifyEmailCode(String email, String code) {
        ensureConfigured();
        String normalized = normalizeEmail(email);
        try {
            VerificationCheck check = VerificationCheck.creator(twilioProperties.getVerifyServiceSid())
                    .setTo(normalized)
                    .setCode(code.trim())
                    .create();

            if (!"approved".equalsIgnoreCase(check.getStatus())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невалиден или истечен код.");
            }
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (ApiException ex) {
            log.warn("Twilio Verify check failed: {} - {}", ex.getCode(), ex.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невалиден или истечен код.");
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невалиден или истечен код.");
        }
    }

    public static String normalizeEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email адресата е задолжителна за 2FA."
            );
        }
        String email = rawEmail.trim().toLowerCase();
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Невалидна email адреса.");
        }
        return email;
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int at = email.indexOf('@');
        String local = email.substring(0, at);
        String domain = email.substring(at + 1);
        if (local.length() <= 1) {
            return "*@" + domain;
        }
        return local.charAt(0) + "***@" + domain;
    }

    private void ensureConfigured() {
        if (!twilioProperties.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Twilio не е конфигуриран. Копирај application-local.properties.example "
                            + "во application-local.properties и пополни Account SID, API Key, Verify Service SID."
            );
        }
    }

    private static String maskSid(String sid) {
        if (sid == null || sid.length() < 8) {
            return "???";
        }
        return sid.substring(0, 6) + "…";
    }

    private static ResponseStatusException twilioError(ApiException ex, String prefix) {
        if (ex.getCode() != null && ex.getCode() == 60217) {
            return new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Email не е поврзан со Twilio Verify. "
                            + "Во Console → Verify → твојот Service → вклучи Email и поврзи SendGrid Mailer."
            );
        }
        if (ex.getCode() != null && ex.getCode() == 60222) {
            return new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "SendGrid: From адресата не е верифицирана. "
                            + "Во SendGrid → Sender Authentication / Sender Identity потврди го истиот email "
                            + "што го користиш како From во Twilio Verify → Email."
            );
        }
        String detail = ex.getMoreInfo() != null ? ex.getMoreInfo() : ex.getMessage();
        String msg = prefix + " Twilio: " + ex.getCode() + " — " + detail;
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, msg);
    }
}
