package com.attendance.system.service;

import com.attendance.system.config.TwoFactorProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailOtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpStore otpStore;
    private final TwoFactorProperties twoFactorProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    public String sendCode(String email) {
        String normalized = TwilioVerifyService.normalizeEmail(email);
        String code = generateCode();
        otpStore.save(normalized, code);

        if (twoFactorProperties.isConsoleDelivery()) {
            log.warn("========== 2FA КОД (dev/console) за {}: {} ==========", normalized, code);
            return "За локален развој: кодот е во backend конзолата (погледни го терминалот каде работи Spring Boot).";
        }

        if (twoFactorProperties.isSmtpDelivery()) {
            sendSmtpMail(normalized, code);
            return "Кодот е испратен на вашиот email. Проверете го и Spam папката.";
        }

        throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "2FA email не е конфигуриран. Поставете app.2fa.delivery=console или SMTP подесувања."
        );
    }

    public void verifyCode(String email, String code) {
        String normalized = TwilioVerifyService.normalizeEmail(email);
        if (!otpStore.verifyAndConsume(normalized, code)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невалиден или истечен код.");
        }
    }

    private void sendSmtpMail(String to, String code) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "SMTP не е конфигуриран. Додај spring.mail.* во application-local.properties."
            );
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(twoFactorProperties.getMailFrom());
            message.setTo(to);
            message.setSubject("Код за најава – Employee Attendance");
            message.setText(
                    "Вашиот код за дво-факторска најава е: " + code + "\n\n"
                            + "Кодот важи 10 минути.\n"
                            + "Ако не сте побарале најава, игнорирајте ја пораката."
            );
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("SMTP 2FA failed for {}", to, ex);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Неуспешно испраќање на email. Проверете spring.mail.* подесувањата."
            );
        }
    }

    private static String generateCode() {
        int n = RANDOM.nextInt(900_000) + 100_000;
        return String.valueOf(n);
    }
}
