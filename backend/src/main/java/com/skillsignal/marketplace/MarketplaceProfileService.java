package com.skillsignal.marketplace;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class MarketplaceProfileService {
    private final MarketplaceProfileRepository profileRepository;

    public MarketplaceProfileService(MarketplaceProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public List<ProfileResponse> search(String query, String name, ProfileType type) {
        String normalizedQuery = normalize(query);
        String normalizedName = normalize(name);
        boolean hasSearch = !normalizedQuery.isBlank() || !normalizedName.isBlank();

        return profileRepository.findAllByOrderByDisplayOrderAsc().stream()
                .filter(profile -> type == null || profile.getType() == type)
                .filter(profile -> hasSearch || profile.isFeatured())
                .filter(profile -> normalizedQuery.isBlank() || matchesQuery(profile, normalizedQuery))
                .filter(profile -> normalizedName.isBlank() || profile.getName().toLowerCase(Locale.ROOT).contains(normalizedName))
                .sorted(Comparator.comparing(MarketplaceProfile::getDisplayOrder))
                .map(ProfileResponse::from)
                .toList();
    }

    private boolean matchesQuery(MarketplaceProfile profile, String query) {
        String searchableText = String.join(" ",
                profile.getName(),
                profile.getTitle(),
                profile.getSummary(),
                String.join(" ", profile.getSkills())
        ).toLowerCase(Locale.ROOT);
        return searchableText.contains(query);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}

