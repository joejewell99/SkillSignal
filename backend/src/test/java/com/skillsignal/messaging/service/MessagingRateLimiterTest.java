package com.skillsignal.messaging.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.skillsignal.common.MessagingRateLimitException;
import org.junit.jupiter.api.Test;

class MessagingRateLimiterTest {
    @Test
    void warnsAfterFourMessagesInsideTheOneSecondWindow() {
        MessagingRateLimiter limiter = new MessagingRateLimiter();

        for (int attempt = 0; attempt < 4; attempt++) {
            limiter.check(42L);
        }

        assertThatThrownBy(() -> limiter.check(42L))
                .isInstanceOf(MessagingRateLimitException.class)
                .satisfies(exception -> org.assertj.core.api.Assertions.assertThat(
                        ((MessagingRateLimitException) exception).isWarning()
                ).isTrue());
    }

    @Test
    void locksTheSenderWhenTheyContinueAfterTheWarning() {
        MessagingRateLimiter limiter = new MessagingRateLimiter();

        for (int attempt = 0; attempt < 4; attempt++) {
            limiter.check(42L);
        }
        assertThatThrownBy(() -> limiter.check(42L)).isInstanceOf(MessagingRateLimitException.class);

        assertThatThrownBy(() -> limiter.check(42L))
                .isInstanceOf(MessagingRateLimitException.class)
                .satisfies(exception -> {
                    MessagingRateLimitException rateLimit = (MessagingRateLimitException) exception;
                    org.assertj.core.api.Assertions.assertThat(rateLimit.isWarning()).isFalse();
                    org.assertj.core.api.Assertions.assertThat(rateLimit.getRetryAfterSeconds()).isEqualTo(60);
                });
    }

    @Test
    void tracksUsersIndependently() {
        MessagingRateLimiter limiter = new MessagingRateLimiter();

        for (int attempt = 0; attempt < 4; attempt++) {
            limiter.check(42L);
        }

        limiter.check(43L);
    }
}
