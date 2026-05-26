package com.skillsignal.proof.dto;

import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.proof.model.ProofSignal;
import java.time.Instant;

public record ProofSignalResponse(
        Long id,
        Long employerProfileId,
        String employerName,
        Long developerProfileId,
        String developerName,
        String developerTitle,
        String developerImage,
        String projectName,
        String note,
        String projectUrl,
        Instant createdAt
) {
    public static ProofSignalResponse from(ProofSignal signal) {
        MarketplaceProfile developer = signal.getDeveloperProfile();
        MarketplaceProfile employer = signal.getEmployerProfile();
        return new ProofSignalResponse(
                signal.getId(),
                employer.getId(),
                employer.getName(),
                developer.getId(),
                developer.getName(),
                developer.getTitle(),
                developer.getImage(),
                signal.getProjectName(),
                signal.getNote(),
                signal.getProjectUrl(),
                signal.getCreatedAt()
        );
    }
}
