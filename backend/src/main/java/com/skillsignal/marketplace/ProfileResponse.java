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
        boolean featured,
        boolean displayed,
        List<ProfileProjectResponse> projects
) {
    public static ProfileResponse from(MarketplaceProfile profile) {
        return from(profile, List.of());
    }

    public static ProfileResponse from(MarketplaceProfile profile, List<ProfileProjectResponse> projects) {
        return new ProfileResponse(
                profile.getId(),
                profile.getType().name(),
                profile.getName(),
                profile.getTitle(),
                profile.getSummary(),
                profile.getImage(),
                profile.getSkills(),
                profile.isFeatured(),
                profile.isDisplayed(),
                projects
        );
    }
}
