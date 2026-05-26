package com.skillsignal.employer;

import com.skillsignal.marketplace.MarketplaceProfileService;
import com.skillsignal.marketplace.ProfileResponse;
import com.skillsignal.security.UserPrincipal;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employer")
public class EmployerController {
    private final MarketplaceProfileService profileService;

    public EmployerController(MarketplaceProfileService profileService) {
        this.profileService = profileService;
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
