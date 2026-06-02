package com.skillsignal.ai.dto;

import com.skillsignal.marketplace.dto.ProfileResponse;
import java.util.List;

public record DeveloperMatchResponse(
        ProfileResponse profile,
        int matchScore,
        int readinessScore,
        String readinessLabel,
        List<String> strengths,
        List<String> gaps,
        List<String> evidence,
        String reason,
        String hiringOutlook,
        String proofToShow,
        String nextStep,
        List<String> improvementTips,
        List<String> interviewQuestions
) {
}
