package com.skillsignal.messaging.dto;

public record MessageParticipantResponse(
        Long userId,
        Long profileId,
        String name,
        String title,
        String image
) {
}
