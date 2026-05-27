package com.skillsignal.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.ai.dto.AiMatchResponse;
import com.skillsignal.ai.dto.DeveloperMatchResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.marketplace.dto.ProfileResponse;
import com.skillsignal.marketplace.model.ProfileType;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class MockAiMatchService {
    private static final Map<String, List<String>> SIGNALS = new LinkedHashMap<>();

    static {
        SIGNALS.put("Spring Boot", List.of("spring", "spring boot", "java service"));
        SIGNALS.put("Spring Security", List.of("spring security", "security", "secure", "role-based", "roles"));
        SIGNALS.put("Authentication", List.of("auth", "authentication", "login", "jwt", "protected routes"));
        SIGNALS.put("PostgreSQL", List.of("postgres", "postgresql", "database", "sql", "query", "queries"));
        SIGNALS.put("Docker", List.of("docker", "container", "containerized", "devops"));
        SIGNALS.put("React", List.of("react", "frontend", "dashboard ui", "components"));
        SIGNALS.put("Node.js", List.of("node", "node.js", "express", "javascript backend"));
        SIGNALS.put("Dashboards", List.of("dashboard", "analytics", "reporting", "charts"));
        SIGNALS.put("Performance", List.of("latency", "slow", "performance", "optimize", "optimise", "speed"));
        SIGNALS.put("Testing", List.of("test", "testing", "qa", "bug", "validation"));
        SIGNALS.put("Deployment", List.of("deploy", "deployment", "cloud", "production", "environment"));
        SIGNALS.put("Finance", List.of("finance", "fintech", "banking", "payments"));
    }

    private final MarketplaceProfileRepository profileRepository;
    private final ObjectMapper objectMapper;

    public MockAiMatchService(MarketplaceProfileRepository profileRepository, ObjectMapper objectMapper) {
        this.profileRepository = profileRepository;
        this.objectMapper = objectMapper;
    }

    public AiMatchResponse matchDevelopers(String brief) {
        String normalizedBrief = normalize(brief);
        List<String> requiredSkills = extractSignals(normalizedBrief);
        List<String> problemTypes = extractProblemTypes(normalizedBrief, requiredSkills);
        List<String> evidenceToLookFor = buildEvidenceList(requiredSkills, problemTypes);

        List<DeveloperMatchResponse> matches = profileRepository.findAllByOrderByDisplayOrderAsc().stream()
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .map(profile -> scoreProfile(profile, requiredSkills, problemTypes))
                .filter(match -> match.matchScore() > 0)
                .sorted(Comparator.comparing(DeveloperMatchResponse::matchScore).reversed())
                .limit(5)
                .toList();

        return new AiMatchResponse(
                buildSummary(requiredSkills, problemTypes),
                requiredSkills,
                problemTypes,
                evidenceToLookFor,
                matches
        );
    }

    private DeveloperMatchResponse scoreProfile(
            MarketplaceProfile profile,
            List<String> requiredSkills,
            List<String> problemTypes
    ) {
        List<ProfileProjectResponse> projects = readProjects(profile);
        String profileText = normalize(String.join(" ",
                profile.getTitle(),
                profile.getSummary(),
                String.join(" ", profile.getSkills()),
                projects.stream()
                        .map(this::projectSearchText)
                        .reduce("", (current, next) -> current + " " + next)
        ));
        Set<String> strengths = new LinkedHashSet<>();
        Set<String> gaps = new LinkedHashSet<>();
        List<String> evidence = new ArrayList<>();
        int score = 28;

        for (String skill : requiredSkills) {
            if (profileText.contains(normalize(skill)) || SIGNALS.getOrDefault(skill, List.of()).stream().anyMatch(profileText::contains)) {
                strengths.add(skill);
                score += 13;
            } else {
                gaps.add(skill);
            }
        }

        List<ProfileProjectResponse> matchedProjects = projects.stream()
                .filter(project -> projectMatches(project, requiredSkills, problemTypes))
                .limit(3)
                .toList();

        for (ProfileProjectResponse project : matchedProjects) {
            score += 8;
            evidence.add(project.name() + " shows " + summarizeProjectEvidence(project));
        }

        if (projects.stream().anyMatch(project -> project.githubUrl() != null && !project.githubUrl().isBlank())) {
            score += 4;
            evidence.add("Code link available for review");
        }

        if (projects.stream().anyMatch(project -> project.liveUrl() != null && !project.liveUrl().isBlank())) {
            score += 4;
            evidence.add("Live demo available");
        }

        for (String problemType : problemTypes) {
            if (profileText.contains(normalize(problemType))) {
                strengths.add(problemType);
                score += 8;
            }
        }

        if (profile.isFeatured()) {
            score += 4;
        }

        score = Math.min(score, 96);
        return new DeveloperMatchResponse(
                ProfileResponse.from(profile, projects),
                score,
                new ArrayList<>(strengths),
                new ArrayList<>(gaps).stream().limit(3).toList(),
                evidence.stream().distinct().limit(4).toList(),
                buildReason(profile, strengths, gaps, matchedProjects),
                buildQuestions(strengths, gaps)
        );
    }

    private boolean projectMatches(ProfileProjectResponse project, List<String> requiredSkills, List<String> problemTypes) {
        String text = projectSearchText(project);
        return requiredSkills.stream().anyMatch(skill ->
                text.contains(normalize(skill)) || SIGNALS.getOrDefault(skill, List.of()).stream().anyMatch(text::contains)
        ) || problemTypes.stream().anyMatch(problemType -> text.contains(normalize(problemType)));
    }

    private String projectSearchText(ProfileProjectResponse project) {
        return normalize(String.join(" ",
                safe(project.name()),
                safe(project.description()),
                String.join(" ", project.skills() == null ? List.of() : project.skills())
        ));
    }

    private String summarizeProjectEvidence(ProfileProjectResponse project) {
        List<String> signals = new ArrayList<>();
        if (project.skills() != null && !project.skills().isEmpty()) {
            signals.add(String.join(", ", project.skills().stream().limit(3).toList()));
        }
        if (project.githubUrl() != null && !project.githubUrl().isBlank()) {
            signals.add("code");
        }
        if (project.liveUrl() != null && !project.liveUrl().isBlank()) {
            signals.add("a live demo");
        }
        return signals.isEmpty() ? "relevant project context" : String.join(" plus ", signals);
    }

    private List<String> extractSignals(String brief) {
        List<String> signals = SIGNALS.entrySet().stream()
                .filter(entry -> entry.getValue().stream().anyMatch(brief::contains))
                .map(Map.Entry::getKey)
                .filter(signal -> !"Finance".equals(signal) && !"Performance".equals(signal))
                .toList();

        if (signals.isEmpty()) {
            return List.of("REST APIs", "Problem Solving", "Communication");
        }
        return signals;
    }

    private List<String> extractProblemTypes(String brief, List<String> requiredSkills) {
        Set<String> types = new LinkedHashSet<>();
        if (brief.contains("security") || brief.contains("auth") || requiredSkills.contains("Spring Security")) {
            types.add("security");
        }
        if (brief.contains("latency") || brief.contains("slow") || brief.contains("performance")) {
            types.add("performance");
        }
        if (brief.contains("maintain") || brief.contains("production") || brief.contains("existing")) {
            types.add("maintenance");
        }
        if (brief.contains("finance") || brief.contains("fintech") || brief.contains("banking")) {
            types.add("finance");
        }
        if (types.isEmpty()) {
            types.add("delivery");
        }
        return new ArrayList<>(types);
    }

    private List<String> buildEvidenceList(List<String> requiredSkills, List<String> problemTypes) {
        Set<String> evidence = new LinkedHashSet<>();
        if (requiredSkills.contains("Spring Security") || requiredSkills.contains("Authentication")) {
            evidence.add("Authentication, JWT, or role-based access project");
        }
        if (requiredSkills.contains("PostgreSQL") || problemTypes.contains("performance")) {
            evidence.add("Database-backed dashboard or query optimization proof");
        }
        if (requiredSkills.contains("Docker") || problemTypes.contains("maintenance")) {
            evidence.add("Dockerized deployment or production-style environment setup");
        }
        if (requiredSkills.contains("React") || requiredSkills.contains("Dashboards")) {
            evidence.add("React dashboard with API-driven data and clear error states");
        }
        evidence.add("GitHub repository, live demo, and plain-English project explanation");
        return new ArrayList<>(evidence);
    }

    private String buildSummary(List<String> requiredSkills, List<String> problemTypes) {
        return "Looking for junior developers with evidence around "
                + String.join(", ", requiredSkills)
                + " for "
                + String.join(", ", problemTypes)
                + " work.";
    }

    private String buildReason(MarketplaceProfile profile, Set<String> strengths, Set<String> gaps, List<ProfileProjectResponse> matchedProjects) {
        if (strengths.isEmpty()) {
            return profile.getName() + " has some adjacent project evidence, but would need closer review.";
        }
        String reason = profile.getName() + " matches because their profile shows " + String.join(", ", strengths) + ".";
        if (!matchedProjects.isEmpty()) {
            reason += " Start with " + matchedProjects.get(0).name() + " as the closest project proof.";
        }
        if (!gaps.isEmpty()) {
            reason += " Check the interview for " + String.join(", ", gaps.stream().limit(2).toList()) + ".";
        }
        return reason;
    }

    private List<String> buildQuestions(Set<String> strengths, Set<String> gaps) {
        List<String> questions = new ArrayList<>();
        if (strengths.contains("Spring Security") || gaps.contains("Spring Security")) {
            questions.add("How would you safely change a Spring Security configuration in an existing app?");
        }
        if (strengths.contains("PostgreSQL") || gaps.contains("PostgreSQL")) {
            questions.add("How would you investigate a slow dashboard query?");
        }
        if (strengths.contains("Docker") || gaps.contains("Docker")) {
            questions.add("How do you use Docker day to day when running a full-stack app locally?");
        }
        if (questions.isEmpty()) {
            questions.add("Talk through one project where you had to understand and improve existing code.");
        }
        return questions.stream().limit(3).toList();
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private List<ProfileProjectResponse> readProjects(MarketplaceProfile profile) {
        try {
            return objectMapper.readValue(profile.getProjectsJson(), new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }
}
