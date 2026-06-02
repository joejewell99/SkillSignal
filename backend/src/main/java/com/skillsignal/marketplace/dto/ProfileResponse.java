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
        boolean acceptsConnections,
        boolean demoProfile,
        ProfileContactLinksResponse contactLinks,
        DeveloperPreferencesResponse preferences,
        List<ProfileProjectResponse> projects,
        List<EmployerNeedResponse> needs,
        ProofQualityResponse proofQuality,
        List<ProfilePostResponse> posts
) {
    public static ProfileResponse from(MarketplaceProfile profile) {
        return from(profile, List.of(), List.of(), null, List.of());
    }

    public static ProfileResponse from(MarketplaceProfile profile, List<ProfileProjectResponse> projects) {
        return from(profile, projects, List.of(), null, List.of());
    }

    public static ProfileResponse from(MarketplaceProfile profile, List<ProfileProjectResponse> projects, List<ProfilePostResponse> posts) {
        return from(profile, projects, List.of(), null, posts);
    }

    public static ProfileResponse from(
            MarketplaceProfile profile,
            List<ProfileProjectResponse> projects,
            List<EmployerNeedResponse> needs,
            ProofQualityResponse proofQuality,
            List<ProfilePostResponse> posts
    ) {
        return from(profile, projects, needs, proofQuality, posts, null);
    }

    public static ProfileResponse from(
            MarketplaceProfile profile,
            List<ProfileProjectResponse> projects,
            List<EmployerNeedResponse> needs,
            ProofQualityResponse proofQuality,
            List<ProfilePostResponse> posts,
            ProfileContactLinksResponse contactLinks
    ) {
        return from(profile, projects, needs, proofQuality, posts, contactLinks, null);
    }

    public static ProfileResponse from(
            MarketplaceProfile profile,
            List<ProfileProjectResponse> projects,
            List<EmployerNeedResponse> needs,
            ProofQualityResponse proofQuality,
            List<ProfilePostResponse> posts,
            ProfileContactLinksResponse contactLinks,
            DeveloperPreferencesResponse preferences
    ) {
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
                profile.getType().name().equals("DEVELOPER") && profile.getUserId() != null,
                profile.isDemoProfile(),
                contactLinks,
                preferences,
                projects,
                needs,
                proofQuality,
                posts
        );
    }
}
