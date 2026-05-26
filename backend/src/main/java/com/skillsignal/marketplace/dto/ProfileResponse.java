package com.skillsignal.marketplace.dto;

import com.skillsignal.marketplace.model.MarketplaceProfile;
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
        List<ProfileProjectResponse> projects,
        List<ProfilePostResponse> posts
) {
    public static ProfileResponse from(MarketplaceProfile profile) {
        return from(profile, List.of(), List.of());
    }

    public static ProfileResponse from(MarketplaceProfile profile, List<ProfileProjectResponse> projects) {
        return from(profile, projects, List.of());
    }

    public static ProfileResponse from(MarketplaceProfile profile, List<ProfileProjectResponse> projects, List<ProfilePostResponse> posts) {
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
                projects,
                posts
        );
    }
}
