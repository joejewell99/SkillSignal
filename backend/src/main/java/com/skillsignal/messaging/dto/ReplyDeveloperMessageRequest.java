package com.skillsignal.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReplyDeveloperMessageRequest(
        @NotBlank
        @Size(max = 1000, message = "Message must be 1000 characters or fewer")
        String body
) {
}
