package com.skillsignal.developer;

import com.skillsignal.marketplace.MarketplaceProfileService;
import com.skillsignal.marketplace.ProfileResponse;
import com.skillsignal.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/developer")
public class DeveloperController {
    private final MarketplaceProfileService profileService;

    public DeveloperController(MarketplaceProfileService profileService) {
        this.profileService = profileService;
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
}
