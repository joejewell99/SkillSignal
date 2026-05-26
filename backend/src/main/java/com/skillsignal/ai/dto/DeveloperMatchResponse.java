package com.skillsignal.ai.dto;

import com.skillsignal.marketplace.dto.ProfileResponse;
import java.util.List;

public record DeveloperMatchResponse(
        ProfileResponse profile,
        int matchScore,
        List<String> strengths,
        List<String> gaps,
        String reason,
        List<String> interviewQuestions
) {
}
