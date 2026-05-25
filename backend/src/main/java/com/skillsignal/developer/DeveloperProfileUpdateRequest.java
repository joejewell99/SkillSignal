package com.skillsignal.developer;

import java.util.List;
import com.skillsignal.marketplace.ProfileProjectResponse;

public record DeveloperProfileUpdateRequest(
        String title,
        String summary,
        String image,
        List<String> skills,
        List<ProfileProjectResponse> projects,
        boolean displayed
) {
}
