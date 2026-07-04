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
                    "https://" + seed.slug() + ".dev/portfolio"
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
                        projectRepoUrl(slug, drafts.get(0).name()),
                        projectLiveUrl(slug, theme.slug(), drafts.get(0).name()),
                        projectSkills(skills, 0, 5),
                        projectImages(theme.slug(), domain, drafts.get(0).name(), index, 0, 3),
                        featured
                ),
                new ProfileProjectResponse(
                        drafts.get(1).name(),
                        drafts.get(1).description(),
                        projectRepoUrl(slug, drafts.get(1).name()),
                        index % 3 == 0 ? "" : projectLiveUrl(slug, theme.slug(), drafts.get(1).name()),
                        projectSkills(skills, 1, 4),
                        projectImages(theme.slug(), domain, drafts.get(1).name(), index, 1, 3),
                        !featured && theme.slug().length() % 2 == 0
                ),
                new ProfileProjectResponse(
                        drafts.get(2).name(),
                        drafts.get(2).description(),
                        projectRepoUrl(slug, drafts.get(2).name()),
                        "",
                        projectSkills(skills, 2, 4),
                        projectImages(theme.slug(), domain, drafts.get(2).name(), index, 2, 2),
                        false
                ),
                new ProfileProjectResponse(
                        drafts.get(3).name(),
                        drafts.get(3).description(),
                        projectRepoUrl(slug, drafts.get(3).name()),
                        "",
                        projectSkills(skills, 3, 4),
                        projectImages(theme.slug(), domain, drafts.get(3).name(), index, 3, 2),
                        false
                )
        );
    }

    private List<ProfilePostResponse> postsFor(ProfileTheme theme, String slug, int index, String domain, String habit, List<ProfileProjectResponse> projects) {
        String reviewFocus = reviewFocusFor(index);
        String learningFocus = rotate(theme.skills(), (index + index / 10) % theme.skills().size()).stream().limit(2).reduce((first, second) -> first + " and " + second).orElse(theme.title());
        String blocker = blockerFor(index);
        String proofDetail = proofDetailFor(theme, index);
        String audience = audienceFor(index);
        String strengthAngle = strengthAngleFor(theme, index);
        String growthEdge = growthEdgeFor(theme, index);
        String employerFit = employerFitFor(theme, index);
        return List.of(
                new ProfilePostResponse(slug + "-feed-1", "Shipped a cleaner version of " + projects.get(0).name() + ". The main change was the " + reviewFocus + "; it now gives " + audience + " a clearer next step instead of just showing another screen. This is the kind of work where I usually feel strongest: " + strengthAngle + ".", "2026-05-" + twoDigit(10 + (index % 18)) + "T09:30:00.000Z"),
                new ProfilePostResponse(slug + "-feed-2", "The awkward part of " + projects.get(1).name() + " was " + blocker + ". I wrote the tradeoff into the README so someone reviewing the repo can see what I tried before the final approach instead of assuming the first version was obvious.", "2026-05-" + twoDigit(8 + (index % 18)) + "T14:15:00.000Z"),
                new ProfilePostResponse(slug + "-feed-3", "Added screenshots and sample data for " + projects.get(2).name() + ". I want the proof to stand on its own: " + proofDetail + ", not just a nice project title. The employer fit I am trying to signal is simple: " + employerFit + ".", "2026-05-" + twoDigit(6 + (index % 18)) + "T17:05:00.000Z"),
                new ProfilePostResponse(slug + "-feed-4", "Practising " + learningFocus + " this week by comparing the first build with the refactor notes. The habit I am trying to keep is simple: " + habit + ". The thing I still want to get sharper at is " + growthEdge + ".", "2026-04-" + twoDigit(18 + (index % 10)) + "T11:20:00.000Z"),
                new ProfilePostResponse(slug + "-feed-5", "Small portfolio note: " + projects.get(3).name() + " is intentionally narrow. It is there to show one judgement call clearly, especially around " + reviewFocus + ", rather than pretending to be a full production product.", "2026-04-" + twoDigit(8 + (index % 12)) + "T16:45:00.000Z")
        );
    }

    private String summaryFor(String name, ProfileTheme theme, String domain, String habit, String proofStyle, List<String> skills, int index) {
        String skillList = naturalList(skills.stream().limit(3).toList());
        String topSkill = skills.get(0);
        String goal = learningGoalFor(theme, index);
        String teamFit = teamFitFor(index);
        String blocker = blockerFor(index);
        String strengthAngle = strengthAngleFor(theme, index);
        String growthEdge = growthEdgeFor(theme, index);
        String employerFit = employerFitFor(theme, index);
        String collaborationStyle = collaborationStyleFor(index);
        String problemArea = theme.problemArea().toLowerCase(Locale.ROOT);
        return switch (index % 12) {
            case 0 -> "Hi, I'm " + name + ". I build " + problemArea + " for " + domain + " workflows, and I usually do my best work when there is a messy real-life process to untangle. I use " + skillList + " a lot, but the thing I care about most is making the workflow feel clearer for the person using it. I am especially good at " + strengthAngle + ". I still want to get sharper at " + growthEdge + ", and I think I fit best with " + employerFit + ".";
            case 1 -> "I'm a junior " + summaryFocusFor(theme) + " developer who prefers practical product problems over generic tutorial projects. Most of the work on my profile starts with a small " + domain + " problem and then turns into something I can actually run, test, and explain. I like leaving " + proofStyle + " behind because it makes code review easier. Right now I'm trying to improve at " + goal + ".";
            case 2 -> "A lot of my recent work sits around " + problemArea + ". I like building things that have a clear user, a clear pain point, and enough depth to show how I think once the easy version stops working. The part of the work that suits me most is " + strengthAngle + ". I work well with teams that value " + collaborationStyle + ".";
            case 3 -> "Most of my projects come from ordinary workflow problems in " + domain + ", not from trying to make something look bigger than it is. I like the unglamorous parts of product work too, especially " + blocker + ". I think that is often where junior developers can show real judgment. The kind of employer I would probably help most is " + employerFit + ".";
            case 4 -> "I like turning " + domain + " problems into software that feels calmer and easier to trust. My projects use " + skillList + ", but the more useful signal is how I " + habit + ". I am looking for a team where " + teamFit.toLowerCase(Locale.ROOT) + " matters and where I can keep getting better through honest review.";
            case 5 -> "Right now I'm focused on " + problemArea + ". I usually start small, get one useful version working, and then tighten the parts that would confuse a real user or teammate. The thing I am naturally strongest at is " + strengthAngle + ". The thing I still want to improve is " + growthEdge + ".";
            case 6 -> "I'm early in my career, but I care a lot about making my work easy to inspect. That usually means code links, screenshots, short notes, and projects that solve a specific problem in " + domain + " rather than a vague idea. I use " + topSkill + " a lot in that work, and I am especially trying to improve at " + goal + ".";
            case 7 -> "I build " + domain + " tools with " + skillList + ", and I try to keep them understandable from the outside as well as in the code. I care about handoff, failure states, and the little product details that make software feel thought through. My working style is mostly " + collaborationStyle + ".";
            case 8 -> "The work I enjoy most is " + problemArea + " with a real operational angle behind it. I like projects where I can " + habit + " and still keep the code simple enough for someone else to pick up. I am stronger on " + strengthAngle + " than on flashy presentation, and I'm okay being honest about that.";
            case 9 -> "I'm aiming for junior roles where I can contribute to real " + domain + " software and learn from people who care about the details. I use " + skillList + " across my projects, but the better signal is probably how I talk through tradeoffs like " + blocker + ". I'd rather sound specific than polished.";
            case 10 -> "I enjoy the kind of work where a team does not need a huge platform, just a clearer way of handling " + domain + " problems. That is why a lot of my projects are narrow, practical, and a bit opinionated about what matters. The best thing I can usually bring early is " + strengthAngle + ".";
            default -> "I build practical " + summaryFocusFor(theme) + " projects, mostly around " + domain + ", and I try to make the reasoning visible as well as the final result. I care about " + teamFit.toLowerCase(Locale.ROOT) + ", and I like work where I can be useful by improving one real workflow at a time. I am stronger on " + strengthAngle + " than on " + growthEdge + " right now, but that's also the part I'm actively working on.";
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

    private String audienceFor(int index) {
        return List.of(
                "coordinators", "support leads", "hiring reviewers", "clinic admins", "course mentors",
                "finance assistants", "operations teams", "volunteer managers", "shop owners", "customer success reps",
                "case workers", "founder-led teams", "junior analysts", "booking staff", "community organisers",
                "warehouse supervisors", "student advisors", "field managers", "membership admins", "implementation specialists"
        ).get((index * 3 + index / 10) % 20);
    }

    private String reviewFocusFor(int index) {
        return List.of(
                "empty-state copy", "edge-case handling", "README screenshots", "seed data", "permission checks",
                "slow-query notes", "form validation", "deployment checklist", "keyboard navigation", "audit trail",
                "mobile layout", "error recovery", "manual QA notes", "API examples", "role handoff", "data import preview"
        ).get((index + index / 10) % 16);
    }

    private String blockerFor(int index) {
        return List.of(
                "making stale data obvious without alarming the user",
                "separating admin-only actions from everyday user actions",
                "turning vague validation rules into messages a non-technical person could act on",
                "keeping the happy path simple while still documenting the failure path",
                "designing sample data that exposed the awkward cases instead of hiding them",
                "deciding which logic belonged in the service layer rather than the UI",
                "showing enough proof in screenshots for a reviewer who does not clone the repo",
                "keeping setup reproducible across a clean machine and an existing dev environment",
                "making the second version smaller and clearer than the first",
                "explaining why a tempting feature was left out of scope"
        ).get((index * 7 + index / 10) % 10);
    }

    private String proofDetailFor(ProfileTheme theme, int index) {
        return switch (theme.slug()) {
            case "dashboard" -> List.of("filter behaviour, chart states, and API-shaped sample responses", "responsive dashboard screenshots and before-and-after component notes", "table sorting, empty states, and data freshness warnings").get(index % 3);
            case "api" -> List.of("request examples, validation failures, and PostgreSQL-backed responses", "controller/service boundaries with test notes and schema screenshots", "pagination behaviour, import errors, and OpenAPI-style examples").get(index % 3);
            case "auth" -> List.of("login edge cases, protected routes, and role-specific UI states", "session expiry, failed sign-ins, and admin permission review screens", "JWT flow notes, account status changes, and safer fallback states").get(index % 3);
            case "data" -> List.of("messy CSV examples, cleanup reports, and before/after outputs", "SQL checks, rejected rows, and import rules written in plain English", "data quality screenshots that show what changed and why").get(index % 3);
            case "deploy" -> List.of("Docker setup, health checks, logs, and environment recovery notes", "release checklist evidence with config and rollback steps", "local setup screenshots plus common failure diagnostics").get(index % 3);
            case "rails" -> List.of("model relationships, CRUD state changes, and admin review screens", "small RSpec examples, status history, and queue workflow screenshots", "Rails controller notes, validation behaviour, and staff-facing UI states").get(index % 3);
            case "testing" -> List.of("bug reproduction notes, regression checks, and risk-based QA scenarios", "Playwright-style flows, failed API states, and manual verification notes", "test data choices that expose validation and recovery paths").get(index % 3);
            case "docs" -> List.of("request examples, auth docs, and a runnable API sandbox", "developer onboarding snippets, glossary notes, and realistic responses", "quickstart screenshots that reduce the first-run confusion").get(index % 3);
            case "cloud" -> List.of("cost grouping, anomaly notes, and billing-data assumptions", "forecast screenshots, SQL summaries, and spend explanation cards", "FinOps evidence that separates rough estimates from measured data").get(index % 3);
            default -> List.of("queue states, owner assignment, and escalation history", "blocked-request notes, permissions, and support workflow screenshots", "workflow simplification evidence with before-and-after states").get(index % 3);
        };
    }

    private String motivationFor(int index) {
        return List.of(
                "a small team should be able to judge my work without guessing what I actually built",
                "I want the proof to survive a proper technical conversation",
                "the useful part of junior work is often how clearly you handle the unglamorous details",
                "I learn fastest when feedback is tied to something concrete",
                "a portfolio should help an employer ask better follow-up questions"
        ).get(index % 5);
    }

    private String strengthAngleFor(ProfileTheme theme, int index) {
        return switch (theme.slug()) {
            case "dashboard" -> List.of("turning cluttered metrics into calmer dashboard decisions", "breaking a busy UI into reusable reporting pieces", "making data-heavy screens feel readable instead of impressive").get(index % 3);
            case "api" -> List.of("keeping backend behaviour predictable under awkward inputs", "translating business rules into simpler service boundaries", "writing APIs that are easier for a frontend developer to trust").get(index % 3);
            case "auth" -> List.of("thinking carefully about who should see what and when", "catching awkward account states that make auth demos feel fake", "making permission changes understandable for non-security specialists").get(index % 3);
            case "data" -> List.of("turning messy imports into something another person can act on", "writing validation rules that are strict without being cryptic", "making cleanup logic reviewable instead of mysterious").get(index % 3);
            case "deploy" -> List.of("making setup repeatable for the next developer", "staying calm around environment failures and broken startup paths", "turning deployment notes into practical team insurance").get(index % 3);
            case "rails" -> List.of("keeping CRUD workflows readable even when the states multiply", "naming models and actions so the workflow stays understandable", "building admin flows that feel practical rather than over-built").get(index % 3);
            case "testing" -> List.of("making bugs reproducible instead of hand-wavy", "choosing the checks that actually reduce product risk", "documenting what a fix proved and what it did not").get(index % 3);
            case "docs" -> List.of("making a backend easier for the next developer to use", "turning hidden assumptions into onboarding material", "writing examples that answer the question a teammate actually has").get(index % 3);
            case "cloud" -> List.of("explaining cost movement in plain terms", "making cloud data useful to an operator instead of just decorative", "showing where the spend story comes from rather than just charting it").get(index % 3);
            default -> List.of("clarifying ownership in messy internal workflows", "making support tools easier to scan under pressure", "reducing handoff confusion between people doing operational work").get(index % 3);
        };
    }

    private String growthEdgeFor(ProfileTheme theme, int index) {
        return switch (theme.slug()) {
            case "dashboard" -> List.of("visual polish when the state logic is already correct", "accessibility edge cases in denser reporting screens", "knowing when to stop refining a UI interaction").get(index % 3);
            case "api" -> List.of("broader test depth once the service shape is stable", "knowing when a service deserves more abstraction", "expressing backend constraints more clearly for other developers").get(index % 3);
            case "auth" -> List.of("hardening flows beyond the first realistic product version", "testing more obscure permission paths without overcomplicating the project", "balancing safety with product simplicity").get(index % 3);
            case "data" -> List.of("handling larger-scale data assumptions", "building more confidence around ambiguous edge rules", "turning validation findings into even cleaner user feedback").get(index % 3);
            case "deploy" -> List.of("wider CI/CD depth beyond the practical basics", "building more confidence around production-like rollback decisions", "knowing which operational checks matter most under time pressure").get(index % 3);
            case "rails" -> List.of("deeper Rails test coverage once the workflow stabilises", "knowing when to split a workflow before the model grows too much", "speed on an older Rails codebase I did not start").get(index % 3);
            case "testing" -> List.of("automating the right checks without losing judgment", "staying lightweight when the temptation is to over-test", "connecting bug proof more directly to product decisions").get(index % 3);
            case "docs" -> List.of("covering more complex flows without losing clarity", "keeping documentation concise when the API surface grows", "anticipating the next developer question before they ask it").get(index % 3);
            case "cloud" -> List.of("forecasting with more confidence when the data gets noisy", "going deeper on infrastructure context behind spend changes", "drawing the line between useful reporting and over-claiming insight").get(index % 3);
            default -> List.of("choosing which workflow detail deserves the next round of attention", "keeping internal tools simple when there are many stakeholder requests", "moving a rough operational tool toward stronger product quality").get(index % 3);
        };
    }

    private String employerFitFor(ProfileTheme theme, int index) {
        return switch (theme.slug()) {
            case "dashboard" -> List.of("a product team that needs someone to make reporting calmer and more legible", "an ops-heavy team where dashboard clarity matters more than flashy UI", "a small SaaS team with real admin or reporting friction").get(index % 3);
            case "api" -> List.of("a backend team that needs a careful junior on validation-heavy API work", "a product team that wants safer endpoints and clearer request behaviour", "an engineering team that values readable services over cleverness").get(index % 3);
            case "auth" -> List.of("a team with real permissions or admin-access pain", "a product with account flows that need a careful second pair of hands", "an employer who wants a junior who treats auth as product behaviour, not just a login screen").get(index % 3);
            case "data" -> List.of("an employer with messy operational data and not enough patience to keep fixing it by hand", "a team that needs someone practical around imports, validation, and reporting", "a small company where data quality problems keep leaking into daily work").get(index % 3);
            case "deploy" -> List.of("a team that wants setup and deployment to feel less fragile", "an employer where developer environment friction is costing real time", "a product team that needs someone reliable on practical infrastructure chores").get(index % 3);
            case "rails" -> List.of("a company with account workflows, admin tooling, or status-heavy CRUD work", "a Rails team that needs a junior who can keep workflows understandable", "a team where boring but important backend product work matters").get(index % 3);
            case "testing" -> List.of("a team tired of repeated validation bugs and vague fixes", "an employer who values careful verification and product reliability", "a product team where bug proof matters more than swagger").get(index % 3);
            case "docs" -> List.of("an API or platform team that wants onboarding to be less painful", "a company where developer experience is dragging down delivery speed", "an employer who needs someone to explain technical behaviour clearly").get(index % 3);
            case "cloud" -> List.of("a team that needs cloud reporting to drive decisions instead of just decorate a dashboard", "an employer with cost visibility problems but not a full FinOps department", "a company that wants someone practical around usage, reporting, and spend clarity").get(index % 3);
            default -> List.of("a team with operational confusion and too many manual handoffs", "an employer that needs internal tools to become clearer, not bigger", "a support-heavy product where state and ownership keep getting muddled").get(index % 3);
        };
    }

    private String collaborationStyleFor(int index) {
        return List.of(
                "clear review comments and tidy handoff notes",
                "small, steady iteration with visible reasoning",
                "asking useful product questions before polishing the wrong thing",
                "working quietly through ambiguity until the workflow becomes obvious",
                "taking feedback seriously without becoming defensive"
        ).get(index % 5);
    }

    private String dataSourceFor(int index) {
        return List.of(
                "a seeded CSV export", "mock support tickets", "a small PostgreSQL dataset", "hand-written user stories",
                "public-style billing rows", "a spreadsheet from a volunteer workflow", "sample booking records",
                "a fixture set with broken rows", "notes from a pretend stakeholder interview", "a small JSON API"
        ).get((index * 11 + index / 10) % 10);
    }

    private String projectConstraintFor(int index) {
        return List.of(
                "I limited the scope to the smallest version that still proved the workflow.",
                "I wrote down what I deliberately left out so the tradeoff is visible.",
                "I rebuilt the awkward state twice because the first version was too clever.",
                "I used screenshots and seed data to make the edge cases easy to inspect.",
                "I kept the implementation boring on purpose so the behaviour is easier to review."
        ).get((index * 5 + index / 10) % 5);
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
        return projectImage(themeSlug, "", "", index, offset);
    }

    private String projectImage(String themeSlug, String domain, String projectName, int index, int offset) {
        String query = switch (themeSlug) {
            case "dashboard", "cloud" -> "dashboard,analytics";
            case "api", "auth", "docs" -> "code,software";
            case "data" -> "data,spreadsheet";
            case "deploy" -> "server,cloud";
            case "rails", "support" -> "workflow,office";
            default -> "testing,software";
        };
        String domainQuery = queryPart(domain);
        String projectQuery = queryPart(projectName);
        String fullQuery = String.join(",", List.of(query, domainQuery, projectQuery)).replaceAll(",+", ",").replaceAll("^,|,$", "");
        return "https://source.unsplash.com/900x560/?" + fullQuery + "&sig=" + themeSlug + "-" + index + "-" + offset;
    }

    private List<String> projectImages(String themeSlug, int index, int offset, int count) {
        return projectImages(themeSlug, "", "", index, offset, count);
    }

    private List<String> projectImages(String themeSlug, String domain, String projectName, int index, int offset, int count) {
        List<String> images = new ArrayList<>();
        for (int imageIndex = 0; imageIndex < count; imageIndex += 1) {
            images.add(projectImage(themeSlug, domain, projectName, index, offset * 10 + imageIndex));
        }
        return images;
    }

    private List<String> projectSkills(List<String> skills, int offset, int limit) {
        return rotate(skills, offset).stream().limit(limit).toList();
    }

    private String projectRepoUrl(String slug, String projectName) {
        return "https://github.com/" + slug + "/" + projectSlug(projectName);
    }

    private String projectLiveUrl(String slug, String themeSlug, String projectName) {
        return "https://" + slug + "-" + themeSlug + "-" + projectSlug(projectName).replace("-", "").substring(0, Math.min(14, projectSlug(projectName).replace("-", "").length())) + ".vercel.app";
    }

    private String projectSlug(String value) {
        return slugify(value).replaceAll("(^-|-$)", "");
    }

    private String queryPart(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", ",").replaceAll("^,|,$", "");
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
        String audience = audienceFor(index);
        String reviewFocus = reviewFocusFor(index);
        String blocker = blockerFor(index);
        String proofDetail = proofDetailFor(theme, index);
        String dataSource = dataSourceFor(index);
        String constraint = projectConstraintFor(index);
        return switch (theme.slug()) {
            case "dashboard" -> List.of(
                    draft(titleCase(domain) + " Metrics " + noun, "A React dashboard for " + audience + " using " + dataSource + " to show trend cards, filterable charts, loading states, and empty-state guidance. " + constraint + " The useful evidence is " + proofDetail + ", plus notes on how I handled " + blocker + "."),
                    draft(titleCase(domain) + " Activity Queue", "A queue-style review screen for triaging stale records, follow-up notes, and recent changes without opening every item. I focused on " + reviewFocus + ", row-level status cues, and API failure states so the screen feels like part of a real product workflow."),
                    draft(titleCase(domain) + " Weekly Reporting Digest", "A smaller reporting app that turns the same workflow into a weekly summary view with trend comparisons, flagged changes, and exportable notes for " + audience + ". I built it to show I can shape the same data into a different product surface."),
                    draft(titleCase(domain) + " Filter State Playground", "A focused React project around one awkward filter flow that kept becoming confusing during testing. I simplified the state model, documented the removed behaviour, and kept the repo narrow so the judgment call is easy to inspect.")
            );
            case "api" -> List.of(
                    draft(titleCase(domain) + " Service API", "A Spring Boot API for " + domain + " with validation, pagination, PostgreSQL persistence, and controller/service separation. " + constraint + " The README includes request examples, rejected payloads, and the database assumptions behind " + proofDetail + "."),
                    draft(titleCase(domain) + " Import Intake API", "A separate API for accepting updates from " + audience + " while returning specific validation messages instead of vague server errors. The project is strongest around " + blocker + " because the code traces the request from payload to stored record."),
                    draft(titleCase(domain) + " Audit Timeline Service", "A backend service for exposing status history, actor notes, and simple filtering around workflow changes. I made this one because history and traceability often matter just as much as the main create and update endpoints."),
                    draft(titleCase(domain) + " Notification Rules API", "A smaller project that decides when to trigger reminders, warnings, or follow-up flags based on stored records. It gave me a chance to work through business rules without hiding them inside the main service.")
            );
            case "auth" -> List.of(
                    draft(titleCase(domain) + " Access Flow", "A login and protected-route flow for " + domain + " where " + audience + " only see the screens their role allows. " + constraint + " The project includes screenshots for failed sign-in, expired sessions, redirects, and " + proofDetail + "."),
                    draft(titleCase(domain) + " Invite And Approval Portal", "An admin-facing flow for inviting users, approving access, and changing roles without making the screens feel hostile or confusing. It shows the product side of auth, not just the middleware side."),
                    draft(titleCase(domain) + " Password Recovery Journey", "A separate password reset and account recovery project with token expiry, validation errors, and user-facing messaging. I built it because recovery flows are usually where trust gets lost."),
                    draft(titleCase(domain) + " Session Audit Panel", "A compact tool for reviewing failed sign-ins, revoked access, and odd account states. It gave me a place to think through awkward auth behaviour that does not show up in a perfect demo.")
            );
            case "data" -> List.of(
                    draft(titleCase(domain) + " Data Quality " + noun, "A Python checker for " + domain + " uploads that catches missing fields, duplicate rows, inconsistent categories, and suspicious values. It uses " + dataSource + " and includes before/after outputs so a reviewer can inspect " + proofDetail + "."),
                    draft(titleCase(domain) + " Cleanup Review Console", "SQL-backed summaries showing which records need manual review and which are safe to import. The project is written around " + audience + " making a decision from imperfect data, with notes on " + blocker + "."),
                    draft(titleCase(domain) + " Category Normaliser", "A small utility focused on one messy part of import work: reconciling inconsistent labels, aliases, and date formats before they leak into reports. I like this one because it is narrow but very real."),
                    draft(titleCase(domain) + " Import Exception Inbox", "A review tool for rejected rows with plain-English reasons, quick filters, and a simple recheck flow. It stands on its own from the validator and feels more like something an operations team would actually use.")
            );
            case "deploy" -> List.of(
                    draft(titleCase(domain) + " Deployment Kit", "A containerized app for " + domain + " with Docker, environment variables, seed checks, and a basic health endpoint. " + constraint + " The proof shows local setup, service readiness, and how I diagnosed " + blocker + "."),
                    draft(titleCase(domain) + " Service Health Monitor", "A small monitoring view for checking container health, seed status, and basic app readiness. I built it because a lot of deployment pain is really about not knowing what is broken first."),
                    draft(titleCase(domain) + " Env Diff Checker", "A utility for comparing required environment values across local, staging, and teammate setups. It is a practical project, but it shows how I think about avoiding repeat failures."),
                    draft(titleCase(domain) + " Backup Restore Drill", "A recovery-focused repo around seed data resets, database snapshots, and smoke checks after restore. I wanted one project that proves I can think past the happy-path deployment.")
            );
            case "rails" -> List.of(
                    draft(titleCase(domain) + " Account Workflow", "A Rails CRUD flow for " + domain + " where requests move through review, approval, and status history screens. " + constraint + " The proof includes model notes, screenshots, and a clear explanation of the relationships behind " + proofDetail + "."),
                    draft(titleCase(domain) + " Staff Admin Screens", "Admin screens for " + audience + " with search, validation, simple authorization checks, and readable database relationships. The workflow has multiple states and roles, which makes it stronger evidence than a plain CRUD example."),
                    draft(titleCase(domain) + " Follow-up Request Queue", "A separate workflow for chasing missing information, logging staff notes, and tracking whether a request is ready to move again. I wanted something that felt like real admin work rather than just CRUD."),
                    draft(titleCase(domain) + " Status History Explorer", "A smaller Rails project for browsing state changes over time, filtering by account, and checking who changed what. It is useful proof because it lives adjacent to the main workflow without being the same app again.")
            );
            case "testing" -> List.of(
                    draft(titleCase(domain) + " Regression Checklist", "A compact regression suite and bug-reproduction notebook for " + domain + " flows with repeated validation issues. " + constraint + " The useful proof is risk selection: what I automated, what I checked manually, and how I handled " + blocker + "."),
                    draft(titleCase(domain) + " QA Scenario Board", "Test scenarios for happy paths, empty states, failed API requests, and awkward input from " + audience + ". The project is evidence of prioritisation, not just raw test count, because every scenario explains the product risk."),
                    draft(titleCase(domain) + " Bug Replay Harness", "A tiny app for recreating reported bugs against seeded data and stepping through whether the fix actually changed the failure. I like this one because it feels close to real team maintenance work."),
                    draft(titleCase(domain) + " API Failure Lab", "A focused project for bad payloads, timeout behaviour, stale UI state, and conflicting API responses. It makes the testing work feel concrete rather than just claiming I care about quality.")
            );
            case "docs" -> List.of(
                    draft(titleCase(domain) + " API Sandbox", "A documentation sandbox with request examples, auth notes, and realistic responses for " + domain + " API calls. " + constraint + " The goal is to make the first fifteen minutes with the API smoother for another developer."),
                    draft(titleCase(domain) + " Onboarding Examples", "JavaScript snippets and Postman-style examples that help " + audience + " understand the API without reading the whole backend. The evidence is inspectable because the examples show real responses and failure cases."),
                    draft(titleCase(domain) + " Error Guide", "A standalone guide for failed requests, auth issues, and common integration mistakes. I made it because good docs are often really about helping someone recover, not just helping them start."),
                    draft(titleCase(domain) + " Quickstart Rewrite", "A tighter quickstart flow for a confusing setup path, usually around auth or local environment config. It shows whether I can turn technical behaviour into something another developer would actually follow.")
            );
            case "cloud" -> List.of(
                    draft(titleCase(domain) + " Cost Dashboard", "A Python and SQL reporting view that groups cloud spend, flags unusual usage, and explains cost changes for " + audience + ". It uses " + dataSource + " and annotated screenshots so the reviewer can inspect " + proofDetail + "."),
                    draft(titleCase(domain) + " Usage Forecast", "A lightweight forecast report with CSV inputs, trend notes, and dashboard filters for reviewing upcoming spend. The useful part is not fancy modelling; it is framing cost movement clearly enough for someone to act on it."),
                    draft(titleCase(domain) + " Tag Coverage Report", "A reporting tool for missing labels, unclear owners, and spend that cannot be explained cleanly yet. I like it because it deals with the quality of the cost data, not just the chart on top of it."),
                    draft(titleCase(domain) + " Spend Anomaly Drilldown", "A focused drilldown around one unexpected cost spike and the steps used to investigate it. That makes the cloud work feel operational rather than like a generic chart exercise.")
            );
            default -> List.of(
                    draft(titleCase(domain) + " Triage " + noun, "A support workflow tool for " + domain + " with queue states, owner assignment, comments, and clear next actions. " + constraint + " The strongest evidence is how it clarifies who should act next when a request is blocked."),
                    draft(titleCase(domain) + " Escalation Inbox", "An internal tool for " + audience + " to track blocked requests, comments, and resolution history. It covers the messy handoff states, not just the happy path, so the workflow evidence feels more believable."),
                    draft(titleCase(domain) + " SLA Watchboard", "A smaller screen for overdue tasks, priority changes, and requests that are stuck between teams. It is a separate workflow, but still part of the same operational world."),
                    draft(titleCase(domain) + " Handoff Timeline", "A timeline-style project that shows who touched a case, what changed, and where responsibility moved next. I like this one because it solves a different problem from triage while staying practical.")
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
