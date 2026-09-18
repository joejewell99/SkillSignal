package com.skillsignal.ai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.skillsignal.ai.model.AiSearchUsage;
import com.skillsignal.ai.repository.AiSearchUsageRepository;
import com.skillsignal.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

class AiSearchQuotaServiceTest {
    private final AiSearchUsageRepository usageRepository = mock(AiSearchUsageRepository.class);
    private final AiSearchQuotaService service = new AiSearchQuotaService(usageRepository);
    private final HttpServletRequest request = mock(HttpServletRequest.class);

    @Test
    void personalTestAccountHasUnlimitedDailyAllowance() {
        UserPrincipal principal = principal("joejewell99@hotmail.com", "DEVELOPER");
        AiSearchQuota quota = service.consumeSearch(authentication(principal), request);

        assertThat(quota.dailyLimit()).isEqualTo(-1);
        assertThat(quota.remaining()).isEqualTo(-1);
        assertThat(quota.unlimited()).isTrue();
    }

    @Test
    void sixthDeveloperSearchIsRejected() {
        UserPrincipal principal = principal("developer@example.test", "DEVELOPER");
        AiSearchUsage usage = new AiSearchUsage("USER", "42", LocalDate.now(ZoneOffset.UTC));
        when(usageRepository.findBySubjectTypeAndSubjectKeyAndUsageDate(
                "USER", "42", LocalDate.now(ZoneOffset.UTC))).thenReturn(Optional.of(usage));
        when(usageRepository.save(usage)).thenReturn(usage);

        for (int attempt = 0; attempt < 5; attempt += 1) {
            service.consumeSearch(authentication(principal), request);
        }

        assertThatThrownBy(() -> service.consumeSearch(authentication(principal), request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
    }

    private UserPrincipal principal(String email, String role) {
        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.id()).thenReturn(42L);
        when(principal.role()).thenReturn(role);
        when(principal.getUsername()).thenReturn(email);
        return principal;
    }

    private Authentication authentication(UserPrincipal principal) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(principal);
        return authentication;
    }
}
