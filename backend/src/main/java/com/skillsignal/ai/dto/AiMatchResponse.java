package com.skillsignal.ai.dto;

import java.util.List;

public record AiMatchResponse(
        int dailySearchLimit,
        int dailySearchesUsed,
        int dailySearchesRemaining,
        String briefQuality,
        String aiStatus,
        boolean aiEnhanced,
        String aiSearchId,
        String aiStatusMessage,
        boolean rejected,
        String rejectionReason,
        String summary,
        List<String> requiredSkills,
        List<String> problemTypes,
        List<String> evidenceToLookFor,
        List<String> followUpQuestions,
        List<DeveloperMatchResponse> matches
) {
}
