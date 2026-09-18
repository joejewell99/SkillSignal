package com.skillsignal.security;

public final class JwtSessionPolicy {
    public static final long MINIMUM_EXPIRATION_MS = 24L * 60L * 60L * 1000L;

    private JwtSessionPolicy() {
    }

    public static long effectiveExpirationMs(long configuredExpirationMs) {
        return Math.max(configuredExpirationMs, MINIMUM_EXPIRATION_MS);
    }
}
