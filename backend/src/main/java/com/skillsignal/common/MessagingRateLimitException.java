package com.skillsignal.common;

public class MessagingRateLimitException extends RuntimeException {
    private final long retryAfterSeconds;
    private final boolean warning;

    public MessagingRateLimitException(String message, long retryAfterSeconds) {
        this(message, retryAfterSeconds, false);
    }

    public MessagingRateLimitException(String message, long retryAfterSeconds, boolean warning) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
        this.warning = warning;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    public boolean isWarning() {
        return warning;
    }
}
