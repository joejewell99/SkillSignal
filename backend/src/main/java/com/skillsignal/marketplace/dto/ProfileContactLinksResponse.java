package com.skillsignal.marketplace.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileContactLinksResponse(
        @Size(max = 2048) @Pattern(regexp = "^$|https?://.*", message = "LinkedIn link must use HTTP or HTTPS") String linkedinUrl,
        @Size(max = 2048) @Pattern(regexp = "^$|https?://.*", message = "GitHub link must use HTTP or HTTPS") String githubUrl,
        @Size(max = 254) @Email String email,
        @Size(max = 2048) @Pattern(regexp = "^$|https?://.*", message = "Website link must use HTTP or HTTPS") String websiteUrl
) {
}
