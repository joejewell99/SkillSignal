package com.skillsignal.employer.dto;

import com.skillsignal.employer.model.SavedCandidate;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import java.time.Instant;
import java.util.List;

public record SavedCandidateResponse(
        Long id,
        Long developerProfileId,
        String developerName,
        String developerTitle,
        String developerImage,
        List<String> skills,
        Instant createdAt
) {
    public static SavedCandidateResponse from(SavedCandidate savedCandidate) {
        MarketplaceProfile developer = savedCandidate.getDeveloperProfile();
        return new SavedCandidateResponse(
                savedCandidate.getId(),
                developer.getId(),
                developer.getName(),
                developer.getTitle(),
                developer.getImage(),
                developer.getSkills(),
                savedCandidate.getCreatedAt()
        );
    }
}
