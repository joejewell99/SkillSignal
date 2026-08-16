package com.skillsignal.messaging.dto;

import jakarta.validation.constraints.Size;

public record ReplyDeveloperMessageRequest(
        @Size(max = 1000, message = "Message must be 1000 characters or fewer")
        String body,
        @Size(max = 2_000_000, message = "Image is too large")
        String imageUrl
) {
}
