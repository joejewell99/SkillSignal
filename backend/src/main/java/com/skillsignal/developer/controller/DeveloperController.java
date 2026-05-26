package com.skillsignal.developer.controller;

import com.skillsignal.connection.dto.ConnectionFeedItemResponse;
import com.skillsignal.connection.dto.ConnectionRequest;
import com.skillsignal.connection.dto.DeveloperConnectionResponse;
import com.skillsignal.connection.service.DeveloperConnectionService;
import com.skillsignal.developer.dto.DeveloperProfileUpdateRequest;
import com.skillsignal.developer.dto.DeveloperProfileVisibilityRequest;
import com.skillsignal.marketplace.service.MarketplaceProfileService;
import com.skillsignal.marketplace.dto.ProfileResponse;
import com.skillsignal.proof.dto.ProofSignalRequest;
import com.skillsignal.proof.dto.ProofSignalResponse;
import com.skillsignal.proof.service.ProofSignalService;
import com.skillsignal.security.UserPrincipal;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/developer")
public class DeveloperController {
    private final MarketplaceProfileService profileService;
    private final ProofSignalService proofSignalService;
    private final DeveloperConnectionService connectionService;

    public DeveloperController(
            MarketplaceProfileService profileService,
            ProofSignalService proofSignalService,
            DeveloperConnectionService connectionService
    ) {
        this.profileService = profileService;
        this.proofSignalService = proofSignalService;
        this.connectionService = connectionService;
    }

    @GetMapping("/profile")
    ProfileResponse profile(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return profileService.findDeveloperProfile(principal.id(), principal.name());
    }

    @PatchMapping("/profile")
    ProfileResponse updateProfile(
            @RequestBody DeveloperProfileUpdateRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return profileService.updateDeveloperProfile(
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
            @RequestBody DeveloperProfileVisibilityRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return profileService.updateDeveloperVisibility(principal.id(), principal.name(), request.displayed());
    }

    @PostMapping("/proof-signals")
    ProofSignalResponse sendProofSignal(
            @RequestBody ProofSignalRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return proofSignalService.sendProof(
                principal.id(),
                request.employerProfileId(),
                request.projectName(),
                request.note(),
                request.projectUrl()
        );
    }

    @GetMapping("/proof-signals")
    List<ProofSignalResponse> sentProofSignals(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return proofSignalService.findSentProof(principal.id());
    }

    @PostMapping("/connections")
    DeveloperConnectionResponse requestConnection(
            @RequestBody ConnectionRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return connectionService.requestConnection(principal.id(), request.receiverProfileId());
    }

    @GetMapping("/connections")
    List<DeveloperConnectionResponse> connections(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return connectionService.findConnections(principal.id());
    }

    @GetMapping("/connections/activity")
    List<DeveloperConnectionResponse> connectionActivity(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return connectionService.findAllConnectionActivity(principal.id());
    }

    @GetMapping("/connections/requests")
    List<DeveloperConnectionResponse> connectionRequests(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return connectionService.findConnectionRequests(principal.id());
    }

    @PatchMapping("/connections/{id}/accept")
    DeveloperConnectionResponse acceptConnection(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return connectionService.accept(principal.id(), id);
    }

    @PatchMapping("/connections/{id}/decline")
    DeveloperConnectionResponse declineConnection(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return connectionService.decline(principal.id(), id);
    }

    @DeleteMapping("/connections/{id}")
    void cancelConnection(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        connectionService.cancel(principal.id(), id);
    }

    @GetMapping("/feed")
    List<ConnectionFeedItemResponse> connectionFeed(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return connectionService.findConnectionFeed(principal.id());
    }
}
