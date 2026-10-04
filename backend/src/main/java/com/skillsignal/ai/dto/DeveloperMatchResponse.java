package com.skillsignal.ai.dto;

import com.skillsignal.marketplace.dto.ProfileResponse;
import java.util.List;

public record DeveloperMatchResponse(
        ProfileResponse profile,
        double matchScore,
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
        List<String> interviewQuestions,
        Double relativeMatchScore
) {
    public DeveloperMatchResponse(ProfileResponse profile, double matchScore, int readinessScore,
            String readinessLabel, List<String> strengths, List<String> gaps, List<String> evidence,
            String reason, String hiringOutlook, String proofToShow, String nextStep,
            List<String> improvementTips, List<String> interviewQuestions) {
        this(profile, matchScore, readinessScore, readinessLabel, strengths, gaps, evidence,
                reason, hiringOutlook, proofToShow, nextStep, improvementTips, interviewQuestions, null);
    }

    public DeveloperMatchResponse withRelativeScore(double value) {
        return new DeveloperMatchResponse(profile, matchScore, readinessScore, readinessLabel,
                strengths, gaps, evidence, reason, hiringOutlook, proofToShow, nextStep,
                improvementTips, interviewQuestions, value);
    }
}
