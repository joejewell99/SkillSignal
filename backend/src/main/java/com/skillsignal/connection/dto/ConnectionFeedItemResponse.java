package com.skillsignal.connection.dto;

public record ConnectionFeedItemResponse(
        Long authorProfileId,
        String authorName,
        String authorTitle,
        String authorImage,
        String postId,
        String body,
        String createdAt
) {
}
