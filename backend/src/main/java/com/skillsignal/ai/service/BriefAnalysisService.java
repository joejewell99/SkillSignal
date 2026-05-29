package com.skillsignal.ai.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class BriefAnalysisService {
    private static final Map<String, List<String>> SKILL_SIGNALS = new LinkedHashMap<>();
    private static final Map<String, List<String>> PROBLEM_SIGNALS = new LinkedHashMap<>();
    private static final List<String> OFF_TOPIC_SIGNALS = List.of(
            "poem", "recipe", "weather", "capital of", "homework", "song", "lyrics", "dating",
            "movie", "sports score", "essay", "translate", "joke", "story"
    );

    static {
        SKILL_SIGNALS.put("React", List.of("react", "frontend", "front end", "components", "ui", "loading states"));
        SKILL_SIGNALS.put("Spring Boot", List.of("spring boot", "java service", "rest api", "rest apis"));
        SKILL_SIGNALS.put("Spring Security", List.of("spring security", "security", "secure", "role-based", "roles", "permissions"));
        SKILL_SIGNALS.put("Authentication", List.of("auth", "authentication", "login", "jwt", "protected routes"));
        SKILL_SIGNALS.put("PostgreSQL", List.of("postgres", "postgresql", "database", "sql", "query", "queries"));
        SKILL_SIGNALS.put("Docker", List.of("docker", "container", "containerized", "environment"));
        SKILL_SIGNALS.put("Node.js", List.of("node", "node.js", "express", "javascript backend"));
        SKILL_SIGNALS.put("Ruby on Rails", List.of("ruby", "rails", "ruby on rails"));
        SKILL_SIGNALS.put("Python", List.of("python", "data cleanup", "automation", "script"));
        SKILL_SIGNALS.put("Testing", List.of("test", "testing", "qa", "validation", "regression"));

        PROBLEM_SIGNALS.put("Dashboard", List.of("dashboard", "analytics", "reporting", "charts", "metrics", "insights page"));
        PROBLEM_SIGNALS.put("Performance", List.of("slow", "latency", "performance", "optimize", "optimise", "speed", "takes forever"));
        PROBLEM_SIGNALS.put("Maintenance", List.of("maintain", "maintenance", "existing", "legacy", "production"));
        PROBLEM_SIGNALS.put("Security", List.of("security", "permission", "permissions", "access control", "admin access"));
        PROBLEM_SIGNALS.put("Data Quality", List.of("csv", "import", "messy data", "validation", "data quality"));
        PROBLEM_SIGNALS.put("Deployment", List.of("deploy", "deployment", "cloud", "health check", "environment"));
        PROBLEM_SIGNALS.put("Finance", List.of("finance", "fintech", "banking", "payments", "cost"));
        PROBLEM_SIGNALS.put("Developer Experience", List.of("api documentation", "sandbox", "developer experience", "docs"));
    }

    public BriefAnalysis analyze(String brief) {
        String normalizedBrief = normalize(brief);
        List<String> requiredSkills = extractSignals(normalizedBrief, SKILL_SIGNALS);
        List<String> problemTypes = extractSignals(normalizedBrief, PROBLEM_SIGNALS);
        List<String> idealTraits = extractIdealTraits(normalizedBrief);

        if (isOffTopic(normalizedBrief, requiredSkills, problemTypes)) {
            return new BriefAnalysis(
                    normalizedBrief,
                    "OFF_TOPIC",
                    true,
                    "This matcher is for software hiring needs. Describe a software problem, stack, product area, or project evidence you want to see.",
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of("What software problem needs work?", "What stack or tools are involved?", "What kind of project proof would make you trust a candidate?")
            );
        }

        List<String> followUpQuestions = buildRequiredFollowUpQuestions(normalizedBrief, requiredSkills, problemTypes);
        String quality = followUpQuestions.isEmpty() ? "GOOD" : "NEEDS_MORE_DETAIL";
        if (requiredSkills.isEmpty()) {
            requiredSkills = List.of("Problem Solving", "Communication", "Project Evidence");
        }
        if (problemTypes.isEmpty()) {
            problemTypes = List.of("Delivery");
        }

        return new BriefAnalysis(
                normalizedBrief,
                quality,
                false,
                "",
                requiredSkills,
                problemTypes,
                idealTraits,
                followUpQuestions
        );
    }

    public Map<String, List<String>> skillSignals() {
        return SKILL_SIGNALS;
    }

    public Map<String, List<String>> problemSignals() {
        return PROBLEM_SIGNALS;
    }

    private boolean isOffTopic(String normalizedBrief, List<String> requiredSkills, List<String> problemTypes) {
        boolean hasSoftwareSignal = !requiredSkills.isEmpty()
                || !problemTypes.isEmpty()
                || normalizedBrief.contains("software")
                || normalizedBrief.contains("developer")
                || normalizedBrief.contains("app")
                || normalizedBrief.contains("website")
                || normalizedBrief.contains("api")
                || normalizedBrief.contains("database")
                || normalizedBrief.contains("bug")
                || normalizedBrief.contains("feature");
        return !hasSoftwareSignal && OFF_TOPIC_SIGNALS.stream().anyMatch(normalizedBrief::contains);
    }

    private List<String> buildRequiredFollowUpQuestions(String normalizedBrief, List<String> requiredSkills, List<String> problemTypes) {
        List<String> questions = new ArrayList<>();
        int wordCount = normalizedBrief.isBlank() ? 0 : normalizedBrief.split("\\s+").length;

        if (wordCount < 12) {
            questions.add("Add a little more context about the actual software problem.");
        }
        if (requiredSkills.isEmpty()) {
            questions.add("Mention any stack, tools, language, framework, database, or platform involved.");
        }
        if (problemTypes.isEmpty()) {
            questions.add("Say what kind of work this is: performance, dashboard, auth, data quality, deployment, maintenance, or something else.");
        }
        return questions.stream().limit(3).toList();
    }

    private List<String> extractSignals(String normalizedBrief, Map<String, List<String>> signalMap) {
        return signalMap.entrySet().stream()
                .filter(entry -> entry.getValue().stream().anyMatch(normalizedBrief::contains))
                .map(Map.Entry::getKey)
                .toList();
    }

    private List<String> extractIdealTraits(String normalizedBrief) {
        Set<String> traits = new LinkedHashSet<>();
        if (normalizedBrief.contains("explain") || normalizedBrief.contains("communicat")) {
            traits.add("clear communication");
        }
        if (normalizedBrief.contains("careful") || normalizedBrief.contains("safely") || normalizedBrief.contains("risk")) {
            traits.add("careful production changes");
        }
        if (normalizedBrief.contains("junior")) {
            traits.add("junior-friendly scope");
        }
        return new ArrayList<>(traits);
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }
}
