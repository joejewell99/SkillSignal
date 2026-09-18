package com.skillsignal.messaging.service;

import com.skillsignal.common.MessagingRateLimitException;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Component;

@Component
public class MessagingRateLimiter {
    private static final int WARNING_MESSAGE_COUNT = 4;
    private static final long WINDOW_NANOS = Duration.ofSeconds(1).toNanos();
    private static final long WARNING_NANOS = Duration.ofSeconds(5).toNanos();
    private static final long COOLDOWN_NANOS = Duration.ofMinutes(1).toNanos();

    private final ConcurrentMap<Long, UserBucket> buckets = new ConcurrentHashMap<>();

    public void check(Long userId) {
        long now = System.nanoTime();
        UserBucket bucket = buckets.computeIfAbsent(userId, ignored -> new UserBucket());

        synchronized (bucket) {
            if (bucket.cooldownUntilNanos > now) {
                throw tooManyMessages(bucket.cooldownUntilNanos - now);
            }

            if (bucket.warningUntilNanos > now) {
                bucket.warningUntilNanos = 0;
                bucket.cooldownUntilNanos = now + COOLDOWN_NANOS;
                bucket.sentAtNanos.clear();
                throw tooManyMessages(COOLDOWN_NANOS);
            }

            while (!bucket.sentAtNanos.isEmpty() && now - bucket.sentAtNanos.peekFirst() >= WINDOW_NANOS) {
                bucket.sentAtNanos.removeFirst();
            }

            if (bucket.sentAtNanos.size() >= WARNING_MESSAGE_COUNT) {
                bucket.warningUntilNanos = now + WARNING_NANOS;
                throw warning();
            }

            bucket.sentAtNanos.addLast(now);
        }
    }

    private MessagingRateLimitException tooManyMessages(long remainingNanos) {
        long seconds = Math.max(1, (long) Math.ceil(remainingNanos / 1_000_000_000d));
        return new MessagingRateLimitException(
                "Messaging is paused because you sent too many messages. Try again in " + seconds + " seconds.",
                seconds
        );
    }

    private MessagingRateLimitException warning() {
        return new MessagingRateLimitException(
                "Warning: you are sending messages too quickly. Send another message and messaging will be paused for 1 minute.",
                0,
                true
        );
    }

    private static final class UserBucket {
        private final Deque<Long> sentAtNanos = new ArrayDeque<>();
        private long cooldownUntilNanos;
        private long warningUntilNanos;
    }
}
