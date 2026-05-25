package com.skillsignal.marketplace;

import java.util.List;

public record ProfileProjectResponse(
        String name,
        String description,
        String githubUrl,
        String liveUrl,
        List<String> skills,
        List<String> images,
        Boolean featured
) {
}
