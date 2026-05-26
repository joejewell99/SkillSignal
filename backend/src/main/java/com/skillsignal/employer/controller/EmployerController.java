package com.skillsignal.employer.controller;

import com.skillsignal.employer.dto.EmployerProfileUpdateRequest;
import com.skillsignal.employer.dto.EmployerProfileVisibilityRequest;
import com.skillsignal.employer.dto.SavedCandidateRequest;
import com.skillsignal.employer.dto.SavedCandidateResponse;
import com.skillsignal.employer.service.SavedCandidateService;
import com.skillsignal.marketplace.service.MarketplaceProfileService;
import com.skillsignal.marketplace.dto.ProfileResponse;
import com.skillsignal.proof.dto.ProofSignalResponse;
import com.skillsignal.proof.service.ProofSignalService;
import com.skillsignal.security.UserPrincipal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employer")
public class EmployerController {
    private final MarketplaceProfileService profileService;
    private final ProofSignalService proofSignalService;
    private final SavedCandidateService savedCandidateService;

    public EmployerController(
            MarketplaceProfileService profileService,
            ProofSignalService proofSignalService,
            SavedCandidateService savedCandidateService
    ) {
        this.profileService = profileService;
        this.proofSignalService = proofSignalService;
        this.savedCandidateService = savedCandidateService;
    }

    @GetMapping("/profile")
    ProfileResponse profile(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return profileService.findEmployerProfile(principal.id(), principal.name());
    }

    @PatchMapping("/profile")
    ProfileResponse updateProfile(
            @RequestBody EmployerProfileUpdateRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return profileService.updateEmployerProfile(
                principal.id(),
                principal.name(),
                request.title(),
                request.summary(),
                request.image(),
                request.skills(),
                request.projects(),
                request.posts(),
                request.displayed()
        );
    }

    @PatchMapping("/profile/visibility")
    ProfileResponse updateVisibility(
            @RequestBody EmployerProfileVisibilityRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return profileService.updateEmployerVisibility(principal.id(), principal.name(), request.displayed());
    }

    @GetMapping("/proof-signals")
    List<ProofSignalResponse> proofSignalInbox(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return proofSignalService.findEmployerInbox(principal.id());
    }

    @PostMapping("/saved-candidates")
    SavedCandidateResponse saveCandidate(
            @RequestBody SavedCandidateRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return savedCandidateService.saveCandidate(principal.id(), request.developerProfileId());
    }

    @GetMapping("/saved-candidates")
    List<SavedCandidateResponse> savedCandidates(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return savedCandidateService.findSavedCandidates(principal.id());
    }

    @DeleteMapping("/saved-candidates/{id}")
    void removeSavedCandidate(
            @PathVariable Long id,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        savedCandidateService.removeSavedCandidate(principal.id(), id);
    }

    @GetMapping("/search")
    Map<String, Object> search(@RequestParam(defaultValue = "authentication") String problem) {
        return Map.of(
                "query", problem,
                "matches", List.of(
                        Map.of(
                                "candidate", "Example Junior Developer",
                                "explanation", "Matched because their project evidence includes Spring Security JWT auth and React protected routes.",
                                "proofTags", List.of("Spring Boot JWT auth", "React protected routes", "REST API integration")
                        )
                )
        );
    }
}
