package com.attendance.system.service;

import com.attendance.system.config.TwoFactorProperties;
import com.attendance.system.config.TwilioProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TwoFactorService {

    private final TwoFactorProperties twoFactorProperties;
    private final TwilioProperties twilioProperties;
    private final TwilioVerifyService twilioVerifyService;
    private final EmailOtpService emailOtpService;

    public boolean isEnabled() {
        return twoFactorProperties.isEnabled();
    }

    public String sendCode(String email) {
        ensureDeliveryReady();
        if (twoFactorProperties.isTwilioDelivery()) {
            twilioVerifyService.sendEmailCode(email);
            return "Кодот е испратен на вашиот email. Проверете го сандачето и Spam папката.";
        }
        return emailOtpService.sendCode(email);
    }

    public void verifyCode(String email, String code) {
        ensureDeliveryReady();
        if (twoFactorProperties.isTwilioDelivery()) {
            twilioVerifyService.verifyEmailCode(email, code);
            return;
        }
        emailOtpService.verifyCode(email, code);
    }

    private void ensureDeliveryReady() {
        if (!twoFactorProperties.isTwilioDelivery()) {
            return;
        }
        if (!twilioProperties.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Twilio не е целосно конфигуриран. Во application-local.properties внеси: "
                            + "twilio.auth-token (од Console → Live Auth Token) и "
                            + "twilio.verify-service-sid (VA... од Verify → Services)."
            );
        }
    }
}
