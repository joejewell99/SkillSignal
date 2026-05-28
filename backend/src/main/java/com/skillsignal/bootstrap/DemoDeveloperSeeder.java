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
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.user.model.AppUser;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
                    .orElseGet(() -> userRepository.save(new AppUser(
                            seed.name(),
                            seed.email(),
                            passwordEncoder.encode(PASSWORD),
                            Role.DEVELOPER
                    )));

            MarketplaceProfile profile = profileRepository.findByUserId(user.getId())
                    .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(user.getId(), seed.name())));

            profile.setTitle(seed.title());
            profile.setSummary(seed.summary());
            profile.setImage(seed.image());
            profile.setSkills(seed.skills());
            profile.setContactLinksJson(writeJson(new ProfileContactLinksResponse(
                    "https://www.linkedin.com/in/" + seed.slug(),
                    "https://github.com/" + seed.slug(),
                    seed.email(),
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

        seedConnections(seededProfiles);
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
        String[] firstNames = {
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
                new ProfileTheme("React Dashboard Developer", List.of("React", "Dashboards", "REST APIs", "CSS", "API Error States"), "dashboard", "React dashboard", "frontend data screens", "API-driven UI"),
                new ProfileTheme("Spring Boot API Developer", List.of("Java", "Spring Boot", "REST APIs", "PostgreSQL", "Testing"), "api", "Spring Boot API", "backend endpoints", "service validation"),
                new ProfileTheme("Authentication Developer", List.of("Spring Security", "JWT", "Authentication", "React", "PostgreSQL"), "auth", "JWT authentication", "protected routes", "role-based access"),
                new ProfileTheme("Data Quality Developer", List.of("Python", "SQL", "CSV", "Data cleanup", "Validation"), "data", "CSV quality checker", "messy data workflow", "validation rules"),
                new ProfileTheme("DevOps-minded Developer", List.of("Docker", "Deployment", "Linux", "Environment Config", "CI/CD"), "deploy", "Docker deployment", "health checks", "environment setup"),
                new ProfileTheme("Ruby Workflow Developer", List.of("Ruby", "Rails", "SQL", "CRUD", "Authentication"), "rails", "Rails account workflow", "admin CRUD screens", "status history"),
                new ProfileTheme("Testing and QA Developer", List.of("Testing", "JavaScript", "Validation", "Bug Reports", "APIs"), "testing", "regression test suite", "bug reproduction flow", "quality checks"),
                new ProfileTheme("Developer Experience Developer", List.of("API Documentation", "Sandbox", "REST APIs", "Authentication", "JavaScript"), "docs", "API documentation sandbox", "developer examples", "auth docs"),
                new ProfileTheme("Cloud Cost Tools Developer", List.of("Python", "SQL", "Dashboards", "Cloud", "Reporting"), "cloud", "cloud cost dashboard", "usage reports", "cost insights"),
                new ProfileTheme("Support Tools Developer", List.of("React", "Node.js", "SQL", "Internal Tools", "Workflow States"), "support", "support triage tool", "ticket workflow", "internal tooling")
        );

        List<SeedProfile> seeds = new ArrayList<>();
        for (int index = 0; index < 100; index += 1) {
            ProfileTheme theme = themes.get(index % themes.size());
            String name = firstNames[index] + " " + lastNames[index];
            String slug = firstNames[index].toLowerCase(Locale.ROOT);
            String email = slug + "@gmail.com";
            String image = portraitUrl(index);
            boolean featured = index % 4 == 0;
            List<ProfileProjectResponse> projects = projectsFor(theme, slug, featured);
            List<ProfilePostResponse> posts = postsFor(theme, slug, index);
            seeds.add(new SeedProfile(
                    name,
                    slug,
                    email,
                    theme.title(),
                    summaryFor(name, theme),
                    image,
                    theme.skills(),
                    index % 2 == 0 ? "Open to junior roles" : "Available for internships and contract-to-hire",
                    workTypesFor(theme),
                    index % 3 == 0 ? "Remote first" : index % 3 == 1 ? "Remote or hybrid" : "Hybrid preferred",
                    projects,
                    posts
            ));
        }
        return seeds;
    }

    private List<ProfileProjectResponse> projectsFor(ProfileTheme theme, String slug, boolean featured) {
        return List.of(
                new ProfileProjectResponse(
                        titleCase(theme.primaryProject()),
                        "Built a " + theme.primaryProject() + " focused on " + theme.problemArea() + ". The project includes clear data flow, validation, practical UI states, and notes explaining the tradeoffs behind the implementation.",
                        "https://github.com/" + slug + "/" + theme.slug() + "-proof",
                        "https://" + slug + "-" + theme.slug() + ".netlify.app",
                        theme.skills().subList(0, Math.min(4, theme.skills().size())),
                        List.of(projectImage(theme.slug(), 0)),
                        featured
                ),
                new ProfileProjectResponse(
                        titleCase(theme.secondaryProject()),
                        "Created a smaller supporting project around " + theme.secondaryProject() + " to practise edge cases, error handling, and explaining technical decisions in plain English.",
                        "https://github.com/" + slug + "/" + theme.slug() + "-notes",
                        "",
                        theme.skills().stream().skip(1).limit(4).toList(),
                        List.of(projectImage(theme.slug(), 1)),
                        !featured && theme.slug().length() % 2 == 0
                ),
                new ProfileProjectResponse(
                        titleCase(theme.evidenceFocus()),
                        "Documented " + theme.evidenceFocus() + " with screenshots, README notes, and a short checklist showing how the work could help a real product team review junior-level proof.",
                        "https://github.com/" + slug + "/" + theme.slug() + "-evidence",
                        "",
                        theme.skills().stream().limit(3).toList(),
                        List.of(projectImage(theme.slug(), 2)),
                        false
                )
        );
    }

    private List<ProfilePostResponse> postsFor(ProfileTheme theme, String slug, int index) {
        return List.of(
                new ProfilePostResponse(slug + "-feed-1", "Finished a project pass on " + theme.primaryProject() + " and added notes about the main technical decisions.", "2026-05-" + twoDigit(10 + (index % 18)) + "T09:30:00.000Z"),
                new ProfilePostResponse(slug + "-feed-2", "Practising " + String.join(", ", theme.skills().stream().limit(3).toList()) + " with a focus on explaining project evidence clearly.", "2026-05-" + twoDigit(8 + (index % 18)) + "T14:15:00.000Z"),
                new ProfilePostResponse(slug + "-feed-3", "Updated screenshots and README notes so employers can quickly see what the project proves.", "2026-05-" + twoDigit(6 + (index % 18)) + "T17:05:00.000Z")
        );
    }

    private String summaryFor(String name, ProfileTheme theme) {
        return name + " is a junior developer focused on " + theme.problemArea() + " work. Their profile shows practical project proof around "
                + String.join(", ", theme.skills().stream().limit(4).toList())
                + ", with readable notes, screenshots, and code links. They are strongest when the task needs someone who can learn quickly, explain decisions clearly, and turn a real product problem into a small working improvement.";
    }

    private List<String> workTypesFor(ProfileTheme theme) {
        return switch (theme.slug()) {
            case "dashboard", "cloud" -> List.of("Dashboards", "Reporting", "Data workflows");
            case "api", "auth", "docs" -> List.of("Backend APIs", "Documentation", "Security-adjacent work");
            case "data" -> List.of("Data cleanup", "Validation", "Automation");
            case "deploy" -> List.of("Deployment", "DevOps support", "Environment setup");
            case "rails", "support" -> List.of("Internal tools", "CRUD workflows", "Admin screens");
            default -> List.of("Testing", "Bug fixing", "Quality checks");
        };
    }

    private String portraitUrl(int index) {
        String genderPath = index % 2 == 0 ? "women" : "men";
        int portraitId = 1 + (index % 90);
        return "https://randomuser.me/api/portraits/" + genderPath + "/" + portraitId + ".jpg";
    }

    private String projectImage(String themeSlug, int offset) {
        String query = switch (themeSlug) {
            case "dashboard", "cloud" -> "dashboard,analytics";
            case "api", "auth", "docs" -> "code,software";
            case "data" -> "data,spreadsheet";
            case "deploy" -> "server,cloud";
            case "rails", "support" -> "workflow,office";
            default -> "testing,software";
        };
        return "https://source.unsplash.com/900x560/?" + query + "&sig=" + themeSlug + offset;
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

    private record SeedProfile(
            String name,
            String slug,
            String email,
            String title,
            String summary,
            String image,
            List<String> skills,
            String availability,
            List<String> workTypes,
            String remotePreference,
            List<ProfileProjectResponse> projects,
            List<ProfilePostResponse> posts
    ) {
    }
}
