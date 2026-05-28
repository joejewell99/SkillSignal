package com.skillsignal.ai.service;

public record AiSearchQuota(
        int dailyLimit,
        int used,
        int remaining
) {
    public boolean unlimited() {
        return dailyLimit < 0;
    }
}
