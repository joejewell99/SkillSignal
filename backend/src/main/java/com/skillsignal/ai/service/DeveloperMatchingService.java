package com.skillsignal.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.ai.dto.AiMatchResponse;
import com.skillsignal.ai.dto.DeveloperMatchResponse;
import com.skillsignal.marketplace.dto.EmployerNeedResponse;
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
        List<CandidateScore> shortlist = prefilterCandidates(analysis, excludedUserId, targetType);
        List<DeveloperMatchResponse> matches = rankMatches(shortlist, analysis, employerMode);
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

    private List<DeveloperMatchResponse> rankMatches(List<CandidateScore> shortlist, BriefAnalysis analysis, boolean employerMode) {
        return shortlist.stream()
                .map(candidate -> buildMatch(candidate, analysis, employerMode))
                .sorted(Comparator.comparing(DeveloperMatchResponse::matchScore).reversed())
                .limit(MATCH_LIMIT)
                .toList();
    }

    private DeveloperMatchResponse buildMatch(CandidateScore candidate, BriefAnalysis analysis, boolean employerMode) {
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
                employerMode ? buildEmployerReason(profile, strengths, gaps, matchedProjects) : buildPeerReason(profile, strengths, gaps, matchedProjects),
                employerMode ? buildEmployerQuestions(strengths, gaps, analysis) : buildPeerQuestions(strengths, gaps, analysis)
        );
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
            List<ProfileProjectResponse> matchedProjects
    ) {
        if (strengths.isEmpty()) {
            return profile.getName() + " has adjacent hiring signals. Open the profile and check whether their current needs fit the project proof you can show.";
        }

        if (matchedProjects.isEmpty()) {
            return profile.getName() + " overlaps with your search in " + naturalList(new ArrayList<>(strengths))
                    + ". Their profile is worth checking, but inspect the individual hiring needs before treating it as a direct fit.";
        }

        ProfileProjectResponse primaryNeed = matchedProjects.get(0);
        String strengthList = naturalList(reasonStrengths(strengths).stream().limit(3).toList());
        String evidenceDetail = employerNeedEvidenceDetail(primaryNeed);
        String gapDetail = gaps.isEmpty()
                ? ""
                : " Check whether they also need " + naturalList(new ArrayList<>(gaps).stream().limit(2).toList()) + ".";

        return profile.getName() + " is worth a look because " + primaryNeed.name()
                + " maps to " + strengthList + ". "
                + stripTrailingPeriod(primaryNeed.description()) + ". "
                + evidenceDetail + gapDetail;
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

    private record Pronouns(
            String subject,
            String object,
            String possessive,
            String isVerb,
            String handleVerb
    ) {
    }
}
