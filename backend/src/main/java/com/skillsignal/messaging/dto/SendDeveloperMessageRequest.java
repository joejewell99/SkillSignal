package com.skillsignal.messaging.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SendDeveloperMessageRequest(
        @NotNull Long receiverProfileId,
        @Size(max = 1000, message = "Message must be 1000 characters or fewer")
        String body,
        @Size(max = 2_000_000, message = "Image is too large")
        String imageUrl
) {
}
