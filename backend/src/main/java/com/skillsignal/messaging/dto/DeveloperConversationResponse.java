package com.skillsignal.messaging.dto;

import java.time.Instant;
import java.util.List;

public record DeveloperConversationResponse(
        Long id,
        String status,
        boolean accepted,
        boolean requestReceived,
        Instant createdAt,
        Instant updatedAt,
        MessageParticipantResponse partner,
        String preview,
        List<DeveloperMessageResponse> messages
) {
}
