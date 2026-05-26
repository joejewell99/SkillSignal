package com.skillsignal.proof.service;

import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.proof.dto.ProofSignalResponse;
import com.skillsignal.proof.model.ProofSignal;
import com.skillsignal.proof.repository.ProofSignalRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProofSignalService {
    private final MarketplaceProfileRepository profileRepository;
    private final ProofSignalRepository proofSignalRepository;

    public ProofSignalService(
            MarketplaceProfileRepository profileRepository,
            ProofSignalRepository proofSignalRepository
    ) {
        this.profileRepository = profileRepository;
        this.proofSignalRepository = proofSignalRepository;
    }

    @Transactional
    public ProofSignalResponse sendProof(
            Long developerUserId,
            Long employerProfileId,
            String projectName,
            String note,
            String projectUrl
    ) {
        MarketplaceProfile developerProfile = profileRepository.findByUserId(developerUserId)
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Create your developer profile before sending proof."));

        MarketplaceProfile employerProfile = profileRepository.findById(employerProfileId)
                .filter(profile -> profile.getType() == ProfileType.EMPLOYER)
                .filter(MarketplaceProfile::isDisplayed)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employer profile not found."));

        ProofSignal signal = new ProofSignal(
                developerUserId,
                developerProfile,
                employerProfile,
                requireText(projectName, "Choose or name the project proof you want to send."),
                requireText(note, "Add a short note about why your proof fits this employer need."),
                clean(projectUrl)
        );

        return ProofSignalResponse.from(proofSignalRepository.save(signal));
    }

    @Transactional(readOnly = true)
    public List<ProofSignalResponse> findSentProof(Long developerUserId) {
        return proofSignalRepository.findByDeveloperUserIdOrderByCreatedAtDesc(developerUserId).stream()
                .map(ProofSignalResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProofSignalResponse> findEmployerInbox(Long employerUserId) {
        return proofSignalRepository.findByEmployerProfileUserIdOrderByCreatedAtDesc(employerUserId).stream()
                .map(ProofSignalResponse::from)
                .toList();
    }

    private String requireText(String value, String message) {
        String cleanValue = clean(value);
        if (cleanValue.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return cleanValue;
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
