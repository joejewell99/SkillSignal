package com.skillsignal.marketplace.controller;

import com.skillsignal.marketplace.dto.ProfileMetricsResponse;
import com.skillsignal.marketplace.dto.ProfileResponse;
import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.service.MarketplaceProfileService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profiles")
public class MarketplaceProfileController {
    private final MarketplaceProfileService profileService;

    public MarketplaceProfileController(MarketplaceProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    List<ProfileResponse> searchProfiles(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "") String name,
            @RequestParam(required = false) ProfileType type
    ) {
        return profileService.search(query, name, type);
    }

    @GetMapping("/metrics")
    ProfileMetricsResponse metrics() {
        return profileService.metrics();
    }

    @GetMapping("/{id}")
    ProfileResponse profile(@PathVariable Long id) {
        return profileService.findPublicProfile(id);
    }
}
