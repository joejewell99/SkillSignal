package com.skillsignal.employer.dto;

import com.skillsignal.marketplace.dto.ProfilePostResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import java.util.List;

public record EmployerProfileUpdateRequest(
        String title,
        String summary,
        String image,
        List<String> skills,
        List<ProfileProjectResponse> projects,
        List<ProfilePostResponse> posts,
        boolean displayed
) {
}
