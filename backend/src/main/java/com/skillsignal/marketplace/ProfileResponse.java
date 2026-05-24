package com.skillsignal.marketplace;

import java.util.List;

public record ProfileResponse(
        Long id,
        String type,
        String name,
        String title,
        String summary,
        String image,
        List<String> skills,
        boolean featured
) {
    static ProfileResponse from(MarketplaceProfile profile) {
        return new ProfileResponse(
                profile.getId(),
                profile.getType().name(),
                profile.getName(),
                profile.getTitle(),
                profile.getSummary(),
                profile.getImage(),
                profile.getSkills(),
                profile.isFeatured()
        );
    }
}

