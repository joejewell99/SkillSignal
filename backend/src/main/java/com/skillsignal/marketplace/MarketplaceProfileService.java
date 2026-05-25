package com.skillsignal.marketplace;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MarketplaceProfileService {
    private final MarketplaceProfileRepository profileRepository;
    private final ObjectMapper objectMapper;

    public MarketplaceProfileService(MarketplaceProfileRepository profileRepository, ObjectMapper objectMapper) {
        this.profileRepository = profileRepository;
        this.objectMapper = objectMapper;
    }

    public List<ProfileResponse> search(String query, String name, ProfileType type) {
        String normalizedQuery = normalize(query);
        String normalizedName = normalize(name);
        boolean hasSearch = !normalizedQuery.isBlank() || !normalizedName.isBlank();

        return profileRepository.findAllByOrderByDisplayOrderAsc().stream()
                .filter(profile -> type == null || profile.getType() == type)
                .filter(MarketplaceProfile::isDisplayed)
                .filter(profile -> hasSearch || profile.isFeatured())
                .filter(profile -> normalizedQuery.isBlank() || matchesQuery(profile, normalizedQuery))
                .filter(profile -> normalizedName.isBlank() || profile.getName().toLowerCase(Locale.ROOT).contains(normalizedName))
                .sorted(Comparator.comparing(MarketplaceProfile::getDisplayOrder))
                .map(profile -> ProfileResponse.from(profile, readProjects(profile)))
                .toList();
    }

    public ProfileResponse findPublicProfile(Long id) {
        MarketplaceProfile profile = profileRepository.findById(id)
                .filter(MarketplaceProfile::isDisplayed)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found."));
        return ProfileResponse.from(profile, readProjects(profile));
    }

    public ProfileResponse findDeveloperProfile(Long userId, String name) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(userId, name)));
        return ProfileResponse.from(profile, readProjects(profile));
    }

    public ProfileResponse updateDeveloperVisibility(Long userId, String name, boolean displayed) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(userId, name)));
        profile.setDisplayed(displayed);
        MarketplaceProfile savedProfile = profileRepository.save(profile);
        return ProfileResponse.from(savedProfile, readProjects(savedProfile));
    }

    public ProfileResponse updateDeveloperProfile(
            Long userId,
            String name,
            String title,
            String summary,
            String image,
            List<String> skills,
            List<ProfileProjectResponse> projects,
            boolean displayed
    ) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(userId, name)));
        profile.setTitle(defaultIfBlank(title, "Junior developer"));
        profile.setSummary(defaultIfBlank(summary, "Project-backed developer profile."));
        profile.setImage(image == null ? "" : image);
        profile.setSkills(skills == null ? new ArrayList<>() : skills.stream().map(String::trim).filter(skill -> !skill.isBlank()).toList());
        profile.setProjectsJson(writeProjects(projects));
        profile.setDisplayed(displayed);
        MarketplaceProfile savedProfile = profileRepository.save(profile);
        return ProfileResponse.from(savedProfile, readProjects(savedProfile));
    }

    public MarketplaceProfile createDeveloperProfile(Long userId, String name) {
        return profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(userId, name)));
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

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private List<ProfileProjectResponse> readProjects(MarketplaceProfile profile) {
        try {
            List<ProfileProjectResponse> projects = objectMapper.readValue(profile.getProjectsJson(), new TypeReference<>() {});
            return projects.stream()
                    .sorted(Comparator.comparing((ProfileProjectResponse project) -> Boolean.TRUE.equals(project.featured())).reversed())
                    .toList();
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String writeProjects(List<ProfileProjectResponse> projects) {
        try {
            return objectMapper.writeValueAsString(projects == null ? List.of() : projects);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Project data could not be saved.");
        }
    }
}
