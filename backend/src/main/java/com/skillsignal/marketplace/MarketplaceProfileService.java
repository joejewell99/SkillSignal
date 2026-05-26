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
                .map(profile -> toResponse(profile))
                .toList();
    }

    public ProfileResponse findPublicProfile(Long id) {
        MarketplaceProfile profile = profileRepository.findById(id)
                .filter(MarketplaceProfile::isDisplayed)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found."));
        return toResponse(profile);
    }

    public ProfileResponse findDeveloperProfile(Long userId, String name) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(userId, name)));
        return toResponse(profile);
    }

    public ProfileResponse findEmployerProfile(Long userId, String name) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forEmployerUser(userId, name)));
        return toResponse(profile);
    }

    public ProfileResponse updateDeveloperVisibility(Long userId, String name, boolean displayed) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(userId, name)));
        profile.setDisplayed(displayed);
        MarketplaceProfile savedProfile = profileRepository.save(profile);
        return toResponse(savedProfile);
    }

    public ProfileResponse updateEmployerVisibility(Long userId, String name, boolean displayed) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forEmployerUser(userId, name)));
        profile.setDisplayed(displayed);
        MarketplaceProfile savedProfile = profileRepository.save(profile);
        return toResponse(savedProfile);
    }

    public ProfileResponse updateDeveloperProfile(
            Long userId,
            String name,
            String title,
            String summary,
            String image,
            List<String> skills,
            List<ProfileProjectResponse> projects,
            List<ProfilePostResponse> posts,
            boolean displayed
    ) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(userId, name)));
        profile.setTitle(defaultIfBlank(title, "Junior developer"));
        profile.setSummary(defaultIfBlank(summary, "Project-backed developer profile."));
        profile.setImage(image == null ? "" : image);
        profile.setSkills(skills == null ? new ArrayList<>() : skills.stream().map(String::trim).filter(skill -> !skill.isBlank()).toList());
        profile.setProjectsJson(writeProjects(projects));
        profile.setPostsJson(writePosts(posts));
        profile.setDisplayed(displayed);
        MarketplaceProfile savedProfile = profileRepository.save(profile);
        return toResponse(savedProfile);
    }

    public ProfileResponse updateEmployerProfile(
            Long userId,
            String name,
            String title,
            String summary,
            String image,
            List<String> skills,
            List<ProfilePostResponse> posts,
            boolean displayed
    ) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forEmployerUser(userId, name)));
        profile.setTitle(defaultIfBlank(title, "Hiring team"));
        profile.setSummary(defaultIfBlank(summary, "Employer profile."));
        profile.setImage(image == null ? "" : image);
        profile.setSkills(skills == null ? new ArrayList<>() : skills.stream().map(String::trim).filter(skill -> !skill.isBlank()).toList());
        profile.setPostsJson(writePosts(posts));
        profile.setDisplayed(displayed);
        MarketplaceProfile savedProfile = profileRepository.save(profile);
        return toResponse(savedProfile);
    }

    public MarketplaceProfile createDeveloperProfile(Long userId, String name) {
        return profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(userId, name)));
    }

    public MarketplaceProfile createEmployerProfile(Long userId, String name) {
        return profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forEmployerUser(userId, name)));
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

    private ProfileResponse toResponse(MarketplaceProfile profile) {
        return ProfileResponse.from(profile, readProjects(profile), readPosts(profile));
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

    private List<ProfilePostResponse> readPosts(MarketplaceProfile profile) {
        try {
            List<ProfilePostResponse> posts = objectMapper.readValue(profile.getPostsJson(), new TypeReference<>() {});
            return posts.stream()
                    .sorted(Comparator.comparing(ProfilePostResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                    .toList();
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String writePosts(List<ProfilePostResponse> posts) {
        try {
            return objectMapper.writeValueAsString(posts == null ? List.of() : posts);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Feed data could not be saved.");
        }
    }
}
