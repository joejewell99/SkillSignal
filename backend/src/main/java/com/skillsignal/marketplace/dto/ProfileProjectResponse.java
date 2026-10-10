package com.skillsignal.marketplace.dto;

import java.util.List;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record ProfileProjectResponse(
        @Size(max = 120) String name,
        @Size(max = 5000) String description,
        @Size(max = 2048) @Pattern(regexp = "^$|https?://.*", message = "Project link must use HTTP or HTTPS") String githubUrl,
        @Size(max = 2048) @Pattern(regexp = "^$|https?://.*", message = "Project link must use HTTP or HTTPS") String liveUrl,
        @Size(max = 30) List<@Size(max = 60) String> skills,
        @Size(max = 10) List<@Size(max = 2048) @Pattern(regexp = "^(https?://.*|data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$", message = "Image must be a supported image URL") String> images,
        Boolean featured
) {
}
