package com.skillsignal.marketplace.dto;

import java.util.List;

public record ProofQualityResponse(
        int score,
        String label,
        List<String> completedChecks,
        List<String> missingChecks
) {
}
