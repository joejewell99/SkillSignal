package com.skillsignal.marketplace.dto;

public record ProfileContactLinksResponse(
        String linkedinUrl,
        String githubUrl,
        String email,
        String websiteUrl
) {
}
