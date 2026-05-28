package com.skillsignal.marketplace.dto;

public record ProfileMetricsResponse(
        long totalAccounts,
        long publicProfiles,
        long developerProfiles,
        long employerProfiles
) {
}
