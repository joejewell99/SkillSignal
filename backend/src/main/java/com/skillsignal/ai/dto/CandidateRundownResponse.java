package com.skillsignal.ai.dto;

import java.util.List;

public record CandidateRundownResponse(
        String summary,
        List<EvidencePoint> evidence,
        List<String> uncertainties,
        String nextStep,
        int dailySearchesRemaining
) {
    public record EvidencePoint(String projectName, String description, String githubUrl, String liveUrl,
                                String whyItMatters, String question) {}
}
