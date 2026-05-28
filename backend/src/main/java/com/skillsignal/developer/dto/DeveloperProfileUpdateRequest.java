package com.skillsignal.developer.dto;

import java.util.List;
import com.skillsignal.marketplace.dto.DeveloperPreferencesResponse;
import com.skillsignal.marketplace.dto.ProfileContactLinksResponse;
import com.skillsignal.marketplace.dto.ProfilePostResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;

public record DeveloperProfileUpdateRequest(
        String title,
        String summary,
        String image,
        List<String> skills,
        ProfileContactLinksResponse contactLinks,
        DeveloperPreferencesResponse preferences,
        List<ProfileProjectResponse> projects,
        List<ProfilePostResponse> posts,
        boolean displayed
) {
}
