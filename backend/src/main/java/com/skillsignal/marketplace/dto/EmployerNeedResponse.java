package com.skillsignal.marketplace.dto;

import java.util.List;

public record EmployerNeedResponse(
        String title,
        String problem,
        List<String> requiredSkills,
        String evidenceWanted,
        Boolean featured
) {
}
