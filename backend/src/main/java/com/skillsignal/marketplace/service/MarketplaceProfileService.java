package com.skillsignal.marketplace.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.marketplace.dto.DeveloperPreferencesResponse;
import com.skillsignal.marketplace.dto.EmployerNeedResponse;
import com.skillsignal.marketplace.dto.ProfileContactLinksResponse;
import com.skillsignal.marketplace.dto.ProfilePostResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import com.skillsignal.marketplace.dto.ProfileResponse;
import com.skillsignal.marketplace.dto.ProofQualityResponse;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
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
            ProfileContactLinksResponse contactLinks,
            DeveloperPreferencesResponse preferences,
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
        profile.setContactLinksJson(writeContactLinks(contactLinks));
        profile.setPreferencesJson(writePreferences(preferences));
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
            List<ProfileProjectResponse> projects,
            List<ProfilePostResponse> posts,
            boolean displayed
    ) {
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(MarketplaceProfile.forEmployerUser(userId, name)));
        profile.setTitle(defaultIfBlank(title, "Hiring team"));
        profile.setSummary(defaultIfBlank(summary, "Employer profile."));
        profile.setImage(image == null ? "" : image);
        profile.setSkills(skills == null ? new ArrayList<>() : skills.stream().map(String::trim).filter(skill -> !skill.isBlank()).toList());
        profile.setProjectsJson(writeProjects(projects));
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
        List<ProfileProjectResponse> projects = readProjects(profile);
        List<EmployerNeedResponse> needs = profile.getType() == ProfileType.EMPLOYER
                ? projects.stream().map(this::toEmployerNeed).toList()
                : List.of();
        ProofQualityResponse proofQuality = profile.getType() == ProfileType.DEVELOPER
                ? calculateProofQuality(projects)
                : null;
        DeveloperPreferencesResponse preferences = profile.getType() == ProfileType.DEVELOPER
                ? readPreferences(profile)
                : null;
        return ProfileResponse.from(profile, projects, needs, proofQuality, readPosts(profile), readContactLinks(profile), preferences);
    }

    private EmployerNeedResponse toEmployerNeed(ProfileProjectResponse project) {
        return new EmployerNeedResponse(
                project.name(),
                project.description(),
                project.skills() == null ? List.of() : project.skills(),
                buildEvidenceWanted(project),
                project.featured()
        );
    }

    private String buildEvidenceWanted(ProfileProjectResponse need) {
        List<String> skills = need.skills() == null ? List.of() : need.skills();
        if (skills.stream().anyMatch(skill -> normalize(skill).contains("react"))) {
            return "A React project with reusable components, API states, and clear workflow decisions.";
        }
        if (skills.stream().anyMatch(skill -> normalize(skill).contains("spring") || normalize(skill).contains("jwt"))) {
            return "A backend or authentication project with protected endpoints and edge-case notes.";
        }
        if (skills.stream().anyMatch(skill -> normalize(skill).contains("sql") || normalize(skill).contains("postgres"))) {
            return "A database-backed project showing schema choices, queries, or reporting logic.";
        }
        return "A project link, code sample, or short explanation showing similar problem-solving evidence.";
    }

    private ProofQualityResponse calculateProofQuality(List<ProfileProjectResponse> projects) {
        List<String> completed = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        int score = 0;

        if (!projects.isEmpty()) {
            score += 20;
            completed.add("Project proof added");
        } else {
            missing.add("Add at least one project");
        }

        if (projects.stream().anyMatch(project -> project.githubUrl() != null && !project.githubUrl().isBlank())) {
            score += 15;
            completed.add("Code link");
        } else {
            missing.add("Add a GitHub or code link");
        }

        if (projects.stream().anyMatch(project -> project.liveUrl() != null && !project.liveUrl().isBlank())) {
            score += 15;
            completed.add("Live demo");
        } else {
            missing.add("Add a live demo link");
        }

        if (projects.stream().anyMatch(project -> project.images() != null && !project.images().isEmpty())) {
            score += 15;
            completed.add("Screenshots");
        } else {
            missing.add("Add screenshots");
        }

        if (projects.stream().anyMatch(project -> project.skills() != null && !project.skills().isEmpty())) {
            score += 15;
            completed.add("Skills tied to projects");
        } else {
            missing.add("Tag projects with skills");
        }

        if (projects.stream().anyMatch(project -> Boolean.TRUE.equals(project.featured()))) {
            score += 10;
            completed.add("Featured best project");
        } else {
            missing.add("Feature your strongest project");
        }

        if (projects.stream().anyMatch(project -> project.description() != null && project.description().trim().length() >= 120)) {
            score += 10;
            completed.add("Detailed explanation");
        } else {
            missing.add("Explain the problem and decisions in more detail");
        }

        return new ProofQualityResponse(Math.min(score, 100), proofQualityLabel(score), completed, missing);
    }

    private String proofQualityLabel(int score) {
        if (score >= 85) {
            return "Strong proof";
        }
        if (score >= 60) {
            return "Useful proof";
        }
        if (score >= 30) {
            return "Needs more evidence";
        }
        return "No clear proof yet";
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

    private ProfileContactLinksResponse readContactLinks(MarketplaceProfile profile) {
        try {
            String contactLinksJson = profile.getContactLinksJson() == null || profile.getContactLinksJson().isBlank()
                    ? "{}"
                    : profile.getContactLinksJson();
            ProfileContactLinksResponse contactLinks = objectMapper.readValue(contactLinksJson, ProfileContactLinksResponse.class);
            return new ProfileContactLinksResponse(
                    defaultIfNull(contactLinks.linkedinUrl()),
                    defaultIfNull(contactLinks.githubUrl()),
                    defaultIfNull(contactLinks.email()),
                    defaultIfNull(contactLinks.websiteUrl())
            );
        } catch (JsonProcessingException exception) {
            return new ProfileContactLinksResponse("", "", "", "");
        }
    }

    private String writeContactLinks(ProfileContactLinksResponse contactLinks) {
        try {
            ProfileContactLinksResponse sanitized = contactLinks == null
                    ? new ProfileContactLinksResponse("", "", "", "")
                    : new ProfileContactLinksResponse(
                            defaultIfNull(contactLinks.linkedinUrl()).trim(),
                            defaultIfNull(contactLinks.githubUrl()).trim(),
                            defaultIfNull(contactLinks.email()).trim(),
                            defaultIfNull(contactLinks.websiteUrl()).trim()
                    );
            return objectMapper.writeValueAsString(sanitized);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Contact links could not be saved.");
        }
    }

    private DeveloperPreferencesResponse readPreferences(MarketplaceProfile profile) {
        try {
            String preferencesJson = profile.getPreferencesJson() == null || profile.getPreferencesJson().isBlank()
                    ? "{}"
                    : profile.getPreferencesJson();
            DeveloperPreferencesResponse preferences = objectMapper.readValue(preferencesJson, DeveloperPreferencesResponse.class);
            return new DeveloperPreferencesResponse(
                    defaultIfNull(preferences.availability()),
                    preferences.workTypes() == null ? List.of() : preferences.workTypes(),
                    defaultIfNull(preferences.remotePreference())
            );
        } catch (JsonProcessingException exception) {
            return new DeveloperPreferencesResponse("", List.of(), "");
        }
    }

    private String writePreferences(DeveloperPreferencesResponse preferences) {
        try {
            DeveloperPreferencesResponse sanitized = preferences == null
                    ? new DeveloperPreferencesResponse("", List.of(), "")
                    : new DeveloperPreferencesResponse(
                            defaultIfNull(preferences.availability()).trim(),
                            preferences.workTypes() == null
                                    ? List.of()
                                    : preferences.workTypes().stream().map(String::trim).filter(item -> !item.isBlank()).toList(),
                            defaultIfNull(preferences.remotePreference()).trim()
                    );
            return objectMapper.writeValueAsString(sanitized);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Developer preferences could not be saved.");
        }
    }

    private String defaultIfNull(String value) {
        return value == null ? "" : value;
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
