package com.skillsignal.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.ai.dto.AiMatchResponse;
import com.skillsignal.ai.dto.DeveloperMatchResponse;
import com.skillsignal.marketplace.dto.EmployerNeedResponse;
import com.skillsignal.marketplace.dto.ProfilePostResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import com.skillsignal.marketplace.dto.ProfileResponse;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class DeveloperMatchingService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DeveloperMatchingService.class);
    private static final int PREFILTER_LIMIT = 10;
    private static final int MATCH_LIMIT = 5;
    private static final int MIN_PREFILTER_SCORE = 10;

    private final MarketplaceProfileRepository profileRepository;
    private final ObjectMapper objectMapper;
    private final BriefAnalysisService briefAnalysisService;
    private final AiSearchQuotaService quotaService;
    private final String openAiApiKey;
    private final String openAiModel;

    public DeveloperMatchingService(
            MarketplaceProfileRepository profileRepository,
            ObjectMapper objectMapper,
            BriefAnalysisService briefAnalysisService,
            AiSearchQuotaService quotaService,
            @Value("${app.openai.api-key:}") String openAiApiKey,
            @Value("${app.openai.model:gpt-4o-mini}") String openAiModel
    ) {
        this.profileRepository = profileRepository;
        this.objectMapper = objectMapper;
        this.briefAnalysisService = briefAnalysisService;
        this.quotaService = quotaService;
        this.openAiApiKey = openAiApiKey;
        this.openAiModel = openAiModel;
    }

    public AiMatchResponse matchDevelopers(String brief, String mode, Authentication authentication, HttpServletRequest request) {
        boolean employerMode = "EMPLOYER".equalsIgnoreCase(safe(mode));
        boolean peerMode = !employerMode;
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
                    peerMode
                            ? "This request was not matched because it is outside SkillSignal's profile discovery focus."
                            : "This request was not matched because it is outside SkillSignal's software hiring focus.",
                    analysis.requiredSkills(),
                    analysis.problemTypes(),
                    List.of(),
                    analysis.followUpQuestions(),
                    List.of()
            );
        }
        if ("NEEDS_MORE_DETAIL".equals(analysis.quality()) && !canProfileSearchWithPartialSignals(analysis)) {
            return new AiMatchResponse(
                    quota.dailyLimit(),
                    quota.used(),
                    quota.remaining(),
                    analysis.quality(),
                    false,
                    "",
                    peerMode
                            ? "SkillSignal needs a skill, stack, project type, or collaboration goal before finding profiles."
                            : "SkillSignal needs a little more detail before ranking developers.",
                    analysis.requiredSkills(),
                    analysis.problemTypes(),
                    buildEvidenceList(analysis),
                    analysis.followUpQuestions(),
                    List.of()
            );
        }

        Long excludedUserId = peerMode ? authenticatedUserId(authentication) : null;
        ProfileType targetType = employerMode ? ProfileType.EMPLOYER : ProfileType.DEVELOPER;
        DeveloperContext developerContext = employerMode ? authenticatedDeveloperContext(authentication) : null;
        List<CandidateScore> shortlist = prefilterCandidates(analysis, excludedUserId, targetType);
        List<DeveloperMatchResponse> matches = rankMatches(brief, shortlist, analysis, employerMode, developerContext);
        String responseQuality = "NEEDS_MORE_DETAIL".equals(analysis.quality()) && canProfileSearchWithPartialSignals(analysis)
                ? "GOOD"
                : analysis.quality();

        return new AiMatchResponse(
                quota.dailyLimit(),
                quota.used(),
                quota.remaining(),
                responseQuality,
                false,
                "",
                employerMode ? buildEmployerSummary(analysis) : buildPeerSummary(analysis),
                analysis.requiredSkills(),
                analysis.problemTypes(),
                buildEvidenceList(analysis),
                analysis.followUpQuestions(),
                matches
        );
    }

    private boolean canProfileSearchWithPartialSignals(BriefAnalysis analysis) {
        return !analysis.requiredSkills().isEmpty() || !analysis.problemTypes().isEmpty();
    }

    private Long authenticatedUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal.id();
    }

    private DeveloperContext authenticatedDeveloperContext(Authentication authentication) {
        Long userId = authenticatedUserId(authentication);
        if (userId == null) {
            return null;
        }
        return profileRepository.findByUserId(userId)
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .map(profile -> new DeveloperContext(profile, readProjects(profile)))
                .orElse(null);
    }

    private List<CandidateScore> prefilterCandidates(BriefAnalysis analysis, Long excludedUserId, ProfileType targetType) {
        return profileRepository.findAllByOrderByDisplayOrderAsc().stream()
                .filter(profile -> profile.getType() == targetType)
                .filter(MarketplaceProfile::isDisplayed)
                .filter(profile -> excludedUserId == null || profile.getUserId() == null || !excludedUserId.equals(profile.getUserId()))
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

    private List<DeveloperMatchResponse> rankMatches(
            String brief,
            List<CandidateScore> shortlist,
            BriefAnalysis analysis,
            boolean employerMode,
            DeveloperContext developerContext
    ) {
        List<DeveloperMatchResponse> deterministicMatches = shortlist.stream()
                .map(candidate -> buildMatch(candidate, analysis, employerMode, developerContext))
                .sorted(Comparator.comparing(DeveloperMatchResponse::matchScore).reversed())
                .toList();
        if (employerMode) {
            return deterministicMatches.stream().limit(MATCH_LIMIT).toList();
        }
        return rerankDeveloperMatchesWithOpenAi(brief, analysis, shortlist, deterministicMatches)
                .orElseGet(() -> deterministicMatches.stream().limit(MATCH_LIMIT).toList());
    }

    private DeveloperMatchResponse buildMatch(
            CandidateScore candidate,
            BriefAnalysis analysis,
            boolean employerMode,
            DeveloperContext developerContext
    ) {
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
        ProfileProjectResponse primaryMatch = matchedProjects.isEmpty() ? null : matchedProjects.get(0);
        ProfileProjectResponse developerProject = employerMode
                ? bestDeveloperProjectForEmployer(developerContext, primaryMatch, analysis, strengths)
                : null;
        int readinessScore = employerMode
                ? readinessScore(score, strengths, gaps, matchedProjects, developerContext, developerProject)
                : score;
        String readinessLabel = readinessLabel(readinessScore);

        return new DeveloperMatchResponse(
                toMatchProfile(profile, projects),
                score,
                readinessScore,
                readinessLabel,
                new ArrayList<>(strengths),
                new ArrayList<>(gaps).stream().limit(3).toList(),
                evidence.stream().distinct().limit(4).toList(),
                employerMode
                        ? buildEmployerReason(profile, strengths, gaps, matchedProjects, developerContext, developerProject, readinessScore)
                        : buildPeerReason(profile, strengths, gaps, matchedProjects),
                employerMode
                        ? buildHiringOutlook(profile, primaryMatch, strengths, gaps, readinessScore)
                        : "This is a peer discovery match. Use the score to decide whether their project proof is worth inspecting.",
                employerMode
                        ? buildProofToShow(primaryMatch, developerProject, strengths)
                        : "Open the project proof and look for code, screenshots, live demos, or notes that explain the implementation.",
                employerMode
                        ? buildEmployerNextStep(profile, primaryMatch, developerProject, gaps, readinessScore)
                        : "View the profile and start with a specific project question rather than a generic connection request.",
                employerMode
                        ? buildImprovementTips(primaryMatch, developerProject, strengths, gaps, readinessScore)
                        : List.of(),
                List.of()
        );
    }

    private Optional<List<DeveloperMatchResponse>> rerankDeveloperMatchesWithOpenAi(
            String brief,
            BriefAnalysis analysis,
            List<CandidateScore> shortlist,
            List<DeveloperMatchResponse> deterministicMatches
    ) {
        if (openAiApiKey == null || openAiApiKey.isBlank() || shortlist.isEmpty()) {
            if (openAiApiKey == null || openAiApiKey.isBlank()) {
                LOGGER.info("OpenAI rerank skipped because OPENAI_API_KEY is not configured.");
            }
            return Optional.empty();
        }
        try {
            LOGGER.info("OpenAI rerank started for {} shortlisted developer profiles using model {}.", shortlist.size(), openAiModel);
            Map<Long, DeveloperMatchResponse> fallbackByProfileId = deterministicMatches.stream()
                    .collect(java.util.stream.Collectors.toMap(match -> match.profile().id(), match -> match));
            Map<String, Object> requestBody = Map.of(
                    "model", openAiModel,
                    "input", List.of(
                            Map.of(
                                    "role", "system",
                                    "content", openAiSystemPrompt()
                            ),
                            Map.of(
                                    "role", "user",
                                    "content", objectMapper.writeValueAsString(openAiRankingPayload(brief, analysis, shortlist, fallbackByProfileId))
                            )
                    ),
                    "text", Map.of("format", openAiRankingSchema()),
                    "max_output_tokens", 2600
            );
            RestClient client = RestClient.builder()
                    .baseUrl("https://api.openai.com/v1")
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + openAiApiKey)
                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .build();
            String responseBody = client.post()
                    .uri("/responses")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);
            String outputText = extractResponseText(responseBody);
            if (outputText.isBlank()) {
                LOGGER.warn("OpenAI rerank returned no output text. Falling back to deterministic ranking.");
                return Optional.empty();
            }
            OpenAiRankingResponse ranking = objectMapper.readValue(outputText, OpenAiRankingResponse.class);
            List<DeveloperMatchResponse> rerankedMatches = ranking.matches().stream()
                    .map(aiMatch -> mergeAiMatch(aiMatch, fallbackByProfileId.get(aiMatch.profileId())))
                    .filter(java.util.Objects::nonNull)
                    .limit(MATCH_LIMIT)
                    .toList();
            if (rerankedMatches.isEmpty()) {
                LOGGER.warn("OpenAI rerank returned no usable profile ids. Falling back to deterministic ranking.");
                return Optional.empty();
            }
            LOGGER.info("OpenAI rerank completed with {} usable matches.", rerankedMatches.size());
            return Optional.of(rerankedMatches);
        } catch (Exception exception) {
            LOGGER.warn("OpenAI rerank failed safely. Falling back to deterministic ranking: {}", exception.getMessage());
            return Optional.empty();
        }
    }

    private String openAiSystemPrompt() {
        return """
                You rank junior developer profiles for an employer's software problem.
                Use only the supplied profile data. Do not invent projects, links, companies, or skills.
                Prefer candidates with concrete project evidence over candidates with only keyword overlap.
                Score 0-100 based on required skill fit, project evidence, problem similarity, proof quality, and remaining risk. Only use 95+ when the profile clearly proves nearly every important part of the brief.
                Write in third person for an employer. Do not use interview questions.
                Do not suggest interviewing in nextStep; suggest inspecting a named project, shortlisting, or viewing proof instead.
                Rewrite first-person project evidence into third person, for example "she implemented" or "they built".
                If a brief asks for Spring Boot and a candidate proves Spring Security, treat that as strong adjacent Spring ecosystem evidence, but mention when broader Spring Boot API/service structure is lighter.
                Make each candidate sound marketable without exaggerating: explain what problem they can help with, what named project proves it, and what the employer should inspect first.
                Evidence bullets must be descriptive: "Project name: what it proves, plus proof type" rather than only "Project name code".
                Matched signals must be concrete skills or work types from the data. Avoid vague signals like "code quality" unless the data explicitly mentions tests, refactoring, or maintainability.
                remainingRisks should be tactful checks, not scary warnings.
                Keep reasoning specific, commercially useful, and tied to named projects or profile evidence.
                Return JSON only in the requested schema.
                """;
    }

    private Map<String, Object> openAiRankingPayload(
            String brief,
            BriefAnalysis analysis,
            List<CandidateScore> shortlist,
            Map<Long, DeveloperMatchResponse> fallbackByProfileId
    ) {
        return Map.of(
                "employerBrief", safe(brief),
                "requiredSkills", analysis.requiredSkills(),
                "problemTypes", analysis.problemTypes(),
                "idealTraits", analysis.idealTraits(),
                "rankingInstructions", List.of(
                        "Rank the best 5 developers from the candidate list.",
                        "Use profile summary, project descriptions, skills, proof links, screenshots, and feed posts.",
                        "Explain why the candidate can help solve the employer's issue in 2 specific sentences.",
                        "Use hiringOutlook as a short 'Best fit for' line, naming the work this candidate is strongest for.",
                        "Use proofToShow to tell the employer exactly which project or proof artifact to inspect first.",
                        "Use nextStep as a click/shortlist action, not an interview instruction.",
                        "Use third-person wording for all candidate evidence.",
                        "Do not use the words interview, interviewer, or interview questions.",
                        "Call out real gaps as remainingRisks, but do not over-penalize junior candidates for missing senior experience."
                ),
                "candidates", shortlist.stream()
                        .map(candidate -> openAiCandidatePayload(candidate, fallbackByProfileId.get(candidate.profile().getId())))
                        .toList()
        );
    }

    private Map<String, Object> openAiCandidatePayload(CandidateScore candidate, DeveloperMatchResponse fallbackMatch) {
        MarketplaceProfile profile = candidate.profile();
        List<ProfileProjectResponse> projects = candidate.projects();
        return Map.of(
                "profileId", profile.getId(),
                "name", profile.getName(),
                "title", profile.getTitle(),
                "summary", profile.getSummary(),
                "skills", profile.getSkills(),
                "deterministicScore", fallbackMatch == null ? candidate.score() : fallbackMatch.matchScore(),
                "deterministicReason", fallbackMatch == null ? "" : fallbackMatch.reason(),
                "projects", projects.stream().limit(4).map(project -> Map.of(
                        "name", safe(project.name()),
                        "description", safe(project.description()),
                        "skills", project.skills() == null ? List.of() : project.skills(),
                        "hasCode", hasValue(project.githubUrl()),
                        "hasLiveDemo", hasValue(project.liveUrl()),
                        "hasScreenshots", project.images() != null && !project.images().isEmpty(),
                        "featured", Boolean.TRUE.equals(project.featured())
                )).toList(),
                "feedPosts", readPosts(profile).stream().limit(3).map(post -> Map.of(
                        "body", safe(post.body()),
                        "createdAt", safe(post.createdAt())
                )).toList()
        );
    }

    private Map<String, Object> openAiRankingSchema() {
        return Map.of(
                "type", "json_schema",
                "name", "developer_match_ranking",
                "strict", true,
                "schema", Map.of(
                        "type", "object",
                        "additionalProperties", false,
                        "required", List.of("matches"),
                        "properties", Map.of(
                                "matches", Map.of(
                                        "type", "array",
                                        "minItems", 0,
                                        "maxItems", MATCH_LIMIT,
                                        "items", Map.of(
                                                "type", "object",
                                                "additionalProperties", false,
                                                "required", List.of("profileId", "score", "reason", "matchedSignals", "bestEvidence", "remainingRisks", "hiringOutlook", "proofToShow", "nextStep"),
                                                "properties", Map.of(
                                                        "profileId", Map.of("type", "integer"),
                                                        "score", Map.of("type", "integer", "minimum", 0, "maximum", 100),
                                                        "reason", Map.of("type", "string", "maxLength", 520),
                                                        "matchedSignals", Map.of("type", "array", "items", Map.of("type", "string"), "maxItems", 5),
                                                        "bestEvidence", Map.of("type", "array", "items", Map.of("type", "string", "maxLength", 180), "maxItems", 4),
                                                        "remainingRisks", Map.of("type", "array", "items", Map.of("type", "string"), "maxItems", 3),
                                                        "hiringOutlook", Map.of("type", "string", "maxLength", 180),
                                                        "proofToShow", Map.of("type", "string", "maxLength", 220),
                                                        "nextStep", Map.of("type", "string", "maxLength", 180)
                                                )
                                        )
                                )
                        )
                )
        );
    }

    private DeveloperMatchResponse mergeAiMatch(OpenAiDeveloperMatch aiMatch, DeveloperMatchResponse fallbackMatch) {
        if (fallbackMatch == null) {
            return null;
        }
        int score = Math.max(0, Math.min(100, aiMatch.score()));
        List<String> strengths = aiMatch.matchedSignals().isEmpty() ? fallbackMatch.strengths() : aiMatch.matchedSignals();
        List<String> evidence = aiMatch.bestEvidence().isEmpty() ? fallbackMatch.evidence() : aiMatch.bestEvidence();
        List<String> gaps = aiMatch.remainingRisks().isEmpty() ? fallbackMatch.gaps() : aiMatch.remainingRisks();
        score = capScoreForRisks(score, gaps);
        return new DeveloperMatchResponse(
                fallbackMatch.profile(),
                score,
                score,
                readinessLabel(score),
                strengths,
                gaps,
                evidence,
                defaultIfBlank(aiMatch.reason(), fallbackMatch.reason()),
                defaultIfBlank(aiMatch.hiringOutlook(), fallbackMatch.hiringOutlook()),
                defaultIfBlank(aiMatch.proofToShow(), fallbackMatch.proofToShow()),
                defaultIfBlank(aiMatch.nextStep(), fallbackMatch.nextStep()),
                fallbackMatch.improvementTips(),
                List.of()
        );
    }

    private int capScoreForRisks(int score, List<String> gaps) {
        if (gaps == null || gaps.isEmpty()) {
            return score;
        }
        boolean hasSpringBootRisk = gaps.stream()
                .map(this::normalize)
                .anyMatch(gap -> gap.contains("spring boot") || gap.contains("api/service") || gap.contains("service structure"));
        if (hasSpringBootRisk) {
            return Math.min(score, 90);
        }
        return Math.min(score, 93);
    }

    private String extractResponseText(String responseBody) throws JsonProcessingException {
        if (responseBody == null || responseBody.isBlank()) {
            return "";
        }
        com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(responseBody);
        com.fasterxml.jackson.databind.JsonNode outputText = root.path("output_text");
        if (outputText.isTextual()) {
            return outputText.asText();
        }
        for (com.fasterxml.jackson.databind.JsonNode output : root.path("output")) {
            for (com.fasterxml.jackson.databind.JsonNode content : output.path("content")) {
                com.fasterxml.jackson.databind.JsonNode text = content.path("text");
                if (text.isTextual()) {
                    return text.asText();
                }
            }
        }
        return "";
    }

    private ProfileResponse toMatchProfile(MarketplaceProfile profile, List<ProfileProjectResponse> projects) {
        List<EmployerNeedResponse> needs = profile.getType() == ProfileType.EMPLOYER
                ? projects.stream().map(this::toEmployerNeed).toList()
                : List.of();
        ProfileResponse response = ProfileResponse.from(profile, projects, needs, null, List.of());
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
                response.demoProfile(),
                response.contactLinks(),
                response.preferences(),
                response.projects(),
                response.needs(),
                response.proofQuality(),
                response.posts()
        );
    }

    private EmployerNeedResponse toEmployerNeed(ProfileProjectResponse project) {
        return new EmployerNeedResponse(
                project.name(),
                project.description(),
                project.skills() == null ? List.of() : project.skills(),
                "A project link, code sample, or short explanation showing similar problem-solving evidence.",
                project.featured()
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

    private String buildPeerSummary(BriefAnalysis analysis) {
        String summary = "Matching developer profiles with visible proof around "
                + String.join(", ", analysis.requiredSkills())
                + " and "
                + String.join(", ", analysis.problemTypes())
                + ".";
        if (!analysis.idealTraits().isEmpty()) {
            summary += " Useful signals: " + String.join(", ", analysis.idealTraits()) + ".";
        }
        return summary;
    }

    private String buildEmployerSummary(BriefAnalysis analysis) {
        String summary = "Matching employer needs around "
                + String.join(", ", analysis.requiredSkills())
                + " and "
                + String.join(", ", analysis.problemTypes())
                + ".";
        if (!analysis.idealTraits().isEmpty()) {
            summary += " Useful signals: " + String.join(", ", analysis.idealTraits()) + ".";
        }
        return summary;
    }

    private String buildPeerReason(
            MarketplaceProfile profile,
            Set<String> strengths,
            Set<String> gaps,
            List<ProfileProjectResponse> matchedProjects
    ) {
        if (strengths.isEmpty()) {
            return profile.getName() + " has adjacent project proof. Open the profile and check whether their published work overlaps with the skills or collaboration you have in mind.";
        }

        if (matchedProjects.isEmpty()) {
            return profile.getName() + " has profile-level overlap in " + naturalList(new ArrayList<>(strengths))
                    + ". The next thing to inspect is whether one of their projects proves that work clearly enough.";
        }

        ProfileProjectResponse primaryProject = matchedProjects.get(0);
        Pronouns pronouns = pronounsFor(profile);
        String strengthList = naturalList(reasonStrengths(strengths).stream().limit(3).toList());
        String proofDetail = proofReasonDetail(primaryProject);
        String gapDetail = gaps.isEmpty()
                ? ""
                : " You may still want to ask about " + naturalList(new ArrayList<>(gaps).stream().limit(2).toList()) + ".";

        return profile.getName() + " is worth inspecting because " + primaryProject.name()
                + " gives concrete proof around " + strengthList + ". "
                + upperFirst(projectReasonDetail(primaryProject, pronouns)) + " "
                + proofDetail
                + " That gives you a specific project to discuss if you view or connect." + gapDetail;
    }

    private String buildEmployerReason(
            MarketplaceProfile profile,
            Set<String> strengths,
            Set<String> gaps,
            List<ProfileProjectResponse> matchedProjects,
            DeveloperContext developerContext,
            ProfileProjectResponse developerProject,
            int readinessScore
    ) {
        String companyValues = companyValues(profile);
        if (strengths.isEmpty()) {
            return profile.getName() + " might be adjacent, but I would treat this as a longer shot until you can show one project that speaks to their current work. "
                    + "They seem to value " + companyValues + ", so your message needs to be specific rather than just enthusiastic.";
        }

        if (matchedProjects.isEmpty()) {
            return profile.getName() + " could suit you because your profile overlaps with " + naturalList(new ArrayList<>(strengths))
                    + ". I would still inspect their hiring needs before applying, because the fit is not yet tied to one clear piece of work. "
                    + "Lead with a project that proves you can learn carefully and communicate tradeoffs.";
        }

        ProfileProjectResponse primaryNeed = matchedProjects.get(0);
        String needWork = cleanNeedDescription(primaryNeed.description());
        String projectName = developerProject == null ? "your closest relevant project" : developerProject.name();
        String gapLine = gaps.isEmpty()
                ? ""
                : " Before you approach them, tidy up the " + naturalList(new ArrayList<>(gaps).stream().limit(2).toList()) + " gap.";
        boolean strongLead = readinessScore >= 82;

        return switch (needCategory(primaryNeed)) {
            case "AUTH" -> switch (authSubtype(primaryNeed)) {
                case "JWT" -> profile.getName() + " is a good lead if you want backend auth work rather than generic full-stack noise. Their need is about " + needWork + ", so the proof they will care about is whether you can trace a token/login flow, explain protected endpoints, and make auth failures easier for another team to debug. Point them to the exact auth path in " + projectName + "; a general portfolio link would waste the strongest part of your fit." + gapLine;
                case "PERMISSIONS" -> profile.getName() + " is more about product-safe permissions than raw backend security. The work is " + needWork + ", which means your best angle is showing that you can make admin access, role changes, failed requests, and permission feedback understandable to users. " + projectName + " should be framed as a workflow/control example, not just an auth example." + gapLine;
                case "LOGIN" -> profile.getName() + " is worth checking because the pain is close to the user: " + needWork + ". If " + projectName + " shows clean validation and sensible failed-login states, you have a practical story to tell. Lead with the user-facing failure path, not the library names." + gapLine;
                default -> profile.getName() + " is showing an auth need with real edges: " + needWork + ". Your fit depends on whether " + projectName + " shows careful access-control decisions, not just Spring Security or Authentication tags." + gapLine;
            };
            case "DASHBOARD" -> profile.getName() + " is looking for someone who can turn internal data into decisions. The need is " + needWork + ", so your strongest angle is not \"I build dashboards\"; it is showing how you handle loading states, filters, warnings, and the moment a user understands what to do next. Use " + projectName + " to show one screen where the UI reduces confusion for an internal user." + gapLine;
            case "SQL" -> profile.getName() + " is a fit if you want careful backend/data work. Their need around " + primaryNeed.name() + " is really about trust: records should be shaped, queried, paginated, or audited without surprising the UI. Do not lead with screenshots; lead with the table, endpoint, or response-shape decision in " + projectName + "." + gapLine;
            case "DATA" -> profile.getName() + " has the kind of work where a junior can stand out by being patient. They need " + needWork + ", which means messy inputs, validation rules, and clear explanations matter more than a flashy stack list. " + projectName + " is useful only if it shows bad cases and how you handled them." + gapLine;
            case "DEPLOYMENT" -> profile.getName() + " is not necessarily looking for a deep DevOps specialist here. Their need is " + needWork + ", so a junior with solid setup notes, environment checks, and calm debugging habits could be genuinely useful. Frame " + projectName + " around making the app easier for another person to run, verify, and recover." + gapLine;
            case "DOCS" -> profile.getName() + " is a good lead if you like making confusing technical behaviour easier for other developers. The work is " + needWork + ", so examples, auth notes, failure cases, and small sandbox-style guidance are the evidence that would make you credible. Show the part of " + projectName + " where another developer would actually save time." + gapLine;
            default -> profile.getName() + " is worth inspecting because " + primaryNeed.name() + " is close enough to your search to deserve a look. The fit will come down to whether " + projectName + " explains your judgment clearly, not whether the keywords line up. " + (strongLead ? "The readiness score says this is worth opening." : "The readiness score says to be selective.") + gapLine + " They seem to value " + companyValues + ".";
        };
    }

    private int readinessScore(
            int matchScore,
            Set<String> strengths,
            Set<String> gaps,
            List<ProfileProjectResponse> matchedProjects,
            DeveloperContext developerContext,
            ProfileProjectResponse developerProject
    ) {
        int score = matchScore;
        score += Math.min(10, strengths.size() * 2);
        score += matchedProjects.stream().anyMatch(need -> Boolean.TRUE.equals(need.featured())) ? 5 : 0;
        score -= Math.min(18, gaps.size() * 6);
        if (developerContext == null) {
            score = Math.min(score, 74);
        } else if (developerProject == null) {
            score = Math.min(score, 82);
        }
        return Math.max(18, Math.min(98, score));
    }

    private String readinessLabel(int score) {
        if (score >= 82) {
            return "Strong fit";
        }
        if (score >= 65) {
            return "Realistic stretch";
        }
        if (score >= 45) {
            return "Early fit";
        }
        return "Longer shot";
    }

    private String readinessSentence(int score) {
        if (score >= 82) {
            return "I would treat this as a strong lead if your project proof is polished.";
        }
        if (score >= 65) {
            return "This is a realistic stretch: good enough to approach, but your message has to connect the dots.";
        }
        if (score >= 45) {
            return "This is possible, but you should improve the proof before expecting a reply.";
        }
        return "This is a longer shot unless you build or publish more directly relevant evidence.";
    }

    private String buildHiringOutlook(
            MarketplaceProfile employer,
            ProfileProjectResponse primaryNeed,
            Set<String> strengths,
            Set<String> gaps,
            int readinessScore
    ) {
        if (primaryNeed == null) {
            return "They have some adjacent signals, but I cannot see a specific current need that cleanly matches your search yet.";
        }

        String priority = Boolean.TRUE.equals(primaryNeed.featured()) ? "priority" : "published";
        String gapText = gaps.isEmpty()
                ? ""
                : " Watch the " + naturalList(new ArrayList<>(gaps).stream().limit(2).toList()) + " gap before you treat it as a clean fit.";
        String needWork = cleanNeedDescription(primaryNeed.description());
        int variant = Math.floorMod((employer.getName() + primaryNeed.name()).hashCode(), 3);
        return switch (needCategory(primaryNeed)) {
            case "AUTH" -> switch (authSubtype(primaryNeed)) {
                case "JWT" -> employer.getName() + " is describing backend auth cleanup, not a generic security wishlist: " + needWork + ". That is a credible junior target because the useful work is traceable: follow the token flow, document protected endpoints, and make failures easier for the frontend team to reason about." + gapText;
                case "PERMISSIONS" -> employer.getName() + " is hiring around permission workflow, not just auth theory: " + needWork + ". This is realistic if your proof shows you can make role changes understandable in the UI and still respect the access rules underneath." + gapText;
                case "LOGIN" -> primaryNeed.name() + " is about the part of auth users actually feel: " + needWork + ". A junior can be useful here if your project shows careful validation, useful failed states, and no loose ends around protected screens." + gapText;
                default -> switch (variant) {
                    case 0 -> employer.getName() + " is signalling " + priority + " auth work with a real shape: " + needWork + ". That is a plausible junior opening if you can show careful flow-tracing rather than broad security claims." + gapText;
                    case 1 -> primaryNeed.name() + " sounds reviewable rather than vague: " + needWork + ". For a junior developer, that matters because small access-control improvements can be judged from code, screenshots, endpoint examples, or error states." + gapText;
                    default -> "The hiring signal is strongest where the auth work gets concrete: " + needWork + ". " + employer.getName() + " is more likely to respond if your profile shows disciplined handling of access, failure cases, and user feedback." + gapText;
                };
            };
            case "DASHBOARD" -> switch (variant) {
                case 0 -> employer.getName() + " looks like they need product judgment around data: " + needWork + ". A junior can fit this if your dashboard proof shows how raw API data becomes something a busy user can act on.";
                case 1 -> "This is less about making charts and more about making a workflow legible. " + primaryNeed.name() + " asks for " + needWork + ", so the employer will probably care about states, filters, warnings, and whether the screen helps someone decide faster.";
                default -> employer.getName() + " has a dashboard need with practical stakes: " + needWork + ". Your chances depend on whether your project proof shows product thinking, not just component styling.";
            };
            case "SQL" -> switch (variant) {
                case 0 -> "This reads like backend trust work: " + upperFirst(needWork) + ". A junior can be credible here if the scope stays small and your project shows careful schema/API thinking.";
                case 1 -> employer.getName() + " is likely hiring around predictable data, not glamorous features. " + primaryNeed.name() + " needs someone who can keep records, queries, or pagination understandable when the edge cases show up.";
                default -> "The opportunity is realistic if you can prove data discipline. " + upperFirst(needWork) + " is the sort of task where a clean table shape, clear endpoint, or pagination decision matters more than a flashy UI.";
            };
            case "DATA" -> switch (variant) {
                case 0 -> employer.getName() + " has the kind of messy-input problem teams actually hand to juniors: " + needWork + ". It is believable if your project proves patience with edge cases, not just a script that works on perfect data.";
                case 1 -> primaryNeed.name() + " is a fit signal because it involves imperfect user input. If your portfolio shows validation decisions, duplicate handling, or useful error messages, you have a realistic way to start the conversation.";
                default -> "This need is about trust before data reaches the rest of the system: " + needWork + ". The employer is likely to value careful thinking and plain-English error feedback more than advanced architecture.";
            };
            case "DEPLOYMENT" -> switch (variant) {
                case 0 -> "This is likely to suit a junior who enjoys reliability polish: " + needWork + ". " + employer.getName() + " may not need a platform engineer here; they need someone careful enough to make the app easier to run and verify.";
                case 1 -> primaryNeed.name() + " sounds like release friction, not deep infrastructure ownership. That is junior-realistic if your proof shows setup steps, checks, and docs another person could actually follow.";
                default -> "The hiring signal is around reducing deployment uncertainty. If you can show environment setup, health checks, or run instructions that remove guesswork, this employer has a practical reason to look at you.";
            };
            case "DOCS" -> switch (variant) {
                case 0 -> employer.getName() + " is asking for developer-experience work: " + needWork + ". That makes clarity part of the hiring bar, not just code.";
                case 1 -> primaryNeed.name() + " is realistic for a junior if you can turn confusing API behaviour into examples another engineer can use. They will be looking for patience and precision.";
                default -> "This employer likely needs someone who can make technical behaviour explainable. Good docs, endpoint examples, and failure cases could matter as much as implementation here.";
            };
            default -> employer.getName() + " has a real enough need to inspect: " + needWork + ". I would still look for one project that lands close to " + primaryNeed.name() + " before treating it as a strong lead." + gapText;
        };
    }

    private String buildProofToShow(
            ProfileProjectResponse primaryNeed,
            ProfileProjectResponse developerProject,
            Set<String> strengths
    ) {
        String skillText = strengths.isEmpty()
                ? "the problem they need solved"
                : naturalList(reasonStrengths(strengths).stream().limit(3).toList());
        String projectName = developerProject == null ? "your closest relevant project" : developerProject.name();
        String noPerfectMatch = developerProject == null
                ? " If none of your projects match perfectly, say exactly which part transfers and which part you would need to learn."
                : "";
        String category = needCategory(primaryNeed);
        if (developerProject != null) {
            return switch (category) {
                case "AUTH" -> projectName + " only helps if you point to the exact access-control moment: " + authProofAngle(primaryNeed) + ". A screenshot, request example, or README excerpt would make this much more convincing than a general repo link.";
                case "DASHBOARD" -> "Use " + projectName + " as a product proof piece. Show one screen where raw API data becomes a decision: loading state, empty state, warning, filter, chart, or table. The employer should be able to see that you understand the user workflow, not just React components.";
                case "SQL" -> "Lead with the data model in " + projectName + ". Show the table shape, query or endpoint, and how the result stays predictable with filtering, pagination, or history. A short README note explaining the tradeoff is stronger than another screenshot.";
                case "DATA" -> projectName + " should prove how you handle bad inputs. Show the validation cases, the failing examples, and the message a non-technical user would see. That is the bit this employer will trust more than a polished UI.";
                case "DEPLOYMENT" -> "Show the runbook side of " + projectName + ": environment variables, Docker or setup steps, seed data, health check, and what you check when something fails. The proof is that another person could run it without guessing.";
                case "DOCS" -> "Use " + projectName + " to show developer empathy: endpoint examples, auth requirements, failure cases, and a README section that would help another engineer avoid a mistake.";
                default -> "Use " + projectName + ", but narrow the proof to " + skillText + ". Show the exact code path, screenshot, or README paragraph that makes the overlap obvious.";
            };
        }
        return switch (category) {
            case "AUTH" -> "Use a project that proves an auth decision: " + authProofAngle(primaryNeed) + "." + noPerfectMatch;
            case "DASHBOARD" -> "Use a project that turns data into an action: filters, warnings, empty/loading states, or an API-backed dashboard screen." + noPerfectMatch;
            case "SQL" -> "Use a project with a visible data decision: schema, query, pagination, audit history, or predictable API response shape." + noPerfectMatch;
            case "DATA" -> "Use a project with messy inputs and validation rules. Show examples that failed and how your tool explained the issue." + noPerfectMatch;
            case "DEPLOYMENT" -> "Use a project where setup and reliability are visible: Docker, environment docs, health checks, or deployment notes." + noPerfectMatch;
            case "DOCS" -> "Use a project where another developer can understand how to call the API, handle auth, and recover from errors." + noPerfectMatch;
            default -> "Use one checkable project, but make the evidence specific: problem, code path, result, and what you learned." + noPerfectMatch;
        };
    }

    private String buildEmployerNextStep(
            MarketplaceProfile employer,
            ProfileProjectResponse primaryNeed,
            ProfileProjectResponse developerProject,
            Set<String> gaps,
            int readinessScore
    ) {
        if (readinessScore < 45) {
            return "Build or improve one small proof piece before contacting " + employer.getName()
                    + ": a README section, screenshot, or tiny feature that directly answers their need.";
        }
        String needName = primaryNeed == null ? "their current need" : primaryNeed.name();
        String projectName = developerProject == null ? "your closest matching project" : developerProject.name();
        String gapText = gaps.isEmpty()
                ? ""
                : " Then mention how you would close the " + naturalList(new ArrayList<>(gaps).stream().limit(2).toList()) + " gap without pretending you already know it.";
        return switch (needCategory(primaryNeed)) {
            case "AUTH" -> switch (authSubtype(primaryNeed)) {
                case "JWT" -> "Make the note backend-specific: \"I saw " + needName + ". My closest proof is " + projectName + ", especially the JWT/protected-endpoint flow. I would start by tracing login/register failures, checking which endpoints need clearer docs, and shipping one safe validation or error-message improvement.\"" + gapText;
                case "PERMISSIONS" -> "Frame it around the admin workflow: \"I saw " + needName + ". In " + projectName + " I can point to similar route/permission handling. I would start by testing invite, role-change, denied-access, and failed-request states so the UI makes permission changes obvious.\"" + gapText;
                case "LOGIN" -> "Keep the outreach focused on user pain: \"I saw " + needName + ". My closest proof is " + projectName + "; I would start by reproducing failed login/register cases and tightening the validation/error feedback before touching broader auth behaviour.\"" + gapText;
                default -> "Send a note that names the risk, not the stack: \"I saw " + needName + ". My closest proof is " + projectName + ", especially the part around " + authProofAngle(primaryNeed) + ". I would start by checking the current flow, writing down the failure cases, and fixing one small edge case safely.\"" + gapText;
            };
            case "DASHBOARD" -> "Do not open with \"I know React\". Open with a useful observation: \"Your " + needName + " work sounds like it needs clearer states around data, warnings, and user decisions. Here is a dashboard project where I handled that pattern, and one screen I would improve first.\"" + gapText;
            case "SQL" -> "Make the first message about care with data: \"I noticed " + needName + ". My closest proof is " + projectName + ", where I worked on predictable records/API responses. I would start by checking the schema, pagination rules, and edge cases before changing UI.\"" + gapText;
            case "DATA" -> "Pitch yourself as the person who will not ignore messy inputs: \"I saw " + needName + ". I have proof around validation/data cleanup in " + projectName + "; I would start by listing bad-input cases and turning them into clear checks users can understand.\"" + gapText;
            case "DEPLOYMENT" -> "Frame the message around reducing release stress: \"I saw " + needName + ". My closest proof is " + projectName + "; I would start by making setup, checks, and failure notes clearer so the team can tell when the app is ready.\"" + gapText;
            case "DOCS" -> "Offer one concrete documentation improvement: \"I saw " + needName + ". I can help turn confusing auth/API behaviour into examples, failure cases, and a short sandbox-style guide. Here is the project proof I would use as a reference.\"" + gapText;
            default -> "Make the outreach specific: name " + needName + ", link " + projectName + ", and offer one small first-week contribution that matches their actual problem." + gapText;
        };
    }

    private List<String> buildImprovementTips(
            ProfileProjectResponse primaryNeed,
            ProfileProjectResponse developerProject,
            Set<String> strengths,
            Set<String> gaps,
            int readinessScore
    ) {
        List<String> tips = new ArrayList<>();
        String projectName = developerProject == null ? "one portfolio project" : developerProject.name();
        String needName = primaryNeed == null ? "this role" : primaryNeed.name();

        for (String gap : gaps) {
            if (!isFallbackSkill(gap)) {
                tips.add("Add " + gap + " proof for " + needName + ".");
            }
        }

        switch (needCategory(primaryNeed)) {
            case "AUTH" -> {
                if ("JWT".equals(authSubtype(primaryNeed))) {
                    tips.add("Add a JWT flow note for " + needName + ": login, token, protected endpoint, failure state.");
                    tips.add("Add one auth edge-case test in " + projectName + ".");
                } else if ("PERMISSIONS".equals(authSubtype(primaryNeed))) {
                    tips.add("Build a tiny admin-role demo for " + needName + ": invite, role change, denied state.");
                    tips.add("Show failed-request feedback in " + projectName + ".");
                } else {
                    tips.add("Make one auth decision inspectable for " + needName + ".");
                }
            }
            case "DASHBOARD" -> {
                tips.add("Build a mini " + needName + " dashboard using API data, filters, and warning states.");
                tips.add("Add one screenshot showing what decision the dashboard helps users make.");
            }
            case "SQL" -> {
                tips.add("Add a " + needName + " data model: table, endpoint, pagination or history.");
                tips.add("Show why the API response is predictable for the frontend.");
            }
            case "DATA" -> {
                tips.add("Add messy-input examples for " + needName + ": missing fields, duplicates, invalid values.");
                tips.add("Show the exact validation message a user would see.");
            }
            case "DEPLOYMENT" -> {
                tips.add("Add setup proof for " + needName + ": env vars, run steps, seed data, health check.");
                tips.add("Add one troubleshooting note for a likely setup failure.");
            }
            case "DOCS" -> {
                tips.add("Add API examples for " + needName + ": success response, failure response, auth note.");
                tips.add("Create a tiny sandbox/README section for trying the endpoint.");
            }
            default -> {
                tips.add("Add one small feature that mirrors " + needName + ".");
                tips.add("Show the proof: code path, screenshot, live demo, or test.");
            }
        }

        if (readinessScore < 60) {
            tips.add("Build this proof before applying.");
        } else if (readinessScore < 75) {
            tips.add("Mention " + needName + " in your outreach, not just your skill list.");
        }

        return tips.stream().distinct().limit(3).toList();
    }

    private String needCategory(ProfileProjectResponse need) {
        if (need == null) {
            return "GENERAL";
        }
        String text = projectSearchText(need);
        if (text.contains("jwt") || text.contains("auth") || text.contains("login") || text.contains("protected")) {
            return "AUTH";
        }
        if (text.contains("dashboard") || text.contains("chart") || text.contains("report")) {
            return "DASHBOARD";
        }
        if (text.contains("postgres") || text.contains("sql") || text.contains("audit") || text.contains("pagination")) {
            return "SQL";
        }
        if (text.contains("csv") || text.contains("validation") || text.contains("data cleanup")) {
            return "DATA";
        }
        if (text.contains("deploy") || text.contains("environment") || text.contains("health")) {
            return "DEPLOYMENT";
        }
        if (text.contains("api documentation") || text.contains("sandbox") || text.contains("developer experience") || text.contains("docs")) {
            return "DOCS";
        }
        return "GENERAL";
    }

    private String authProofAngle(ProfileProjectResponse need) {
        String text = projectSearchText(need);
        if (text.contains("jwt") || text.contains("token")) {
            return "JWT/token handling, protected endpoint behaviour, validation, and clearer login/register failures";
        }
        if (text.contains("role") || text.contains("admin") || text.contains("permission") || text.contains("access control")) {
            return "role assignment, admin-only route protection, permission feedback, and failed-request handling";
        }
        if (text.contains("login") || text.contains("register")) {
            return "the login/register path, validation rules, failed states, and what the user sees when auth goes wrong";
        }
        return "route protection, access checks, validation, and the user-facing failure state";
    }

    private String authSubtype(ProfileProjectResponse need) {
        String text = projectSearchText(need);
        if (text.contains("jwt") || text.contains("token")) {
            return "JWT";
        }
        if (text.contains("role") || text.contains("admin") || text.contains("permission") || text.contains("access control")) {
            return "PERMISSIONS";
        }
        if (text.contains("login") || text.contains("register")) {
            return "LOGIN";
        }
        return "GENERAL";
    }

    private ProfileProjectResponse bestDeveloperProjectForEmployer(
            DeveloperContext developerContext,
            ProfileProjectResponse primaryNeed,
            BriefAnalysis analysis,
            Set<String> strengths
    ) {
        if (developerContext == null || developerContext.projects().isEmpty()) {
            return null;
        }
        return developerContext.projects().stream()
                .max(Comparator.comparing(project -> developerProjectFitScore(project, primaryNeed, analysis, strengths)))
                .filter(project -> developerProjectFitScore(project, primaryNeed, analysis, strengths) > 0)
                .orElse(null);
    }

    private int developerProjectFitScore(
            ProfileProjectResponse project,
            ProfileProjectResponse primaryNeed,
            BriefAnalysis analysis,
            Set<String> strengths
    ) {
        String projectText = projectSearchText(project);
        int score = 0;
        for (String skill : strengths) {
            score += containsSignal(projectText, skill, briefAnalysisService.skillSignals()) ? 8 : 0;
            score += containsSignal(projectText, skill, briefAnalysisService.problemSignals()) ? 5 : 0;
        }
        for (String skill : analysis.requiredSkills()) {
            score += containsSignal(projectText, skill, briefAnalysisService.skillSignals()) ? 4 : 0;
        }
        for (String problemType : analysis.problemTypes()) {
            score += containsSignal(projectText, problemType, briefAnalysisService.problemSignals()) ? 4 : 0;
        }
        if (primaryNeed != null && project.skills() != null && primaryNeed.skills() != null) {
            for (String skill : project.skills()) {
                if (primaryNeed.skills().stream().anyMatch(needSkill -> normalize(needSkill).equals(normalize(skill)))) {
                    score += 6;
                }
            }
        }
        if (hasValue(project.githubUrl())) {
            score += 2;
        }
        if (hasValue(project.liveUrl())) {
            score += 2;
        }
        if (project.images() != null && !project.images().isEmpty()) {
            score += 2;
        }
        return score;
    }

    private String companyValues(MarketplaceProfile profile) {
        String text = candidateSearchText(profile, readProjects(profile));
        List<String> values = new ArrayList<>();
        if (text.contains("explain") || text.contains("documentation") || text.contains("readme")) {
            values.add("clear communication");
        }
        if (text.contains("junior")) {
            values.add("junior-friendly scope");
        }
        if (text.contains("validation") || text.contains("protected") || text.contains("permission") || text.contains("auth")) {
            values.add("careful, safe changes");
        }
        if (text.contains("dashboard") || text.contains("admin") || text.contains("internal")) {
            values.add("practical internal tools");
        }
        if (values.isEmpty()) {
            values.add("practical project evidence");
            values.add("clear explanations");
        }
        return naturalList(values.stream().distinct().limit(3).toList());
    }

    private String buildReason(
            MarketplaceProfile profile,
            Set<String> strengths,
            Set<String> gaps,
            List<ProfileProjectResponse> matchedProjects
    ) {
        if (strengths.isEmpty()) {
            return profile.getName() + " has adjacent project proof, but the fit is not direct. The safest next step is to ask them to connect one project to this role before shortlisting.";
        }

        if (matchedProjects.isEmpty()) {
            return profile.getName() + " has profile-level overlap in " + naturalList(new ArrayList<>(strengths))
                    + ", but there is no single project that cleanly proves the whole brief. Ask for the closest concrete example before treating them as a strong match.";
        }

        ProfileProjectResponse primaryProject = matchedProjects.get(0);
        Pronouns pronouns = pronounsFor(profile);
        String projectDetail = projectReasonDetail(primaryProject, pronouns);
        String summaryDetail = summaryReasonDetail(profile.getSummary(), pronouns);
        String proofDetail = proofReasonDetail(primaryProject);
        String strengthList = naturalList(reasonStrengths(strengths).stream().limit(3).toList());
        String gapDetail = gaps.isEmpty()
                ? ""
                : " A sensible follow-up is " + naturalList(new ArrayList<>(gaps).stream().limit(2).toList()) + ".";

        return switch (Math.floorMod(profile.getName().hashCode(), 5)) {
            case 0 -> profile.getName() + " is a strong fit because " + primaryProject.name() + " proves more than skill tags: " + projectDetail + " " + proofDetail + summaryDetail + gapDetail;
            case 1 -> primaryProject.name() + " is the strongest proof for " + profile.getName() + ". " + upperFirst(projectDetail) + " That makes " + pronouns.possessive() + " " + strengthList + " experience concrete rather than just claimed." + summaryDetail + gapDetail;
            case 2 -> profile.getName() + " has proven " + strengthList + " through " + primaryProject.name() + ": " + projectDetail + " This is the project to inspect first for how " + pronouns.subject() + " " + pronouns.handleVerb() + " implementation details and risk." + gapDetail;
            case 3 -> profile.getName() + " stands out for this search because " + primaryProject.name() + " maps directly to the work: " + projectDetail + " " + proofDetail + summaryDetail + gapDetail;
            default -> profile.getName() + " has a practical match through " + primaryProject.name() + ". " + upperFirst(projectDetail) + " " + upperFirst(pronouns.subject()) + " " + pronouns.isVerb() + " still junior, but this project gives enough specific proof to justify an interview." + gapDetail;
        };
    }

    private List<String> reasonStrengths(Set<String> strengths) {
        List<String> values = new ArrayList<>(strengths);
        if (values.contains("Security") && (values.contains("Spring Security") || values.contains("Authentication"))) {
            values.remove("Security");
        }
        return values;
    }

    private String projectReasonDetail(ProfileProjectResponse project, Pronouns pronouns) {
        String description = safe(project.description()).trim();
        if (description.isBlank()) {
            return "the project gives adjacent evidence for the role.";
        }
        return rewriteProjectDescriptionForReason(description, pronouns);
    }

    private String proofReasonDetail(ProfileProjectResponse project) {
        List<String> proof = new ArrayList<>();
        if (hasValue(project.githubUrl())) {
            proof.add("code");
        }
        if (hasValue(project.liveUrl())) {
            proof.add("a live demo");
        }
        if (project.images() != null && !project.images().isEmpty()) {
            proof.add("screenshots");
        }
        if (proof.isEmpty()) {
            return "";
        }
        return "The " + naturalList(proof) + " make the proof checkable, so this is more than a keyword match.";
    }

    private String employerNeedEvidenceDetail(ProfileProjectResponse need) {
        List<String> signals = new ArrayList<>();
        if (need.skills() != null && !need.skills().isEmpty()) {
            signals.add("skills: " + naturalList(need.skills().stream().limit(3).toList()));
        }
        if (Boolean.TRUE.equals(need.featured())) {
            signals.add("marked as a priority need");
        }
        if (signals.isEmpty()) {
            return "The profile gives enough context to decide which project proof to show first.";
        }
        return "Useful signals to inspect: " + naturalList(signals) + ".";
    }

    private String summaryReasonDetail(String summary, Pronouns pronouns) {
        String value = safe(summary).trim();
        if (value.isBlank()) {
            return "";
        }
        String[] sentences = value.split("(?<=[.!?])\\s+");
        if (sentences.length < 2) {
            return "";
        }
        return " " + upperFirst(pronouns.possessive()) + " profile adds useful context: " + rewriteSummarySentenceForReason(sentences[1].trim(), pronouns);
    }

    private String naturalList(List<String> values) {
        if (values.isEmpty()) {
            return "";
        }
        if (values.size() == 1) {
            return values.get(0);
        }
        if (values.size() == 2) {
            return values.get(0) + " and " + values.get(1);
        }
        return String.join(", ", values.subList(0, values.size() - 1)) + ", and " + values.get(values.size() - 1);
    }

    private String stripTrailingPeriod(String value) {
        return value.endsWith(".") ? value.substring(0, value.length() - 1) : value;
    }

    private String cleanNeedDescription(String description) {
        String value = stripTrailingPeriod(safe(description).trim());
        if (value.isBlank()) {
            return "a practical junior-friendly software task";
        }
        value = value
                .replaceFirst("(?i)^we need a junior developer to\\s+", "")
                .replaceFirst("(?i)^we need someone to\\s+", "")
                .replaceFirst("(?i)^we need a developer to\\s+", "")
                .replaceFirst("(?i)^a junior developer could help\\s+", "")
                .replaceFirst("(?i)^build\\s+", "building ")
                .replaceFirst("(?i)^create\\s+", "creating ")
                .replaceFirst("(?i)^improve\\s+", "improving ");
        return lowerFirst(value);
    }

    private String rewriteProjectDescriptionForReason(String description, Pronouns pronouns) {
        String value = stripTrailingPeriod(description.trim());
        String rewritten = value
                .replaceFirst("^I implemented ", pronouns.subject() + " implemented ")
                .replaceFirst("^I built ", pronouns.subject() + " built ")
                .replaceFirst("^I created ", pronouns.subject() + " created ")
                .replaceFirst("^I documented ", pronouns.subject() + " documented ")
                .replaceFirst("^I containerized ", pronouns.subject() + " containerized ")
                .replaceFirst("^I wrote ", pronouns.subject() + " wrote ")
                .replaceFirst("^I added ", pronouns.subject() + " added ");
        if (rewritten.equals(value)) {
            rewritten = pronouns.subject() + " shows " + value.substring(0, 1).toLowerCase(Locale.ROOT) + value.substring(1);
        }
        return rewritten + ".";
    }

    private String rewriteSummarySentenceForReason(String sentence, Pronouns pronouns) {
        String value = stripTrailingPeriod(sentence.trim());
        String rewritten = value
                .replaceFirst("^I'm ", pronouns.subject() + " is ")
                .replaceFirst("^I am ", pronouns.subject() + " is ")
                .replaceFirst("^I use ", pronouns.subject() + " uses ")
                .replaceFirst("^I build ", pronouns.subject() + " builds ")
                .replaceFirst("^I like ", pronouns.subject() + " likes ")
                .replaceFirst("^I care ", pronouns.subject() + " cares ")
                .replaceFirst("^I want ", pronouns.subject() + " wants ")
                .replaceFirst("^I try ", pronouns.subject() + " tries ")
                .replaceFirst("^My ", pronouns.possessive() + " ")
                .replaceFirst("^The projects here show ", pronouns.possessive() + " projects show ");
        rewritten = rewritten
                .replace(" where I can ", " where " + pronouns.subject() + " can ")
                .replace(" how I ", " how " + pronouns.subject() + " ")
                .replace(" what I ", " what " + pronouns.subject() + " ")
                .replace(" that I ", " that " + pronouns.subject() + " ")
                .replace(" I can ", " " + pronouns.subject() + " can ")
                .replace(" I ", " " + pronouns.subject() + " ");
        if (rewritten.equals(value)) {
            rewritten = value.substring(0, 1).toLowerCase(Locale.ROOT) + value.substring(1);
        }
        return rewritten + ".";
    }

    private Pronouns pronounsFor(MarketplaceProfile profile) {
        String image = safe(profile.getImage()).toLowerCase(Locale.ROOT);
        if (image.contains("/women/")) {
            return new Pronouns("she", "her", "her", "is", "handles");
        }
        if (image.contains("/men/")) {
            return new Pronouns("he", "him", "his", "is", "handles");
        }
        return new Pronouns("they", "them", "their", "are", "handle");
    }

    private String upperFirst(String value) {
        if (value.isBlank()) {
            return value;
        }
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1);
    }

    private String lowerFirst(String value) {
        if (value.isBlank()) {
            return value;
        }
        return value.substring(0, 1).toLowerCase(Locale.ROOT) + value.substring(1);
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

    private List<String> buildPeerQuestions(Set<String> strengths, Set<String> gaps, BriefAnalysis analysis) {
        List<String> questions = new ArrayList<>();
        if (strengths.contains("React") || analysis.problemTypes().contains("Dashboard")) {
            questions.add("Which React or dashboard project would be the best thing to inspect first?");
        }
        if (strengths.contains("Spring Boot") || strengths.contains("Spring Security") || strengths.contains("Authentication")) {
            questions.add("Do they show a concrete backend, auth, or permissions flow?");
        }
        if (strengths.contains("PostgreSQL") || analysis.problemTypes().contains("Data Quality")) {
            questions.add("Is there a data, SQL, or validation project with enough detail to learn from?");
        }
        if (strengths.contains("Docker") || analysis.problemTypes().contains("Deployment")) {
            questions.add("Do they explain how the project runs, deploys, or handles environment setup?");
        }
        if (!gaps.isEmpty()) {
            questions.add("Are you also learning " + naturalList(new ArrayList<>(gaps).stream().limit(2).toList()) + "?");
        }
        if (questions.isEmpty()) {
            questions.add("What project are you building next, and where would another developer be useful?");
        }
        return questions.stream().limit(3).toList();
    }

    private List<String> buildEmployerQuestions(Set<String> strengths, Set<String> gaps, BriefAnalysis analysis) {
        List<String> questions = new ArrayList<>();
        if (strengths.contains("React") || analysis.problemTypes().contains("Dashboard")) {
            questions.add("Which dashboard, UI state, or workflow need fits your strongest project?");
        }
        if (strengths.contains("Spring Boot") || strengths.contains("Spring Security") || strengths.contains("Authentication")) {
            questions.add("What backend, authentication, or permissions proof would you show them?");
        }
        if (strengths.contains("PostgreSQL") || analysis.problemTypes().contains("Data Quality")) {
            questions.add("Which data, SQL, reporting, or validation project would answer this need?");
        }
        if (strengths.contains("Docker") || analysis.problemTypes().contains("Deployment")) {
            questions.add("Do they need deployment, environment setup, or production-style maintenance proof?");
        }
        if (!gaps.isEmpty()) {
            questions.add("Check whether your profile already proves " + naturalList(new ArrayList<>(gaps).stream().limit(2).toList()) + ".");
        }
        if (questions.isEmpty()) {
            questions.add("Which of your projects best matches this employer's current needs?");
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

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private List<ProfileProjectResponse> readProjects(MarketplaceProfile profile) {
        try {
            return objectMapper.readValue(profile.getProjectsJson(), new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private List<ProfilePostResponse> readPosts(MarketplaceProfile profile) {
        try {
            return objectMapper.readValue(profile.getPostsJson(), new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private record OpenAiRankingResponse(
            List<OpenAiDeveloperMatch> matches
    ) {
        private OpenAiRankingResponse {
            matches = matches == null ? List.of() : matches;
        }
    }

    private record OpenAiDeveloperMatch(
            Long profileId,
            int score,
            String reason,
            List<String> matchedSignals,
            List<String> bestEvidence,
            List<String> remainingRisks,
            String hiringOutlook,
            String proofToShow,
            String nextStep
    ) {
        private OpenAiDeveloperMatch {
            matchedSignals = matchedSignals == null ? List.of() : matchedSignals;
            bestEvidence = bestEvidence == null ? List.of() : bestEvidence;
            remainingRisks = remainingRisks == null ? List.of() : remainingRisks;
        }
    }

    private record CandidateScore(
            MarketplaceProfile profile,
            List<ProfileProjectResponse> projects,
            int score
    ) {
    }

    private record DeveloperContext(
            MarketplaceProfile profile,
            List<ProfileProjectResponse> projects
    ) {
    }

    private record Pronouns(
            String subject,
            String object,
            String possessive,
            String isVerb,
            String handleVerb
    ) {
    }
}
