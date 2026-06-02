package com.skillsignal.bootstrap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.connection.model.ConnectionStatus;
import com.skillsignal.connection.model.DeveloperConnection;
import com.skillsignal.connection.repository.DeveloperConnectionRepository;
import com.skillsignal.marketplace.dto.DeveloperPreferencesResponse;
import com.skillsignal.marketplace.dto.ProfileContactLinksResponse;
import com.skillsignal.marketplace.dto.ProfilePostResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.user.model.AppUser;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(20)
public class DemoDeveloperSeeder implements CommandLineRunner {
    private static final String PASSWORD = "Password123!";

    private final UserRepository userRepository;
    private final MarketplaceProfileRepository profileRepository;
    private final DeveloperConnectionRepository connectionRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public DemoDeveloperSeeder(
            UserRepository userRepository,
            MarketplaceProfileRepository profileRepository,
            DeveloperConnectionRepository connectionRepository,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.connectionRepository = connectionRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) {
        List<SeedProfile> seeds = buildSeeds();
        List<MarketplaceProfile> seededProfiles = new ArrayList<>();

        for (int index = 0; index < seeds.size(); index += 1) {
            SeedProfile seed = seeds.get(index);
            AppUser user = userRepository.findByEmailIgnoreCase(seed.email())
                    .filter(existingUser -> existingUser.getRole() == Role.DEVELOPER)
                    .orElseGet(() -> userRepository.findByEmailIgnoreCase(seed.fallbackEmail())
                            .orElseGet(() -> userRepository.save(new AppUser(
                                    seed.name(),
                                    seed.fallbackEmail(),
                                    passwordEncoder.encode(PASSWORD),
                                    Role.DEVELOPER
                            ))));

            MarketplaceProfile profile = profileRepository.findByUserId(user.getId())
                    .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(user.getId(), seed.name())));

            profile.setName(seed.name());
            profile.setTitle(seed.title());
            profile.setSummary(seed.summary());
            profile.setImage(seed.image());
            profile.setSkills(seed.skills());
            profile.setDisplayOrder(seed.displayOrder());
            profile.setDemoProfile(true);
            profile.setContactLinksJson(writeJson(new ProfileContactLinksResponse(
                    "https://www.linkedin.com/in/" + seed.slug(),
                    "https://github.com/" + seed.slug(),
                    "hello@" + seed.slug() + ".dev",
                    "https://" + seed.slug() + ".dev"
            ), "{}"));
            profile.setPreferencesJson(writeJson(new DeveloperPreferencesResponse(
                    seed.availability(),
                    seed.workTypes(),
                    seed.remotePreference()
            ), "{}"));
            profile.setProjectsJson(writeJson(seed.projects(), "[]"));
            profile.setPostsJson(writeJson(seed.posts(), "[]"));
            profile.setDisplayed(true);
            seededProfiles.add(profileRepository.save(profile));
        }

        hideStaleGeneratedProfiles(seededProfiles);
        seedConnections(seededProfiles);
    }

    private void hideStaleGeneratedProfiles(List<MarketplaceProfile> seededProfiles) {
        Set<Long> activeSeedIds = seededProfiles.stream()
                .map(MarketplaceProfile::getId)
                .collect(java.util.stream.Collectors.toSet());
        profileRepository.findAll().stream()
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .filter(profile -> profile.getDisplayOrder() >= 200 && profile.getDisplayOrder() <= 299)
                .filter(profile -> !activeSeedIds.contains(profile.getId()))
                .forEach(profile -> {
                    profile.setDisplayed(false);
                    profile.setDemoProfile(true);
                    profile.setDisplayOrder(1000);
                    profileRepository.save(profile);
                });
    }

    private void seedConnections(List<MarketplaceProfile> profiles) {
        for (int index = 0; index < profiles.size(); index += 1) {
            MarketplaceProfile first = profiles.get(index);
            MarketplaceProfile second = profiles.get((index + 7) % profiles.size());
            MarketplaceProfile third = profiles.get((index + 23) % profiles.size());
            createAcceptedConnection(first, second);
            if (index % 3 == 0) {
                createAcceptedConnection(first, third);
            }
        }
    }

    private void createAcceptedConnection(MarketplaceProfile requester, MarketplaceProfile receiver) {
        if (requester.getUserId() == null || receiver.getUserId() == null || requester.getUserId().equals(receiver.getUserId())) {
            return;
        }
        connectionRepository.findBetweenUsers(requester.getUserId(), receiver.getUserId())
                .orElseGet(() -> {
                    DeveloperConnection connection = new DeveloperConnection(
                            requester.getUserId(),
                            receiver.getUserId(),
                            requester,
                            receiver
                    );
                    connection.setStatus(ConnectionStatus.ACCEPTED);
                    return connectionRepository.save(connection);
                });
    }

    private List<SeedProfile> buildSeeds() {
        String[] legacyFirstNames = {
                "Maya", "Daniel", "Sofia", "Ethan", "Aisha", "Leo", "Priya", "Noah", "Chloe", "Samir",
                "Grace", "Owen", "Imani", "Tom", "Nina", "Marcus", "Hannah", "Kai", "Lena", "Arjun",
                "Zara", "Milo", "Elena", "Jonas", "Tara", "Rafael", "Mei", "Oscar", "Amara", "Felix",
                "Layla", "Victor", "Anika", "Caleb", "Yara", "Theo", "Mina", "Julian", "Nadia", "Eli",
                "Rina", "Mateo", "Sara", "Ivan", "Leah", "Omar", "Mia", "Andre", "Tessa", "Nikhil",
                "Ava", "Bilal", "Clara", "Dylan", "Esme", "Finn", "Gita", "Hugo", "Iris", "Jamal",
                "Kira", "Luca", "Mara", "Nico", "Orla", "Pavel", "Quinn", "Rosa", "Sami", "Talia",
                "Uma", "Vera", "Wren", "Xavi", "Yusuf", "Zoe", "Bella", "Cyrus", "Dina", "Ezra",
                "Freya", "Gabe", "Hana", "Isla", "Jude", "Keira", "Luis", "Mira", "Nolan", "Pia",
                "Reza", "Selin", "Toby", "Una", "Vikram", "Will", "Yasmin", "Zain", "Marta", "Rory"
        };
        String[] femaleFirstNames = {
                "Maya", "Sofia", "Aisha", "Priya", "Chloe", "Grace", "Imani", "Nina", "Hannah", "Lena",
                "Zara", "Elena", "Tara", "Mei", "Amara", "Layla", "Anika", "Yara", "Mina", "Nadia",
                "Rina", "Sara", "Leah", "Mia", "Tessa", "Ava", "Clara", "Esme", "Gita", "Iris",
                "Kira", "Mara", "Orla", "Rosa", "Talia", "Uma", "Vera", "Wren", "Zoe", "Bella",
                "Dina", "Freya", "Hana", "Isla", "Keira", "Mira", "Pia", "Selin", "Yasmin", "Marta"
        };
        String[] maleFirstNames = {
                "Daniel", "Ethan", "Leo", "Noah", "Samir", "Owen", "Tom", "Marcus", "Kai", "Arjun",
                "Milo", "Jonas", "Rafael", "Oscar", "Felix", "Victor", "Caleb", "Theo", "Julian", "Eli",
                "Mateo", "Ivan", "Omar", "Andre", "Nikhil", "Bilal", "Dylan", "Finn", "Hugo", "Jamal",
                "Luca", "Nico", "Pavel", "Sami", "Xavi", "Yusuf", "Cyrus", "Ezra", "Gabe", "Jude",
                "Luis", "Nolan", "Reza", "Toby", "Vikram", "Will", "Zain", "Rory", "Devon", "Miles"
        };
        String[] lastNames = {
                "Patel", "Okafor", "Nguyen", "Brooks", "Morgan", "Hernandez", "Shah", "Williams", "Martin", "Khan",
                "Taylor", "Clarke", "Lewis", "Evans", "Rossi", "Green", "Wright", "Bennett", "Fischer", "Mehta",
                "Ali", "Stone", "Marquez", "Iversen", "Singh", "Costa", "Chen", "Reed", "Bell", "Hart",
                "Nasser", "Meyer", "Roy", "Price", "Kowalski", "Grant", "Park", "Cole", "Farah", "Bishop",
                "Sato", "Diaz", "Brown", "Petrov", "Hale", "Rahman", "Fox", "Silva", "Rowe", "Menon",
                "King", "Haddad", "Voss", "Murphy", "Lane", "Mason", "Rao", "Ward", "Blake", "Abbasi",
                "Novak", "Moretti", "Olsen", "Weber", "Byrne", "Havel", "Ellis", "Lopez", "Hassan", "Nordin",
                "Iyer", "Klein", "Snow", "Morales", "Yilmaz", "Baker", "Young", "Dawson", "Ibrahim", "Miles",
                "Walsh", "Turner", "Kim", "Sinclair", "Parker", "Byrd", "Santos", "Vale", "Cooper", "Batra",
                "Azizi", "Aydin", "Powell", "Hayes", "Raman", "Scott", "Jafari", "Malik", "Nowak", "Quinn"
        };

        List<ProfileTheme> themes = List.of(
                new ProfileTheme("React Dashboard Developer", List.of("React", "Dashboards", "REST APIs", "CSS", "API Error States"), List.of("TypeScript", "Charts", "Accessibility", "Forms", "Design Systems"), "dashboard", "React dashboard", "frontend data screens", "API-driven UI"),
                new ProfileTheme("Spring Boot API Developer", List.of("Java", "Spring Boot", "REST APIs", "PostgreSQL", "Testing"), List.of("Validation", "Pagination", "OpenAPI", "JPA", "Service Design"), "api", "Spring Boot API", "backend endpoints", "service validation"),
                new ProfileTheme("Authentication Developer", List.of("Spring Security", "JWT", "Authentication", "React", "PostgreSQL"), List.of("Role-based Access", "Password Reset", "Audit Logs", "Forms", "Session Handling"), "auth", "JWT authentication", "protected routes", "role-based access"),
                new ProfileTheme("Data Quality Developer", List.of("Python", "SQL", "CSV", "Data cleanup", "Validation"), List.of("Pandas", "Automation", "Reporting", "ETL", "Error Reports"), "data", "CSV quality checker", "messy data workflow", "validation rules"),
                new ProfileTheme("DevOps-minded Developer", List.of("Docker", "Deployment", "Linux", "Environment Config", "CI/CD"), List.of("GitHub Actions", "Health Checks", "Logging", "PostgreSQL", "Release Notes"), "deploy", "Docker deployment", "health checks", "environment setup"),
                new ProfileTheme("Ruby Workflow Developer", List.of("Ruby", "Rails", "SQL", "CRUD", "Authentication"), List.of("Hotwire", "Background Jobs", "Admin Screens", "RSpec", "PostgreSQL"), "rails", "Rails account workflow", "admin CRUD screens", "status history"),
                new ProfileTheme("Testing and QA Developer", List.of("Testing", "JavaScript", "Validation", "Bug Reports", "APIs"), List.of("Playwright", "JUnit", "Regression", "Test Data", "Exploratory QA"), "testing", "regression test suite", "bug reproduction flow", "quality checks"),
                new ProfileTheme("Developer Experience Developer", List.of("API Documentation", "Sandbox", "REST APIs", "Authentication", "JavaScript"), List.of("OpenAPI", "SDK Examples", "Postman", "Docs", "Onboarding"), "docs", "API documentation sandbox", "developer examples", "auth docs"),
                new ProfileTheme("Cloud Cost Tools Developer", List.of("Python", "SQL", "Dashboards", "Cloud", "Reporting"), List.of("FinOps", "Forecasting", "AWS", "Billing Data", "Charts"), "cloud", "cloud cost dashboard", "usage reports", "cost insights"),
                new ProfileTheme("Support Tools Developer", List.of("React", "Node.js", "SQL", "Internal Tools", "Workflow States"), List.of("Express", "Queues", "Admin UX", "Notifications", "Permissions"), "support", "support triage tool", "ticket workflow", "internal tooling")
        );

        List<SeedProfile> seeds = new ArrayList<>();
        for (int index = 0; index < 100; index += 1) {
            ProfileTheme theme = themes.get(index % themes.size());
            String legacySlug = legacyFirstNames[index].toLowerCase(Locale.ROOT);
            boolean usesFemalePortrait = index % 2 == 0;
            String[] firstNamePool = usesFemalePortrait ? femaleFirstNames : maleFirstNames;
            int genderedNameIndex = (index / 2 * 7 + index / 10) % firstNamePool.length;
            String name = firstNamePool[genderedNameIndex] + " " + lastNames[(index * 37 + 11) % lastNames.length];
            String slug = slugify(name);
            String email = legacySlug + "@gmail.com";
            String fallbackEmail = slug + "@skillsignal.dev";
            String image = portraitUrl(index);
            boolean featured = index % 4 == 0;
            String domain = domainFor(index);
            String habit = habitFor(index);
            String proofStyle = proofStyleFor(index);
            List<String> skills = skillsFor(theme, index);
            List<ProfileProjectResponse> projects = projectsFor(theme, slug, featured, index, domain, habit, skills);
            List<ProfilePostResponse> posts = postsFor(theme, slug, index, domain, habit, projects);
            seeds.add(new SeedProfile(
                    name,
                    slug,
                    email,
                    fallbackEmail,
                    titleFor(theme, domain, proofStyle, index),
                    summaryFor(name, theme, domain, habit, proofStyle, skills, index),
                    image,
                    skills,
                    availabilityFor(index),
                    workTypesFor(theme, domain),
                    remotePreferenceFor(index),
                    projects,
                    posts,
                    200 + index
            ));
        }
        return seeds;
    }

    private List<ProfileProjectResponse> projectsFor(ProfileTheme theme, String slug, boolean featured, int index, String domain, String habit, List<String> skills) {
        List<ProjectDraft> drafts = projectDraftsFor(theme, domain, habit, index);
        return List.of(
                new ProfileProjectResponse(
                        drafts.get(0).name(),
                        drafts.get(0).description(),
                        "https://github.com/" + slug + "/" + theme.slug() + "-proof",
                        "https://" + slug + "-" + theme.slug() + ".netlify.app",
                        skills.subList(0, Math.min(4, skills.size())),
                        List.of(projectImage(theme.slug(), index, 0)),
                        featured
                ),
                new ProfileProjectResponse(
                        drafts.get(1).name(),
                        drafts.get(1).description(),
                        "https://github.com/" + slug + "/" + theme.slug() + "-notes",
                        "",
                        rotate(skills, 1).stream().limit(4).toList(),
                        List.of(projectImage(theme.slug(), index, 1)),
                        !featured && theme.slug().length() % 2 == 0
                ),
                new ProfileProjectResponse(
                        drafts.get(2).name(),
                        drafts.get(2).description(),
                        "https://github.com/" + slug + "/" + theme.slug() + "-evidence",
                        "",
                        rotate(skills, 2).stream().limit(3).toList(),
                        List.of(projectImage(theme.slug(), index, 2)),
                        false
                )
        );
    }

    private List<ProfilePostResponse> postsFor(ProfileTheme theme, String slug, int index, String domain, String habit, List<ProfileProjectResponse> projects) {
        String reviewFocus = List.of("empty states", "edge cases", "README screenshots", "seed data", "permissions", "slow queries", "form validation", "deployment notes").get((index + index / 10) % 8);
        String learningFocus = rotate(theme.skills(), (index + index / 10) % theme.skills().size()).stream().limit(2).reduce((first, second) -> first + " and " + second).orElse(theme.title());
        return List.of(
                new ProfilePostResponse(slug + "-feed-1", "I finished another pass on " + projects.get(0).name() + "; this time I tightened the " + reviewFocus + " so the " + domain + " flow is easier to review.", "2026-05-" + twoDigit(10 + (index % 18)) + "T09:30:00.000Z"),
                new ProfilePostResponse(slug + "-feed-2", "I'm practising " + learningFocus + " by writing shorter notes about what changed, what broke first, and how I checked the fix.", "2026-05-" + twoDigit(8 + (index % 18)) + "T14:15:00.000Z"),
                new ProfilePostResponse(slug + "-feed-3", "I added a small proof section for " + projects.get(1).name() + " because " + habit + " matters more when someone else has to judge the work quickly.", "2026-05-" + twoDigit(6 + (index % 18)) + "T17:05:00.000Z")
        );
    }

    private String summaryFor(String name, ProfileTheme theme, String domain, String habit, String proofStyle, List<String> skills, int index) {
        String skillList = naturalList(skills.stream().limit(3).toList());
        String topSkill = skills.get(0);
        String projectTone = projectToneFor(theme, domain);
        String goal = learningGoalFor(theme, index);
        String teamFit = teamFitFor(index);
        return switch (index % 12) {
            case 0 -> "Hi, I'm " + name + ". I build " + theme.problemArea() + " for " + domain + ", mostly through small projects that prove the whole flow works. I'm using " + skillList + " and trying to get better at " + goal + ".";
            case 1 -> "I build " + theme.problemArea() + " for " + domain + ". The work I enjoy most is the practical middle bit: understanding the messy requirement, shipping a narrow version, and writing down how I checked it.";
            case 2 -> "Most of my portfolio is about " + projectTone + ". I use " + skillList + " to turn a rough idea into something a reviewer can run, click through, and question.";
            case 3 -> "I'm focused on " + theme.problemArea() + " for " + domain + ". I care about readable code, useful screenshots, and notes that show what I tried before the final version worked.";
            case 4 -> "I like turning " + domain + " problems into working software. My recent projects use " + skillList + ", and I'm looking for junior work where I can keep improving real product flows instead of only building toy examples.";
            case 5 -> "Right now I'm building " + theme.problemArea() + " for " + domain + ". I tend to start with " + proofStyle + ", then tighten the parts that would confuse a teammate or user.";
            case 6 -> "I'm early in my career and most interested in " + summaryFocusFor(theme) + " work. My projects are small on purpose: they show how I handle " + topSkill + ", edge cases, and the handoff notes another developer would need.";
            case 7 -> "I use " + skillList + " to build " + domain + " tools that are easy to review. I want my portfolio to show how I think through tradeoffs, not just that a screen or endpoint exists.";
            case 8 -> "My strongest project work sits around " + theme.problemArea() + ". I like projects where I can " + habit + " and still leave the code simple enough for someone else to maintain.";
            case 9 -> "I'm aiming for junior roles where I can contribute to " + domain + " software and keep learning from code review. The projects here show " + skillList + " plus the notes, screenshots, and rough edges behind the build.";
            case 10 -> "I enjoy the kind of work where " + domain + " users need a clearer process, not a huge platform. My projects are built with " + skillList + " and usually focus on making the next action obvious.";
            default -> "I build practical " + summaryFocusFor(theme) + " projects with " + topSkill + " at the center. " + teamFit + " matters to me, so I try to explain my decisions and keep the proof easy to inspect.";
        };
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

    private String projectToneFor(ProfileTheme theme, String domain) {
        return switch (theme.slug()) {
            case "dashboard" -> "making " + domain + " data easier to scan";
            case "api" -> "turning " + domain + " rules into clear backend endpoints";
            case "auth" -> "making account access safer and easier to understand";
            case "data" -> "cleaning messy " + domain + " data before it reaches reports";
            case "deploy" -> "getting " + domain + " apps running reliably outside my machine";
            case "rails" -> "building Rails workflows that track real account changes";
            case "testing" -> "reproducing bugs and proving fixes with careful checks";
            case "docs" -> "making API examples easier for another developer to follow";
            case "cloud" -> "explaining cloud usage and cost changes clearly";
            default -> "making internal " + domain + " workflows less confusing";
        };
    }

    private String learningGoalFor(ProfileTheme theme, int index) {
        List<String> sharedGoals = List.of(
                "writing clearer README notes",
                "catching edge cases earlier",
                "explaining tradeoffs without overcomplicating them",
                "turning feedback into a cleaner second version",
                "making project proof easier to inspect"
        );
        return switch (theme.slug()) {
            case "dashboard" -> List.of("stateful React screens", "filters and empty states", "data-heavy UI decisions").get(index % 3);
            case "api" -> List.of("service boundaries", "validation errors", "database-backed API design").get(index % 3);
            case "auth" -> List.of("permission edge cases", "safer account flows", "role-based UI decisions").get(index % 3);
            case "data" -> List.of("messy import rules", "SQL checks", "clear validation reports").get(index % 3);
            case "deploy" -> List.of("repeatable local setup", "environment config", "release checklists").get(index % 3);
            case "rails" -> List.of("model relationships", "admin workflow details", "small Rails test coverage").get(index % 3);
            case "testing" -> List.of("better bug reports", "regression checks", "test data that exposes awkward cases").get(index % 3);
            case "docs" -> List.of("developer onboarding", "API examples", "auth documentation").get(index % 3);
            case "cloud" -> List.of("cost reporting", "usage forecasting", "dashboard explanations").get(index % 3);
            default -> sharedGoals.get(index % sharedGoals.size());
        };
    }

    private String teamFitFor(int index) {
        return List.of(
                "Clear communication",
                "Being useful to a small product team",
                "Making work reviewable",
                "Learning from senior feedback",
                "Leaving tidy notes for the next person"
        ).get(index % 5);
    }

    private List<String> workTypesFor(ProfileTheme theme, String domain) {
        return switch (theme.slug()) {
            case "dashboard", "cloud" -> List.of("Dashboards", "Reporting", domain);
            case "api", "auth", "docs" -> List.of("Backend APIs", "Documentation", domain);
            case "data" -> List.of("Data cleanup", "Validation", domain);
            case "deploy" -> List.of("Deployment", "DevOps support", domain);
            case "rails", "support" -> List.of("Internal tools", "CRUD workflows", domain);
            default -> List.of("Testing", "Bug fixing", domain);
        };
    }

    private String portraitUrl(int index) {
        String genderPath = index % 2 == 0 ? "women" : "men";
        int portraitId = index % 100;
        return "https://randomuser.me/api/portraits/" + genderPath + "/" + portraitId + ".jpg";
    }

    private String projectImage(String themeSlug, int index, int offset) {
        String query = switch (themeSlug) {
            case "dashboard", "cloud" -> "dashboard,analytics";
            case "api", "auth", "docs" -> "code,software";
            case "data" -> "data,spreadsheet";
            case "deploy" -> "server,cloud";
            case "rails", "support" -> "workflow,office";
            default -> "testing,software";
        };
        return "https://source.unsplash.com/900x560/?" + query + "&sig=" + themeSlug + "-" + index + "-" + offset;
    }

    private String titleFor(ProfileTheme theme, String domain, String proofStyle, int index) {
        String focus = titleFocusFor(theme);
        String sector = titleCase(domain);
        return switch ((index + index / 10) % 10) {
            case 0 -> "Junior " + focus + " Developer";
            case 1 -> sector + " " + focus + " Intern";
            case 2 -> "Computer Science Student, " + focus;
            case 3 -> "Computer Engineering Student, " + focus;
            case 4 -> "Junior " + focus + " Engineer";
            case 5 -> "Software Engineering Intern, " + focus;
            case 6 -> "Trainee " + focus + " Developer";
            case 7 -> "Student Developer, " + focus;
            case 8 -> "Entry-level " + focus + " Developer";
            default -> "Junior Software Developer, " + focus;
        };
    }

    private List<String> skillsFor(ProfileTheme theme, int index) {
        List<String> skills = new ArrayList<>();
        skills.addAll(rotate(theme.skills(), (index + index / 10) % theme.skills().size()).stream().limit(3).toList());
        skills.addAll(rotate(theme.adjacentSkills(), (index + index / 10) % theme.adjacentSkills().size()).stream().limit(2).toList());
        String extra = List.of("GitHub", "Debugging", "Documentation", "User Feedback", "Accessibility", "Refactoring", "Test Notes", "Product Thinking").get((index + index / 10) % 8);
        if (!skills.contains(extra)) {
            skills.add(extra);
        }
        return skills.stream().distinct().limit(6).toList();
    }

    private List<ProjectDraft> projectDraftsFor(ProfileTheme theme, String domain, String habit, int index) {
        String noun = List.of("Tracker", "Console", "Workbench", "Portal", "Review Board", "Assistant", "Ledger", "Toolkit", "Inspector", "Planner").get((index + index / 10) % 10);
        String audience = List.of("coordinators", "support leads", "hiring reviewers", "clinic admins", "course mentors", "finance assistants", "operations teams", "volunteer managers", "shop owners", "customer success reps").get((index * 3 + index / 10) % 10);
        return switch (theme.slug()) {
            case "dashboard" -> List.of(
                    draft(titleCase(domain) + " Metrics " + noun, "I built a React reporting screen for " + audience + " with filters, loading states, empty states, and API-shaped chart data for " + domain + "."),
                    draft(titleCase(domain) + " Activity Table", "I created a sortable table that separates recent activity, stale records, and follow-up notes so " + audience + " can scan what changed without opening every record."),
                    draft(titleCase(domain) + " UI Evidence Notes", "I documented component decisions, screenshots, and a checklist for how I " + habit + " before handing the dashboard to another reviewer.")
            );
            case "api" -> List.of(
                    draft(titleCase(domain) + " Service API", "I built Spring Boot endpoints for " + domain + " with validation, pagination, PostgreSQL persistence, and controller/service separation."),
                    draft(titleCase(domain) + " Import Endpoint", "I created a smaller API for accepting updates from " + audience + ", returning useful validation messages instead of vague server errors."),
                    draft(titleCase(domain) + " Backend Review Pack", "I wrote endpoint examples, test notes, and schema screenshots so another developer can review how the API behaves.")
            );
            case "auth" -> List.of(
                    draft(titleCase(domain) + " Access Flow", "I implemented login, protected routes, and role checks for " + domain + " so " + audience + " only see the screens they are allowed to use."),
                    draft(titleCase(domain) + " Permission Review", "I built an admin view for checking access changes, failed sign-ins, and account status without exposing sensitive details."),
                    draft(titleCase(domain) + " Auth Edge Case Notes", "I documented password reset, expired session, and unauthorized request states with screenshots and plain-English tradeoffs.")
            );
            case "data" -> List.of(
                    draft(titleCase(domain) + " Data Quality " + noun, "I built a Python checker that catches missing fields, duplicate rows, inconsistent categories, and suspicious values in " + domain + " uploads."),
                    draft(titleCase(domain) + " Cleanup Report", "I created SQL-backed summaries that show which records need manual review and which are safe to import."),
                    draft(titleCase(domain) + " Validation Evidence Pack", "I added sample files, before/after outputs, and notes explaining how I " + habit + " while changing the cleanup rules.")
            );
            case "deploy" -> List.of(
                    draft(titleCase(domain) + " Deployment Kit", "I containerized a small app for " + domain + " with Docker, environment variables, seed data checks, and a basic health endpoint."),
                    draft(titleCase(domain) + " Release Checklist", "I wrote a deployment checklist for " + audience + " covering config, logs, database readiness, and rollback notes."),
                    draft(titleCase(domain) + " Local Setup Walkthrough", "I documented the steps another junior developer would need to run the project, verify services, and diagnose common startup failures.")
            );
            case "rails" -> List.of(
                    draft(titleCase(domain) + " Account Workflow", "I built a Rails CRUD flow for " + domain + " where requests move through review, approval, and status history screens."),
                    draft(titleCase(domain) + " Staff Admin Screens", "I created admin screens for " + audience + " with search, validation, simple authorization checks, and readable database relationships."),
                    draft(titleCase(domain) + " Rails Proof Notes", "I added screenshots, model notes, and small RSpec examples showing how I " + habit + " while shaping the workflow.")
            );
            case "testing" -> List.of(
                    draft(titleCase(domain) + " Regression Checklist", "I built a compact test suite and bug reproduction notes for " + domain + " flows that had repeated validation issues."),
                    draft(titleCase(domain) + " QA Scenario Board", "I created test scenarios for happy paths, empty states, failed API requests, and awkward user input from " + audience + "."),
                    draft(titleCase(domain) + " Fix Verification Notes", "I documented what was broken, how I reproduced it, and which checks proved the fix worked.")
            );
            case "docs" -> List.of(
                    draft(titleCase(domain) + " API Sandbox", "I built a small documentation sandbox with request examples, auth notes, and realistic responses for " + domain + " API calls."),
                    draft(titleCase(domain) + " Onboarding Examples", "I created JavaScript snippets and Postman examples that help " + audience + " understand the API without reading the whole backend."),
                    draft(titleCase(domain) + " Docs Review Pack", "I added screenshots, glossary notes, and a quickstart checklist focused on how I " + habit + ".")
            );
            case "cloud" -> List.of(
                    draft(titleCase(domain) + " Cost Dashboard", "I built a Python and SQL reporting view that groups cloud spend, flags unusual usage, and explains cost changes for " + audience + "."),
                    draft(titleCase(domain) + " Usage Forecast", "I created a lightweight forecast report with CSV inputs, trend notes, and dashboard filters for reviewing upcoming spend."),
                    draft(titleCase(domain) + " FinOps Evidence Notes", "I documented assumptions, sample data, and screenshots so the project reads as practical cost-control proof.")
            );
            default -> List.of(
                    draft(titleCase(domain) + " Triage " + noun, "I built a support workflow tool for " + domain + " with queue states, owner assignment, and clear next actions."),
                    draft(titleCase(domain) + " Escalation Notes", "I created a smaller internal tool for " + audience + " to track blocked requests, comments, and resolution history."),
                    draft(titleCase(domain) + " Support Tool Proof Pack", "I added screenshots, state diagrams, and review notes showing how I " + habit + " while improving the workflow.")
            );
        };
    }

    private ProjectDraft draft(String name, String description) {
        return new ProjectDraft(name, description);
    }

    private String domainFor(int index) {
        return List.of(
                "community health", "local retail", "bootcamp admissions", "charity operations", "clinic scheduling",
                "freelance invoicing", "library services", "housing repairs", "student mentoring", "event staffing",
                "micro-SaaS billing", "customer onboarding", "warehouse returns", "legal intake", "fitness coaching",
                "restaurant stock", "job placement", "energy usage", "membership renewals", "travel bookings"
        ).get((index * 7 + index / 10) % 20);
    }

    private String habitFor(int index) {
        return List.of(
                "turn vague requirements into a narrow first version",
                "write down edge cases before polishing the UI",
                "trace data from form input to stored records",
                "make errors understandable for non-technical users",
                "separate nice-to-have polish from must-fix behavior",
                "compare screenshots before and after each change",
                "ask what a reviewer would need to trust the code",
                "keep setup steps repeatable on a clean machine",
                "use sample data that exposes awkward cases",
                "explain tradeoffs without pretending the project is bigger than it is"
        ).get((index * 3 + index / 10) % 10);
    }

    private String proofStyleFor(int index) {
        return List.of(
                "small end-to-end builds", "README decision logs", "before-and-after screenshots", "careful validation examples",
                "API request notes", "database relationship diagrams", "manual QA checklists", "deployment runbooks",
                "component breakdowns", "sample-data walkthroughs"
        ).get((index * 5 + index / 10) % 10);
    }

    private String availabilityFor(int index) {
        return List.of(
                "Open to junior roles", "Available for internships", "Open to contract-to-hire", "Looking for apprenticeship-style teams",
                "Open to part-time project work", "Ready for junior product engineering roles"
        ).get(index % 6);
    }

    private String remotePreferenceFor(int index) {
        return List.of("Remote first", "Remote or hybrid", "Hybrid preferred", "UK/EU remote hours", "Flexible with office days").get(index % 5);
    }

    private List<String> rotate(List<String> values, int offset) {
        List<String> rotated = new ArrayList<>();
        for (int index = 0; index < values.size(); index += 1) {
            rotated.add(values.get((index + offset) % values.size()));
        }
        return rotated;
    }

    private String slugify(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private String roleLabelFor(ProfileTheme theme) {
        return switch (theme.slug()) {
            case "dashboard" -> "React dashboard developer";
            case "api" -> "Spring Boot API developer";
            case "auth" -> "authentication developer";
            case "data" -> "data quality developer";
            case "deploy" -> "DevOps-minded developer";
            case "rails" -> "Ruby workflow developer";
            case "testing" -> "testing and QA developer";
            case "docs" -> "developer experience developer";
            case "cloud" -> "cloud cost tools developer";
            default -> "support tools developer";
        };
    }

    private String titleFocusFor(ProfileTheme theme) {
        return switch (theme.slug()) {
            case "dashboard" -> "React";
            case "api" -> "Backend";
            case "auth" -> "Auth";
            case "data" -> "Data";
            case "deploy" -> "DevOps";
            case "rails" -> "Rails";
            case "testing" -> "QA";
            case "docs" -> "API Docs";
            case "cloud" -> "Cloud Tools";
            default -> "Internal Tools";
        };
    }

    private String summaryFocusFor(ProfileTheme theme) {
        return switch (theme.slug()) {
            case "dashboard" -> "React";
            case "api" -> "backend";
            case "auth" -> "auth";
            case "data" -> "data";
            case "deploy" -> "DevOps";
            case "rails" -> "Rails";
            case "testing" -> "QA";
            case "docs" -> "API docs";
            case "cloud" -> "cloud tools";
            default -> "internal tools";
        };
    }

    private String titleCase(String value) {
        String[] words = value.split(" ");
        List<String> titleWords = new ArrayList<>();
        for (String word : words) {
            titleWords.add(word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1));
        }
        return String.join(" ", titleWords);
    }

    private String twoDigit(int value) {
        return value < 10 ? "0" + value : String.valueOf(value);
    }

    private String writeJson(Object value, String fallback) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            return fallback;
        }
    }

    private record ProfileTheme(
            String title,
            List<String> skills,
            List<String> adjacentSkills,
            String slug,
            String primaryProject,
            String secondaryProject,
            String evidenceFocus
    ) {
        String problemArea() {
            return switch (slug) {
                case "dashboard" -> "React dashboards and API-driven reporting";
                case "api" -> "Spring Boot APIs and backend validation";
                case "auth" -> "authentication, protected routes, and permissions";
                case "data" -> "CSV validation, data cleanup, and SQL workflows";
                case "deploy" -> "Docker deployment and environment readiness";
                case "rails" -> "Rails-style account workflows and CRUD tools";
                case "testing" -> "testing, validation, and bug reproduction";
                case "docs" -> "API documentation and developer experience";
                case "cloud" -> "cloud cost reporting and data dashboards";
                default -> "support tooling and internal workflow screens";
            };
        }
    }

    private record ProjectDraft(
            String name,
            String description
    ) {
    }

    private record SeedProfile(
            String name,
            String slug,
            String email,
            String fallbackEmail,
            String title,
            String summary,
            String image,
            List<String> skills,
            String availability,
            List<String> workTypes,
            String remotePreference,
            List<ProfileProjectResponse> projects,
            List<ProfilePostResponse> posts,
            int displayOrder
    ) {
    }
}
