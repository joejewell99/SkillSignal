package com.skillsignal.ai.dto;

import java.util.List;

public record AiMatchResponse(
        String summary,
        List<String> requiredSkills,
        List<String> problemTypes,
        List<String> evidenceToLookFor,
        List<DeveloperMatchResponse> matches
) {
}
