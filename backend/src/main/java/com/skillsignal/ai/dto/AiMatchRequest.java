package com.skillsignal.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiMatchRequest(
        @NotBlank(message = "Describe the software work you need help with")
        @Size(max = 2000, message = "Brief must be 2000 characters or fewer")
        String brief
) {
}
