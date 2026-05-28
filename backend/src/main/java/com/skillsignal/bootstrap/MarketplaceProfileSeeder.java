package com.skillsignal.bootstrap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.marketplace.dto.DeveloperPreferencesResponse;
import com.skillsignal.marketplace.dto.ProfileContactLinksResponse;
import com.skillsignal.marketplace.dto.ProfilePostResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import com.skillsignal.marketplace.model.ProfileType;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class MarketplaceProfileSeeder implements CommandLineRunner {
    private final MarketplaceProfileRepository profileRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public MarketplaceProfileSeeder(MarketplaceProfileRepository profileRepository, JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.profileRepository = profileRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) {
        ensureProfileVisibilityColumns();

        if (profileRepository.count() > 0) {
            profileRepository.findAll().stream()
                    .filter(profile -> profile.getUserId() == null)
                    .filter(profile -> !profile.isDisplayed())
                    .forEach(profile -> {
                        profile.setDisplayed(true);
                        profileRepository.save(profile);
            });
            supplementJojoDevProfile();
            supplementStockEmployerProfiles();
            return;
        }

        profileRepository.saveAll(List.of(
                developer("Maya Patel", "Junior Backend Developer", "Built an API dashboard with PostgreSQL reporting and JWT auth.", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80", List.of("Python", "SQL", "Spring Boot", "REST APIs"), true, 1),
                developer("Daniel Okafor", "Full-stack Developer", "Shipped protected React routes backed by Spring Security endpoints.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80", List.of("React", "Spring Boot", "PostgreSQL", "Docker"), true, 2),
                developer("Sofia Nguyen", "Data-focused Developer", "Created analytics screens that turn API data into employer-ready proof.", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80", List.of("Python", "SQL", "Dashboards", "APIs"), true, 3),
                developer("Ethan Brooks", "Junior Rails Developer", "Deployed a Ruby app with user accounts, database models, and admin tools.", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80", List.of("Ruby", "SQL", "Authentication", "Deployment"), true, 4),
                employer("Northstar Analytics", "Hiring need", "Junior developer for SQL dashboards and Python API work.", "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=80", List.of("Python", "SQL", "APIs"), true, 5),
                employer("BrightLayer Software", "Hiring need", "React developer who can build protected routes and admin screens.", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80", List.of("React", "Authentication", "Dashboards"), true, 6),
                employer("Harbour Cloud", "Hiring need", "Spring Boot project help with JWT authentication and PostgreSQL.", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80", List.of("Spring Boot", "PostgreSQL", "JWT"), true, 7),
                employer("RailsDesk", "Hiring need", "Ruby developer for account flows, database models, and deployment.", "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&q=80", List.of("Ruby", "SQL", "Deployment"), true, 8),
                developer("Aisha Morgan", "Junior Python Developer", "Built Flask APIs, test suites, and SQL reports for a volunteer management tool.", "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80", List.of("Python", "Flask", "SQL", "Testing"), false, 9),
                developer("Leo Hernandez", "React Frontend Developer", "Created responsive dashboards with reusable React components and API-driven charts.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80", List.of("React", "JavaScript", "Dashboards", "REST APIs"), false, 10),
                developer("Priya Shah", "Spring Boot Developer", "Implemented role-based endpoints, JWT login, and PostgreSQL schema migrations.", "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80", List.of("Spring Boot", "JWT", "PostgreSQL", "Security"), false, 11),
                developer("Noah Williams", "Junior DevOps Developer", "Containerized apps with Docker and deployed full-stack projects to cloud environments.", "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=240&q=80", List.of("Docker", "Deployment", "Linux", "CI/CD"), false, 12),
                developer("Chloe Martin", "API Integration Developer", "Connected third-party APIs, handled error states, and built clear frontend data flows.", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80", List.of("APIs", "React", "Node.js", "Error Handling"), false, 13),
                developer("Samir Khan", "Database-focused Developer", "Designed normalized schemas, wrote SQL queries, and built admin reporting views.", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80", List.of("SQL", "PostgreSQL", "Schema Design", "Dashboards"), false, 14),
                developer("Grace Taylor", "Junior Java Developer", "Built Java services with validation, layered controllers, and integration tests.", "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=240&q=80", List.of("Java", "Spring Boot", "Testing", "REST APIs"), false, 15),
                developer("Owen Clarke", "Ruby Developer", "Created Rails account flows, CRUD screens, and deployment-ready database models.", "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=240&q=80", List.of("Ruby", "Rails", "SQL", "Authentication"), false, 16),
                developer("Imani Lewis", "Frontend Accessibility Developer", "Built accessible React forms, keyboard-friendly navigation, and polished validation states.", "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=240&q=80", List.of("React", "Accessibility", "Forms", "CSS"), false, 17),
                developer("Tom Evans", "Junior Full-stack Developer", "Built a project tracker with React, Spring Boot APIs, and PostgreSQL persistence.", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80", List.of("React", "Spring Boot", "PostgreSQL", "CRUD"), false, 18),
                developer("Nina Rossi", "Data Visualization Developer", "Turned CSV and API data into charts, filters, and interactive dashboard views.", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80", List.of("Python", "Dashboards", "Data Visualization", "APIs"), false, 19),
                developer("Marcus Green", "Authentication-focused Developer", "Implemented login, route protection, password hashing, and JWT-backed API access.", "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=240&q=80", List.of("Authentication", "JWT", "Spring Security", "React"), false, 20),
                developer("Hannah Wright", "Junior QA-minded Developer", "Added unit tests, validation flows, and bug reproduction notes to full-stack projects.", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=240&q=80", List.of("Testing", "JavaScript", "Validation", "APIs"), false, 21),
                developer("Kai Bennett", "Cloud-ready Developer", "Prepared applications for deployment with environment config, Docker, and database setup.", "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=240&q=80", List.of("Deployment", "Docker", "PostgreSQL", "Environment Config"), false, 22)
        ));
        supplementJojoDevProfile();
        supplementStockEmployerProfiles();
    }

    private MarketplaceProfile developer(
            String name,
            String title,
            String summary,
            String image,
            List<String> skills,
            boolean featured,
            int displayOrder
    ) {
        return new MarketplaceProfile(ProfileType.DEVELOPER, name, title, summary, image, skills, featured, displayOrder);
    }

    private MarketplaceProfile employer(
            String name,
            String title,
            String summary,
            String image,
            List<String> skills,
            boolean featured,
            int displayOrder
    ) {
        return new MarketplaceProfile(ProfileType.EMPLOYER, name, title, summary, image, skills, featured, displayOrder);
    }

    private void ensureProfileVisibilityColumns() {
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists displayed boolean not null default true");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists user_id bigint");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists projects_json text not null default '[]'");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists posts_json text not null default '[]'");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists contact_links_json text default '{}'");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists preferences_json text default '{}'");
        jdbcTemplate.execute("alter table marketplace_profiles alter column image type text");
        jdbcTemplate.execute("create unique index if not exists idx_marketplace_profiles_user_id on marketplace_profiles(user_id) where user_id is not null");
    }

    private void supplementJojoDevProfile() {
        profileRepository.findAll().stream()
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .filter(profile -> isJojoDevProfile(profile.getName()))
                .forEach(profile -> {
                    profile.setTitle("Junior Ruby and Python developer building practical workflow tools");
                    profile.setSummary("I am jojodev, a junior backend-leaning developer focused on Ruby, Python, SQL, and practical workflow tools. I like building Rails-style CRUD apps, Python automation scripts, CSV/data cleanup utilities, and small APIs that help people import, validate, organize, and act on information without wrestling with messy spreadsheets. My strongest project work shows readable backend code, clear database relationships, useful validation, and short notes explaining what I built, why I made each technical choice, and how the tool could help a real team.");
                    profile.setSkills(List.of("Ruby", "Rails", "Python", "SQL", "PostgreSQL", "Flask", "Data cleanup"));
                    profile.setContactLinksJson(writeContactLinks(new ProfileContactLinksResponse(
                            "https://www.linkedin.com/in/jojodev",
                            "https://github.com/jojodev",
                            "jojodev@example.com",
                            "https://github.com/jojodev/SkillSignal"
                    )));
                    profile.setPreferencesJson(writePreferences(new DeveloperPreferencesResponse(
                            "Open to junior full-stack roles",
                            List.of("Backend", "APIs", "Internal tools", "Data cleanup", "Admin workflows"),
                            "Remote, hybrid, or UK-based"
                    )));

                    List<ProfileProjectResponse> existingProjects = readProjects(profile.getProjectsJson());
                    List<ProfileProjectResponse> sampleProjects = jojoDevPortfolioProjects().stream()
                            .filter(sampleProject -> existingProjects.stream().noneMatch(existingProject -> sameProject(existingProject, sampleProject)))
                            .toList();
                    List<ProfilePostResponse> existingPosts = readPosts(profile.getPostsJson());
                    List<ProfilePostResponse> samplePosts = jojoDevFeedPosts().stream()
                            .filter(samplePost -> existingPosts.stream().noneMatch(existingPost -> samePost(existingPost, samplePost)))
                            .toList();
                    if (!sampleProjects.isEmpty()) {
                        profile.setProjectsJson(writeProjects(
                                java.util.stream.Stream.concat(existingProjects.stream(), sampleProjects.stream()).toList()
                        ));
                    }
                    if (!samplePosts.isEmpty()) {
                        profile.setPostsJson(writePosts(
                                java.util.stream.Stream.concat(existingPosts.stream(), samplePosts.stream()).toList()
                        ));
                    }
                    profileRepository.save(profile);
                });
    }

    private void supplementStockEmployerProfiles() {
        profileRepository.findAll().stream()
                .filter(profile -> profile.getType() == ProfileType.EMPLOYER)
                .filter(profile -> profile.getUserId() == null)
                .forEach(profile -> {
                    EmployerSeed employerSeed = employerSeedFor(profile.getName());
                    if (employerSeed == null) {
                        return;
                    }

                    List<ProfileProjectResponse> existingNeeds = readProjects(profile.getProjectsJson());
                    List<ProfileProjectResponse> newNeeds = employerSeed.needs().stream()
                            .filter(need -> existingNeeds.stream().noneMatch(existingNeed -> sameProject(existingNeed, need)))
                            .toList();
                    List<ProfilePostResponse> existingPosts = readPosts(profile.getPostsJson());
                    List<ProfilePostResponse> newPosts = employerSeed.posts().stream()
                            .filter(post -> existingPosts.stream().noneMatch(existingPost -> samePost(existingPost, post)))
                            .toList();

                    profile.setTitle(employerSeed.title());
                    profile.setSummary(employerSeed.summary());
                    profile.setSkills(employerSeed.skills());
                    if (!newNeeds.isEmpty()) {
                        profile.setProjectsJson(writeProjects(
                                java.util.stream.Stream.concat(existingNeeds.stream(), newNeeds.stream()).toList()
                        ));
                    }
                    if (!newPosts.isEmpty()) {
                        profile.setPostsJson(writePosts(
                                java.util.stream.Stream.concat(existingPosts.stream(), newPosts.stream()).toList()
                        ));
                    }
                    profileRepository.save(profile);
                });
    }

    private EmployerSeed employerSeedFor(String name) {
        return switch (normalizeProjectName(name)) {
            case "northstar analytics" -> new EmployerSeed(
                    "Analytics team hiring junior data product help",
                    "Northstar Analytics builds reporting tools for small operations teams. We are looking for a junior developer who can turn messy business data into clear SQL-backed dashboards, lightweight Python API endpoints, and practical views that non-technical managers can trust.",
                    List.of("Python", "SQL", "APIs", "Dashboards", "Data cleanup"),
                    List.of(
                            hiringNeed(
                                    "Customer Retention Dashboard",
                                    "We need a junior developer to build a dashboard that shows customer churn risk, recent account activity, and simple retention trends. The work involves writing SQL queries, shaping API responses in Python, and presenting the results in readable charts and tables for account managers.",
                                    List.of("Python", "SQL", "REST APIs", "Dashboards", "Data Visualization"),
                                    true
                            ),
                            hiringNeed(
                                    "CSV Import Quality Check",
                                    "A recurring client upload process needs validation screens that flag missing fields, duplicate rows, and suspicious values before data reaches production reports. This is a good fit for someone who can write careful validation logic and explain edge cases.",
                                    List.of("Python", "SQL", "Validation", "Data cleanup"),
                                    false
                            )
                    ),
                    List.of(
                            post("northstar-feed-dashboard", "Actively looking for a junior developer who can combine SQL fundamentals with clean dashboard UI. Project proof with charts, filters, or API-backed tables would be ideal.", "2026-05-26T08:45:00.000Z"),
                            post("northstar-feed-data-cleanup", "Current pain point: client data arrives in inconsistent CSV formats. We need someone who can build validation checks and make errors easy for non-technical users to understand.", "2026-05-24T14:20:00.000Z")
                    )
            );
            case "brightlayer software" -> new EmployerSeed(
                    "Product team hiring React dashboard support",
                    "BrightLayer Software builds internal tools for service businesses. We are looking for a junior React developer who can build protected routes, admin screens, form workflows, and clear error states while working from existing API contracts.",
                    List.of("React", "Authentication", "Dashboards", "Forms", "REST APIs"),
                    List.of(
                            hiringNeed(
                                    "Admin Access Control Screens",
                                    "We need a junior developer to create React screens for inviting users, assigning roles, and protecting admin-only routes. The work should include form validation, loading states, failed-request handling, and clear UI feedback for permission changes.",
                                    List.of("React", "Authentication", "Protected Routes", "Forms", "API Error States"),
                                    true
                            ),
                            hiringNeed(
                                    "Operations Dashboard Polish",
                                    "Our dashboard needs better empty states, filter controls, and reusable card components so managers can scan open tasks faster. This would suit someone with strong component habits and attention to UI details.",
                                    List.of("React", "Dashboards", "Component Design", "CSS"),
                                    false
                            )
                    ),
                    List.of(
                            post("brightlayer-feed-react", "Looking for React project proof: protected routes, admin screens, forms, or dashboard components. Screenshots and GitHub links matter more than years of experience.", "2026-05-26T10:05:00.000Z"),
                            post("brightlayer-feed-auth", "Upcoming work is focused on role-based UI. A junior dev who can reason through permissions and explain edge cases would be very useful.", "2026-05-23T16:10:00.000Z")
                    )
            );
            case "harbour cloud" -> new EmployerSeed(
                    "Cloud platform team hiring Spring Boot support",
                    "Harbour Cloud supports small SaaS teams with backend platform work. We are looking for a junior developer who can help with Spring Boot APIs, JWT authentication, PostgreSQL persistence, and practical backend documentation.",
                    List.of("Spring Boot", "PostgreSQL", "JWT", "REST APIs", "Backend documentation"),
                    List.of(
                            hiringNeed(
                                    "JWT Authentication Cleanup",
                                    "We need a junior developer to improve a Spring Boot authentication flow by tightening validation, documenting protected endpoints, and making login/register errors clearer for the frontend team.",
                                    List.of("Spring Boot", "JWT", "Spring Security", "REST APIs", "Validation"),
                                    true
                            ),
                            hiringNeed(
                                    "PostgreSQL Audit Trail API",
                                    "A client admin panel needs an audit trail for important account changes. The task includes designing a small PostgreSQL table, exposing read-only endpoints, and returning results with sensible pagination.",
                                    List.of("Spring Boot", "PostgreSQL", "API Design", "Pagination"),
                                    false
                            )
                    ),
                    List.of(
                            post("harbour-feed-jwt", "Hiring focus this week: Spring Boot JWT auth, PostgreSQL, and clean controller/service structure. We like candidates who can explain why an endpoint should be protected.", "2026-05-25T09:35:00.000Z"),
                            post("harbour-feed-docs", "A strong junior applicant would show backend proof with README notes, endpoint examples, and screenshots from Postman or a connected frontend.", "2026-05-22T13:15:00.000Z")
                    )
            );
            case "railsdesk" -> new EmployerSeed(
                    "Rails team hiring account workflow support",
                    "RailsDesk builds account-management tools for growing support teams. We are looking for a junior Ruby/Rails developer who can work on user account flows, database-backed CRUD screens, and deployment-ready fixes.",
                    List.of("Ruby", "Rails", "SQL", "Authentication", "Deployment"),
                    List.of(
                            hiringNeed(
                                    "Customer Account Request Flow",
                                    "We need a junior Rails developer to build a request workflow where customers can update account details, staff can review changes, and admins can approve or reject updates with clear status history.",
                                    List.of("Ruby", "Rails", "SQL", "CRUD", "Authentication"),
                                    true
                            ),
                            hiringNeed(
                                    "Deployment Health Checklist",
                                    "Our small Rails app needs environment setup documentation, seed data checks, and a simple health page so support staff know whether the app is ready after deployment.",
                                    List.of("Ruby", "Deployment", "Environment Config", "Documentation"),
                                    false
                            )
                    ),
                    List.of(
                            post("railsdesk-feed-account-flow", "Looking for Rails proof around account flows, CRUD models, authentication, or deployment. A tidy GitHub README would make a junior candidate stand out.", "2026-05-26T11:25:00.000Z"),
                            post("railsdesk-feed-sql", "Current need: someone comfortable enough with SQL relationships to model customer requests, approvals, and status history without overcomplicating it.", "2026-05-24T10:50:00.000Z")
                    )
            );
            default -> null;
        };
    }

    private ProfileProjectResponse hiringNeed(String name, String description, List<String> skills, boolean featured) {
        return new ProfileProjectResponse(name, description, "", "", skills, List.of(), featured);
    }

    private ProfilePostResponse post(String id, String body, String createdAt) {
        return new ProfilePostResponse(id, body, createdAt);
    }

    private boolean isJojoDevProfile(String name) {
        String normalizedName = name == null ? "" : name.toLowerCase();
        return normalizedName.equals("jojodev");
    }

    private List<ProfileProjectResponse> jojoDevPortfolioProjects() {
        return List.of(
                new ProfileProjectResponse(
                        "Rails Client Tracker",
                        "Built a small Rails-style client tracker for logging customer requests, updating statuses, and keeping account notes searchable. Focused on clean CRUD flows, simple SQL relationships, validation, and admin screens that make support work easier to follow.",
                        "https://github.com/jojodev/rails-client-tracker",
                        "",
                        List.of("Ruby", "Rails", "SQL", "CRUD", "Validation"),
                        List.of("https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"),
                        true
                ),
                new ProfileProjectResponse(
                        "Python CSV Quality Checker",
                        "Created a Python tool that checks messy CSV uploads for missing fields, duplicate rows, invalid email formats, and inconsistent categories before the data reaches a database or report.",
                        "https://github.com/jojodev/csv-quality-checker",
                        "",
                        List.of("Python", "Data cleanup", "Validation", "CSV", "Automation"),
                        List.of("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80"),
                        true
                ),
                new ProfileProjectResponse(
                        "Flask Skill Notes API",
                        "Designed a lightweight Flask API for saving learning notes by topic, tagging them by skill, and returning filtered results for a simple frontend. Included predictable JSON responses and basic error handling.",
                        "https://github.com/jojodev/flask-skill-notes-api",
                        "",
                        List.of("Python", "Flask", "REST APIs", "JSON", "SQLite"),
                        List.of("https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80"),
                        false
                ),
                new ProfileProjectResponse(
                        "Ruby Task Importer",
                        "Built a Ruby script that imports tasks from a spreadsheet-style export, normalizes labels, groups records by owner, and produces a clean summary report for a small operations workflow.",
                        "https://github.com/jojodev/ruby-task-importer",
                        "",
                        List.of("Ruby", "Automation", "CSV", "Reporting", "CLI"),
                        List.of("https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80"),
                        false
                )
        );
    }

    private List<ProfilePostResponse> jojoDevFeedPosts() {
        return List.of(
                post("jojodev-feed-rails-tracker", "Working on a Rails client tracker this week: request statuses, account notes, and a cleaner way for support teams to see what changed recently.", "2026-05-27T17:25:00.000Z"),
                post("jojodev-feed-python-csv", "Improved my Python CSV checker so it catches duplicate rows and missing required fields before data gets imported into reports.", "2026-05-26T14:10:00.000Z"),
                post("jojodev-feed-flask-api", "Practising small Flask APIs with predictable JSON responses, simple filtering, and better error messages for bad request data.", "2026-05-25T11:45:00.000Z")
        );
    }

    private boolean sameProject(ProfileProjectResponse firstProject, ProfileProjectResponse secondProject) {
        return normalizeProjectName(firstProject.name()).equals(normalizeProjectName(secondProject.name()));
    }

    private boolean samePost(ProfilePostResponse firstPost, ProfilePostResponse secondPost) {
        return normalizeProjectName(firstPost.id()).equals(normalizeProjectName(secondPost.id()));
    }

    private String normalizeProjectName(String name) {
        return name == null ? "" : name.trim().toLowerCase();
    }

    private List<ProfileProjectResponse> readProjects(String projectsJson) {
        if (projectsJson == null || projectsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(projectsJson, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String writeProjects(List<ProfileProjectResponse> projects) {
        try {
            return objectMapper.writeValueAsString(projects);
        } catch (JsonProcessingException exception) {
            return "[]";
        }
    }

    private List<ProfilePostResponse> readPosts(String postsJson) {
        if (postsJson == null || postsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(postsJson, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String writePosts(List<ProfilePostResponse> posts) {
        try {
            return objectMapper.writeValueAsString(posts);
        } catch (JsonProcessingException exception) {
            return "[]";
        }
    }

    private String writeContactLinks(ProfileContactLinksResponse contactLinks) {
        try {
            return objectMapper.writeValueAsString(contactLinks);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }

    private String writePreferences(DeveloperPreferencesResponse preferences) {
        try {
            return objectMapper.writeValueAsString(preferences);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }

    private record EmployerSeed(
            String title,
            String summary,
            List<String> skills,
            List<ProfileProjectResponse> needs,
            List<ProfilePostResponse> posts
    ) {
    }
}
