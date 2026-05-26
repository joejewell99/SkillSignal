package com.skillsignal.employer;

import com.skillsignal.marketplace.ProfilePostResponse;
import java.util.List;

public record EmployerProfileUpdateRequest(
        String title,
        String summary,
        String image,
        List<String> skills,
        List<ProfilePostResponse> posts,
        boolean displayed
) {
}
