package com.skillsignal.connection.dto;

import com.skillsignal.connection.model.DeveloperConnection;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import java.time.Instant;

public record DeveloperConnectionResponse(
        Long id,
        String status,
        Long requesterProfileId,
        String requesterName,
        String requesterTitle,
        String requesterImage,
        Long receiverProfileId,
        String receiverName,
        String receiverTitle,
        String receiverImage,
        Instant createdAt,
        Instant respondedAt
) {
    public static DeveloperConnectionResponse from(DeveloperConnection connection) {
        MarketplaceProfile requester = connection.getRequesterProfile();
        MarketplaceProfile receiver = connection.getReceiverProfile();
        return new DeveloperConnectionResponse(
                connection.getId(),
                connection.getStatus().name(),
                requester.getId(),
                requester.getName(),
                requester.getTitle(),
                requester.getImage(),
                receiver.getId(),
                receiver.getName(),
                receiver.getTitle(),
                receiver.getImage(),
                connection.getCreatedAt(),
                connection.getRespondedAt()
        );
    }
}
