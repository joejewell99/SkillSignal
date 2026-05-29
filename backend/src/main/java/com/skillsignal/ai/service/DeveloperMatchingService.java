package com.skillsignal.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.ai.dto.AiMatchResponse;
import com.skillsignal.ai.dto.DeveloperMatchResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import com.skillsignal.marketplace.dto.ProfileResponse;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class DeveloperMatchingService {
    private static final int PREFILTER_LIMIT = 20;
    private static final int MATCH_LIMIT = 5;
    private static final int MIN_PREFILTER_SCORE = 10;

    private final MarketplaceProfileRepository profileRepository;
    private final ObjectMapper objectMapper;
    private final BriefAnalysisService briefAnalysisService;
    private final AiSearchQuotaService quotaService;

    public DeveloperMatchingService(
            MarketplaceProfileRepository profileRepository,
            ObjectMapper objectMapper,
            BriefAnalysisService briefAnalysisService,
            AiSearchQuotaService quotaService
    ) {
        this.profileRepository = profileRepository;
        this.objectMapper = objectMapper;
        this.briefAnalysisService = briefAnalysisService;
        this.quotaService = quotaService;
    }

    public AiMatchResponse matchDevelopers(String brief, Authentication authentication, HttpServletRequest request) {
        AiSearchQuota quota = quotaService.consumeSearch(authentication, request);
        BriefAnalysis analysis = briefAnalysisService.analyze(brief);
        if (analysis.rejected()) {
            return new AiMatchResponse(
                    quota.dailyLimit(),
                    quota.used(),
                    quota.remaining(),
                    analysis.quality(),
                    true,
                    analysis.rejectionReason(),
                    "This request was not matched because it is outside SkillSignal's software hiring focus.",
                    analysis.requiredSkills(),
                    analysis.problemTypes(),
                    List.of(),
                    analysis.followUpQuestions(),
                    List.of()
            );
        }
        if ("NEEDS_MORE_DETAIL".equals(analysis.quality())) {
            return new AiMatchResponse(
                    quota.dailyLimit(),
                    quota.used(),
                    quota.remaining(),
                    analysis.quality(),
                    false,
                    "",
                    "SkillSignal needs a little more detail before ranking developers.",
                    analysis.requiredSkills(),
                    analysis.problemTypes(),
                    buildEvidenceList(analysis),
                    analysis.followUpQuestions(),
                    List.of()
            );
        }

        List<CandidateScore> shortlist = prefilterCandidates(analysis);
        List<DeveloperMatchResponse> matches = rankMatches(shortlist, analysis);

        return new AiMatchResponse(
                quota.dailyLimit(),
                quota.used(),
                quota.remaining(),
                analysis.quality(),
                false,
                "",
                buildSummary(analysis),
                analysis.requiredSkills(),
                analysis.problemTypes(),
                buildEvidenceList(analysis),
                analysis.followUpQuestions(),
                matches
        );
    }

    private List<CandidateScore> prefilterCandidates(BriefAnalysis analysis) {
        return profileRepository.findAllByOrderByDisplayOrderAsc().stream()
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .filter(MarketplaceProfile::isDisplayed)
                .map(profile -> scoreCandidateForShortlist(profile, analysis))
                .filter(candidate -> candidate.score() >= MIN_PREFILTER_SCORE)
                .sorted(Comparator.comparing(CandidateScore::score).reversed())
                .limit(PREFILTER_LIMIT)
                .toList();
    }

    private CandidateScore scoreCandidateForShortlist(MarketplaceProfile profile, BriefAnalysis analysis) {
        List<ProfileProjectResponse> projects = readProjects(profile);
        String candidateText = candidateSearchText(profile, projects);
        int score = 0;

        for (String skill : analysis.requiredSkills()) {
            score += containsSignal(candidateText, skill, briefAnalysisService.skillSignals()) ? 16 : 0;
        }
        for (String problemType : analysis.problemTypes()) {
            score += containsSignal(candidateText, problemType, briefAnalysisService.problemSignals()) ? 10 : 0;
        }

        score += Math.min(18, matchingProjectCount(projects, analysis) * 6);
        score += proofDepthScore(projects);

        if (profile.isFeatured()) {
            score += 4;
        }

        return new CandidateScore(profile, projects, score);
    }

    private List<DeveloperMatchResponse> rankMatches(List<CandidateScore> shortlist, BriefAnalysis analysis) {
        return shortlist.stream()
                .map(candidate -> buildMatch(candidate, analysis))
                .sorted(Comparator.comparing(DeveloperMatchResponse::matchScore).reversed())
                .limit(MATCH_LIMIT)
                .toList();
    }

    private DeveloperMatchResponse buildMatch(CandidateScore candidate, BriefAnalysis analysis) {
        MarketplaceProfile profile = candidate.profile();
        List<ProfileProjectResponse> projects = candidate.projects();
        String candidateText = candidateSearchText(profile, projects);
        Set<String> strengths = new LinkedHashSet<>();
        Set<String> gaps = new LinkedHashSet<>();
        List<String> evidence = new ArrayList<>();
        int score = Math.min(42, candidate.score());

        for (String skill : analysis.requiredSkills()) {
            if (containsSignal(candidateText, skill, briefAnalysisService.skillSignals())) {
                strengths.add(skill);
                score += 8;
            } else if (!isFallbackSkill(skill)) {
                gaps.add(skill);
            }
        }

        for (String problemType : analysis.problemTypes()) {
            if (containsSignal(candidateText, problemType, briefAnalysisService.problemSignals())) {
                strengths.add(problemType);
                score += 6;
            }
        }

        List<ProfileProjectResponse> matchedProjects = projects.stream()
                .filter(project -> projectMatches(project, analysis))
                .limit(3)
                .toList();

        for (ProfileProjectResponse project : matchedProjects) {
            score += 7;
            evidence.add(project.name() + " shows " + summarizeProjectEvidence(project));
        }

        score += proofDepthScore(projects);
        score = Math.min(score, 97);

        return new DeveloperMatchResponse(
                toMatchProfile(profile, projects),
                score,
                new ArrayList<>(strengths),
                new ArrayList<>(gaps).stream().limit(3).toList(),
                evidence.stream().distinct().limit(4).toList(),
                buildReason(profile, strengths, gaps, matchedProjects, analysis),
                buildQuestions(strengths, gaps, analysis)
        );
    }

    private ProfileResponse toMatchProfile(MarketplaceProfile profile, List<ProfileProjectResponse> projects) {
        ProfileResponse response = ProfileResponse.from(profile, projects);
        return new ProfileResponse(
                response.id(),
                response.type(),
                response.name(),
                response.title(),
                response.summary(),
                response.image(),
                response.skills(),
                response.featured(),
                response.displayed(),
                response.acceptsConnections(),
                response.contactLinks(),
                response.preferences(),
                response.projects(),
                response.needs(),
                response.proofQuality(),
                response.posts()
        );
    }

    private boolean projectMatches(ProfileProjectResponse project, BriefAnalysis analysis) {
        String projectText = projectSearchText(project);
        return analysis.requiredSkills().stream().anyMatch(skill -> containsSignal(projectText, skill, briefAnalysisService.skillSignals()))
                || analysis.problemTypes().stream().anyMatch(problemType -> containsSignal(projectText, problemType, briefAnalysisService.problemSignals()));
    }

    private int matchingProjectCount(List<ProfileProjectResponse> projects, BriefAnalysis analysis) {
        return (int) projects.stream()
                .filter(project -> projectMatches(project, analysis))
                .count();
    }

    private int proofDepthScore(List<ProfileProjectResponse> projects) {
        int score = 0;
        if (!projects.isEmpty()) {
            score += 5;
        }
        if (projects.stream().anyMatch(project -> hasValue(project.githubUrl()))) {
            score += 5;
        }
        if (projects.stream().anyMatch(project -> hasValue(project.liveUrl()))) {
            score += 5;
        }
        if (projects.stream().anyMatch(project -> project.images() != null && !project.images().isEmpty())) {
            score += 4;
        }
        if (projects.stream().anyMatch(project -> Boolean.TRUE.equals(project.featured()))) {
            score += 4;
        }
        return score;
    }

    private boolean containsSignal(String text, String signal, Map<String, List<String>> signalMap) {
        String normalizedSignal = normalize(signal);
        return containsSearchTerm(text, normalizedSignal)
                || signalMap.getOrDefault(signal, List.of()).stream().anyMatch(term -> containsSearchTerm(text, term));
    }

    private boolean containsSearchTerm(String text, String term) {
        String normalizedTerm = normalize(term);
        if (normalizedTerm.isBlank()) {
            return false;
        }
        return Pattern.compile("(^|[^a-z0-9])" + Pattern.quote(normalizedTerm) + "([^a-z0-9]|$)")
                .matcher(text)
                .find();
    }

    private String candidateSearchText(MarketplaceProfile profile, List<ProfileProjectResponse> projects) {
        return normalize(String.join(" ",
                safe(profile.getName()),
                safe(profile.getTitle()),
                safe(profile.getSummary()),
                String.join(" ", profile.getSkills()),
                projects.stream()
                        .map(this::projectSearchText)
                        .reduce("", (current, next) -> current + " " + next)
        ));
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
        if (hasValue(project.githubUrl())) {
            signals.add("code");
        }
        if (hasValue(project.liveUrl())) {
            signals.add("a live demo");
        }
        if (project.images() != null && !project.images().isEmpty()) {
            signals.add("screenshots");
        }
        return signals.isEmpty() ? "adjacent project context" : String.join(" plus ", signals);
    }

    private List<String> buildEvidenceList(BriefAnalysis analysis) {
        Set<String> evidence = new LinkedHashSet<>();
        if (analysis.requiredSkills().contains("Spring Security") || analysis.requiredSkills().contains("Authentication")) {
            evidence.add("Authentication, JWT, or role-based access project");
        }
        if (analysis.requiredSkills().contains("PostgreSQL") || analysis.problemTypes().contains("Performance")) {
            evidence.add("Database-backed dashboard or query optimization proof");
        }
        if (analysis.requiredSkills().contains("Docker") || analysis.problemTypes().contains("Deployment")) {
            evidence.add("Dockerized deployment or production-style environment setup");
        }
        if (analysis.requiredSkills().contains("React") || analysis.problemTypes().contains("Dashboard")) {
            evidence.add("React dashboard with API-driven data and clear error states");
        }
        if (analysis.problemTypes().contains("Data Quality")) {
            evidence.add("Import, validation, or messy-data handling project");
        }
        evidence.add("GitHub repository, live demo, screenshots, and a plain-English project explanation");
        return new ArrayList<>(evidence);
    }

    private String buildSummary(BriefAnalysis analysis) {
        String summary = "Looking for developers with proof around "
                + String.join(", ", analysis.requiredSkills())
                + " for "
                + String.join(", ", analysis.problemTypes())
                + " work.";
        if (!analysis.idealTraits().isEmpty()) {
            summary += " Ideal traits: " + String.join(", ", analysis.idealTraits()) + ".";
        }
        return summary;
    }

    private String buildReason(
            MarketplaceProfile profile,
            Set<String> strengths,
            Set<String> gaps,
            List<ProfileProjectResponse> matchedProjects,
            BriefAnalysis analysis
    ) {
        if (strengths.isEmpty()) {
            return profile.getName() + " has some adjacent project proof, but the employer should review fit carefully.";
        }

        String reason = profile.getName() + " matches because their profile shows " + String.join(", ", strengths) + ".";
        if (!matchedProjects.isEmpty()) {
            reason += " Start with " + matchedProjects.get(0).name() + " as the closest proof.";
        }
        if (!analysis.idealTraits().isEmpty()) {
            reason += " The brief also values " + String.join(", ", analysis.idealTraits()) + ".";
        }
        if (!gaps.isEmpty()) {
            reason += " Check " + String.join(", ", gaps.stream().limit(2).toList()) + " in interview.";
        }
        return reason;
    }

    private List<String> buildQuestions(Set<String> strengths, Set<String> gaps, BriefAnalysis analysis) {
        List<String> questions = new ArrayList<>();
        if (strengths.contains("Spring Security") || gaps.contains("Spring Security") || strengths.contains("Authentication")) {
            questions.add("How would you safely change authentication or permissions in an existing app?");
        }
        if (strengths.contains("PostgreSQL") || gaps.contains("PostgreSQL") || analysis.problemTypes().contains("Performance")) {
            questions.add("How would you investigate a slow dashboard or database query?");
        }
        if (strengths.contains("React") || analysis.problemTypes().contains("Dashboard")) {
            questions.add("How do you design loading, empty, and error states for a data-heavy React screen?");
        }
        if (strengths.contains("Docker") || analysis.problemTypes().contains("Deployment")) {
            questions.add("How do you use Docker or environment checks when running a full-stack app locally?");
        }
        if (questions.isEmpty()) {
            questions.add("Talk through one project where you had to understand and improve existing code.");
        }
        return questions.stream().limit(3).toList();
    }

    private boolean isFallbackSkill(String skill) {
        return List.of("Problem Solving", "Communication", "Project Evidence").contains(skill);
    }

    private boolean hasValue(String value) {
        return value != null && !value.isBlank();
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

    private record CandidateScore(
            MarketplaceProfile profile,
            List<ProfileProjectResponse> projects,
            int score
    ) {
    }
}
