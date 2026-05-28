package com.skillsignal.ai.service;

import java.util.List;

public record BriefAnalysis(
        String normalizedBrief,
        String quality,
        boolean rejected,
        String rejectionReason,
        List<String> requiredSkills,
        List<String> problemTypes,
        List<String> idealTraits,
        List<String> followUpQuestions
) {
}
