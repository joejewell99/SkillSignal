package com.skillsignal.employer.service;

import com.skillsignal.employer.dto.SavedCandidateResponse;
import com.skillsignal.employer.model.SavedCandidate;
import com.skillsignal.employer.repository.SavedCandidateRepository;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SavedCandidateService {
    private final MarketplaceProfileRepository profileRepository;
    private final SavedCandidateRepository savedCandidateRepository;

    public SavedCandidateService(
            MarketplaceProfileRepository profileRepository,
            SavedCandidateRepository savedCandidateRepository
    ) {
        this.profileRepository = profileRepository;
        this.savedCandidateRepository = savedCandidateRepository;
    }

    @Transactional
    public SavedCandidateResponse saveCandidate(Long employerUserId, Long developerProfileId) {
        MarketplaceProfile developerProfile = profileRepository.findById(developerProfileId)
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .filter(MarketplaceProfile::isDisplayed)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Developer profile not found."));

        SavedCandidate savedCandidate = savedCandidateRepository
                .findByEmployerUserIdAndDeveloperProfileId(employerUserId, developerProfileId)
                .orElseGet(() -> savedCandidateRepository.save(new SavedCandidate(employerUserId, developerProfile)));

        return SavedCandidateResponse.from(savedCandidate);
    }

    @Transactional(readOnly = true)
    public List<SavedCandidateResponse> findSavedCandidates(Long employerUserId) {
        return savedCandidateRepository.findByEmployerUserIdOrderByCreatedAtDesc(employerUserId).stream()
                .map(SavedCandidateResponse::from)
                .toList();
    }

    @Transactional
    public void removeSavedCandidate(Long employerUserId, Long savedCandidateId) {
        SavedCandidate savedCandidate = savedCandidateRepository.findById(savedCandidateId)
                .filter(candidate -> candidate.getEmployerUserId().equals(employerUserId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved candidate not found."));
        savedCandidateRepository.delete(savedCandidate);
    }
}
