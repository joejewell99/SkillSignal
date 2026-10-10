package com.skillsignal.employer.dto;

import com.skillsignal.marketplace.dto.ProfilePostResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

public record EmployerProfileUpdateRequest(
        @Size(max = 120) String title,
        @Size(max = 5000) String summary,
        @Size(max = 200_000) String image,
        @Size(max = 50) List<@Size(max = 60) String> skills,
        @Size(max = 30) List<@Valid ProfileProjectResponse> projects,
        @Size(max = 50) List<@Valid ProfilePostResponse> posts,
        boolean displayed
) {
}
