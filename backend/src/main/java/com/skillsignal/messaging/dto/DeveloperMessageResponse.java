package com.skillsignal.messaging.dto;

import java.time.Instant;

public record DeveloperMessageResponse(
        Long id,
        Long senderUserId,
        String senderName,
        String body,
        String imageUrl,
        Instant createdAt
) {
}
