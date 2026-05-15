package com.attendance.system.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class TwoFactorProperties {

    @Value("${app.2fa.enabled:false}")
    private boolean enabled;

    /** console = код во backend лог; smtp = вистински email; twilio = Twilio Verify email */
    @Value("${app.2fa.delivery:console}")
    private String delivery;

    @Value("${app.mail.from:noreply@attendance.local}")
    private String mailFrom;

    public boolean isTwilioDelivery() {
        return "twilio".equalsIgnoreCase(delivery);
    }

    public boolean isSmtpDelivery() {
        return "smtp".equalsIgnoreCase(delivery);
    }

    public boolean isConsoleDelivery() {
        return "console".equalsIgnoreCase(delivery);
    }
}
