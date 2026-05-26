package com.skillsignal.employer.dto;

import com.skillsignal.marketplace.dto.ProfilePostResponse;
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
