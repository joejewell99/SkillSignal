package com.skillsignal.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JwtSessionPolicyTest {
    @Test
    void clampsShortConfiguredSessionsToTwentyFourHours() {
        assertThat(JwtSessionPolicy.effectiveExpirationMs(60 * 60 * 1000L))
                .isEqualTo(JwtSessionPolicy.MINIMUM_EXPIRATION_MS);
    }

    @Test
    void preservesLongerConfiguredSessions() {
        long twoDays = 2L * JwtSessionPolicy.MINIMUM_EXPIRATION_MS;

        assertThat(JwtSessionPolicy.effectiveExpirationMs(twoDays)).isEqualTo(twoDays);
    }
}
