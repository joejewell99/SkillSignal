package com.skillsignal.ai.service;

import com.skillsignal.ai.model.AiSearchUsage;
import com.skillsignal.ai.repository.AiSearchUsageRepository;
import com.skillsignal.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HexFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiSearchQuotaService {
    private static final String UNLIMITED_TEST_EMAIL = "joejewell99@hotmail.com";
    private static final int GUEST_DAILY_LIMIT = 3;
    private static final int DEVELOPER_DAILY_LIMIT = 5;
    private static final int EMPLOYER_DAILY_LIMIT = 10;
    private static final int UNLIMITED = -1;

    private final AiSearchUsageRepository usageRepository;

    public AiSearchQuotaService(AiSearchUsageRepository usageRepository) {
        this.usageRepository = usageRepository;
    }

    public AiSearchQuota consumeSearch(Authentication authentication, HttpServletRequest request) {
        SearchSubject subject = resolveSubject(authentication, request);
        if (subject.dailyLimit() == UNLIMITED) {
            return new AiSearchQuota(UNLIMITED, 0, UNLIMITED);
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        AiSearchUsage usage = usageRepository
                .findBySubjectTypeAndSubjectKeyAndUsageDate(subject.type(), subject.key(), today)
                .orElseGet(() -> new AiSearchUsage(subject.type(), subject.key(), today));

        if (usage.getSearchCount() >= subject.dailyLimit()) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "You have used today's AI search allowance. Sign in or come back tomorrow for more searches."
            );
        }

        usage.increment();
        AiSearchUsage savedUsage = usageRepository.save(usage);
        int used = savedUsage.getSearchCount();
        return new AiSearchQuota(subject.dailyLimit(), used, Math.max(0, subject.dailyLimit() - used));
    }

    private SearchSubject resolveSubject(Authentication authentication, HttpServletRequest request) {
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            if (UNLIMITED_TEST_EMAIL.equalsIgnoreCase(principal.getUsername())) {
                return new SearchSubject("USER", String.valueOf(principal.id()), UNLIMITED);
            }
            return switch (principal.role()) {
                case "ADMIN" -> new SearchSubject("USER", String.valueOf(principal.id()), UNLIMITED);
                case "EMPLOYER" -> new SearchSubject("USER", String.valueOf(principal.id()), EMPLOYER_DAILY_LIMIT);
                case "DEVELOPER" -> new SearchSubject("USER", String.valueOf(principal.id()), DEVELOPER_DAILY_LIMIT);
                default -> new SearchSubject("USER", String.valueOf(principal.id()), GUEST_DAILY_LIMIT);
            };
        }

        return new SearchSubject("GUEST", guestFingerprint(request), GUEST_DAILY_LIMIT);
    }

    private String guestFingerprint(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        String ipAddress = forwardedFor == null || forwardedFor.isBlank()
                ? request.getRemoteAddr()
                : forwardedFor.split(",")[0].trim();
        String userAgent = request.getHeader("User-Agent") == null ? "" : request.getHeader("User-Agent");
        return sha256(ipAddress + "|" + userAgent);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private record SearchSubject(String type, String key, int dailyLimit) {
    }
}
