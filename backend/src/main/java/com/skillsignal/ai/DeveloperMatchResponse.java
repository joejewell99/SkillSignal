package com.skillsignal.ai;

import com.skillsignal.marketplace.ProfileResponse;
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
