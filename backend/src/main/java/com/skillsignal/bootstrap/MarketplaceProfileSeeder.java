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
import org.springframework.core.annotation.Order;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(10)
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
            markStockProfilesAsDemo();
            supplementStockDeveloperProfiles();
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
        supplementStockDeveloperProfiles();
        supplementJojoDevProfile();
        supplementStockEmployerProfiles();
    }

    private void markStockProfilesAsDemo() {
        profileRepository.findAll().stream()
                .filter(profile -> profile.getUserId() == null)
                .forEach(profile -> {
                    profile.setDemoProfile(true);
                    profileRepository.save(profile);
                });
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
        MarketplaceProfile profile = new MarketplaceProfile(ProfileType.DEVELOPER, name, title, summary, image, skills, featured, displayOrder);
        profile.setDemoProfile(true);
        return profile;
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
        MarketplaceProfile profile = new MarketplaceProfile(ProfileType.EMPLOYER, name, title, summary, image, skills, featured, displayOrder);
        profile.setDemoProfile(true);
        return profile;
    }

    private void ensureProfileVisibilityColumns() {
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists displayed boolean not null default true");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists user_id bigint");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists projects_json text not null default '[]'");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists posts_json text not null default '[]'");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists contact_links_json text default '{}'");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists preferences_json text default '{}'");
        jdbcTemplate.execute("alter table marketplace_profiles add column if not exists demo_profile boolean not null default false");
        jdbcTemplate.execute("alter table marketplace_profiles alter column summary type text");
        jdbcTemplate.execute("alter table marketplace_profiles alter column image type text");
        jdbcTemplate.execute("alter table marketplace_profiles alter column projects_json type text");
        jdbcTemplate.execute("alter table marketplace_profiles alter column posts_json type text");
        jdbcTemplate.execute("alter table marketplace_profiles alter column contact_links_json type text");
        jdbcTemplate.execute("alter table marketplace_profiles alter column preferences_json type text");
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

    private void supplementStockDeveloperProfiles() {
        profileRepository.findAll().stream()
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .filter(profile -> profile.getUserId() == null)
                .filter(profile -> profile.getDisplayOrder() < 100)
                .forEach(profile -> {
                    DeveloperStockSeed seed = developerStockSeedFor(profile);
                    profile.setTitle(seed.title());
                    profile.setSummary(seed.summary());
                    profile.setSkills(seed.skills());
                    profile.setContactLinksJson(writeContactLinks(seed.contactLinks()));
                    profile.setPreferencesJson(writePreferences(seed.preferences()));
                    profile.setProjectsJson(writeProjects(seed.projects()));
                    profile.setPostsJson(writePosts(seed.posts()));
                    profile.setDemoProfile(true);
                    profileRepository.save(profile);
                });
    }

    private DeveloperStockSeed developerStockSeedFor(MarketplaceProfile profile) {
        String name = profile.getName();
        int index = Math.max(0, profile.getDisplayOrder() - 1);
        List<String> skills = profile.getSkills() == null || profile.getSkills().isEmpty()
                ? List.of("JavaScript", "SQL", "GitHub", "Documentation")
                : profile.getSkills();
        String slug = slugify(name);
        String domain = List.of(
                "community clinics", "subscription billing", "student mentoring", "warehouse returns", "charity operations",
                "local retail", "support triage", "housing repairs", "course admissions", "membership renewals",
                "freelance invoicing", "restaurant stock", "job placement", "travel bookings", "energy usage",
                "customer onboarding", "legal intake", "fitness coaching"
        ).get(index % 18);
        String audience = List.of(
                "ops coordinators", "support leads", "course mentors", "shop owners", "volunteer managers",
                "finance assistants", "clinic admins", "customer success reps", "warehouse supervisors", "community organisers"
        ).get(index % 10);
        String focus = stockFocusFor(skills);
        String evidence = stockEvidenceFor(skills, index);
        String edge = stockGrowthEdgeFor(skills, index);
        String fit = stockEmployerFitFor(skills, index);
        String style = stockWorkingStyleFor(index);
        String title = profile.getTitle().contains("Junior") || profile.getTitle().contains("Developer")
                ? profile.getTitle()
                : "Junior " + focus + " Developer";
        String summary = "Hi, I'm " + name + ". I'm a junior developer mostly focused on " + focus.toLowerCase() + " work, and I like projects that start from a real " + domain + " problem instead of a generic app idea. The strongest side of my work is usually " + evidence + ". I'm still getting better at " + edge + ", but I think I do good work when I can make a workflow clearer, keep the proof easy to inspect, and leave useful notes for the next person. I probably fit best with " + fit + ", especially teams that value " + style + ".";

        List<ProfileProjectResponse> projects = stockDeveloperProjects(name, slug, domain, audience, focus, evidence, skills, index);
        List<ProfilePostResponse> posts = stockDeveloperPosts(slug, projects, domain, audience, evidence, edge, fit, index);
        return new DeveloperStockSeed(
                title,
                summary,
                skills,
                new ProfileContactLinksResponse(
                        "https://www.linkedin.com/in/" + slug,
                        "https://github.com/" + slug,
                        "hello@" + slug + ".dev",
                        "https://" + slug + ".dev/portfolio"
                ),
                new DeveloperPreferencesResponse(
                        List.of("Open to junior roles", "Available for internships", "Open to contract-to-hire", "Looking for apprenticeship-style teams").get(index % 4),
                        List.of(focus, "Internal tools", domain, "Project proof"),
                        List.of("Remote first", "Remote or hybrid", "Hybrid preferred", "UK/EU remote hours").get(index % 4)
                ),
                projects,
                posts
        );
    }

    private List<ProfileProjectResponse> stockDeveloperProjects(String name, String slug, String domain, String audience, String focus, String evidence, List<String> skills, int index) {
        String domainTitle = titleCase(domain);
        String repoBase = "https://github.com/" + slug + "/";
        String liveBase = "https://" + slug + "-";
        return List.of(
                new ProfileProjectResponse(
                        domainTitle + " " + focus + " Hub",
                        "A main project for " + audience + " working in " + domain + ". I used " + naturalList(skills.stream().limit(3).toList()) + " to turn a vague workflow into something with realistic data, visible edge cases, and a README that explains the bigger decisions. The strongest evidence is " + evidence + ".",
                        repoBase + slugify(domain + "-" + focus + "-build"),
                        liveBase + slugify(focus) + ".vercel.app",
                        skills.stream().limit(Math.min(5, skills.size())).toList(),
                        stockImages(focus, domain, index, 0, 3),
                        true
                ),
                new ProfileProjectResponse(
                        domainTitle + " Review Queue",
                        "A separate workflow project focused on the parts users notice when software feels unfinished: validation, empty states, permissions, loading behaviour, and handoff notes. It stands on its own, but it still lives in the same real-world problem space.",
                        repoBase + slugify(domain + "-workflow-review"),
                        index % 2 == 0 ? liveBase + slugify(domain) + "-workflow.netlify.app" : "",
                        rotate(skills, 1).stream().limit(Math.min(4, skills.size())).toList(),
                        stockImages(focus, domain, index, 1, 2),
                        false
                ),
                new ProfileProjectResponse(
                        domainTitle + " Admin Workspace",
                        "A smaller admin-facing tool for the same domain, usually built around review states, ownership changes, or staff actions that need clearer structure. I like this one because it feels closer to day-to-day product work than a generic showcase.",
                        repoBase + slugify(domain + "-evidence-pack"),
                        "",
                        rotate(skills, 2).stream().limit(Math.min(4, skills.size())).toList(),
                        stockImages(focus, domain, index, 2, 2),
                        false
                ),
                new ProfileProjectResponse(
                        domainTitle + " Edge Case Lab",
                        "A narrower project around one awkward part of the workflow, usually a permission path, confusing filter, bad import, or state transition that deserved more attention on its own. I use projects like this to show how I think once the easy version stops being enough.",
                        repoBase + slugify(domain + "-refactor-notes"),
                        "",
                        rotate(skills, 3).stream().limit(Math.min(4, skills.size())).toList(),
                        stockImages(focus, domain, index, 3, 2),
                        false
                )
        );
    }

    private List<ProfilePostResponse> stockDeveloperPosts(String slug, List<ProfileProjectResponse> projects, String domain, String audience, String evidence, String edge, String fit, int index) {
        return List.of(
                post(slug + "-stock-feed-1", "Finished another pass on " + projects.get(0).name() + ". The main improvement was making the workflow clearer for " + audience + " instead of adding more features. This is usually where I am most useful.", "2026-05-" + twoDigit(10 + (index % 16)) + "T09:20:00.000Z"),
                post(slug + "-stock-feed-2", "Built out " + projects.get(2).name() + " as a separate project because the staff side of the workflow needed different thinking from the user-facing flow.", "2026-05-" + twoDigit(8 + (index % 16)) + "T14:05:00.000Z"),
                post(slug + "-stock-feed-3", "The hardest part of this " + domain + " work was deciding what to leave out. I documented the tradeoff in the README rather than pretending the prototype is bigger than it is. The next thing I want to get stronger at is " + edge + ".", "2026-05-" + twoDigit(6 + (index % 16)) + "T16:35:00.000Z"),
                post(slug + "-stock-feed-4", "One thing I try to be honest about in my projects is where the value really is. For me it is usually " + evidence + ", not adding extra screens that do not prove much.", "2026-04-" + twoDigit(18 + (index % 9)) + "T11:40:00.000Z"),
                post(slug + "-stock-feed-5", "I like having one narrower repo like " + projects.get(3).name() + " because it shows how I handle awkward edge cases without hiding them inside a bigger app.", "2026-04-" + twoDigit(8 + (index % 12)) + "T15:30:00.000Z")
        );
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

    private String stockFocusFor(List<String> skills) {
        String joinedSkills = String.join(" ", skills).toLowerCase();
        if (joinedSkills.contains("react") || joinedSkills.contains("javascript")) {
            return "React dashboard";
        }
        if (joinedSkills.contains("spring") || joinedSkills.contains("java") || joinedSkills.contains("jwt")) {
            return "Spring Boot API";
        }
        if (joinedSkills.contains("ruby") || joinedSkills.contains("rails")) {
            return "Rails workflow";
        }
        if (joinedSkills.contains("docker") || joinedSkills.contains("deployment")) {
            return "deployment";
        }
        if (joinedSkills.contains("testing") || joinedSkills.contains("qa")) {
            return "QA";
        }
        if (joinedSkills.contains("sql") || joinedSkills.contains("python") || joinedSkills.contains("data")) {
            return "data tooling";
        }
        return "internal tooling";
    }

    private String stockEvidenceFor(List<String> skills, int index) {
        String focus = stockFocusFor(skills);
        if (focus.contains("React")) {
            return List.of("component states, API errors, and responsive dashboard screenshots", "filter behaviour, empty states, and reusable UI decisions", "admin-screen flow with form validation and loading states").get(index % 3);
        }
        if (focus.contains("Spring")) {
            return List.of("endpoint examples, validation failures, and PostgreSQL-backed responses", "protected API behaviour, service boundaries, and README request notes", "controller-to-database tracing with clear error responses").get(index % 3);
        }
        if (focus.contains("Rails")) {
            return List.of("CRUD state changes, model relationships, and admin review screens", "status history, validation behaviour, and small RSpec notes", "account workflow screenshots with database relationship notes").get(index % 3);
        }
        if (focus.contains("deployment")) {
            return List.of("Docker setup, environment checks, and reproducible startup notes", "health-check screenshots, config notes, and rollback steps", "local setup walkthroughs with common failure diagnostics").get(index % 3);
        }
        if (focus.contains("QA")) {
            return List.of("bug reproduction notes, regression checks, and manual QA evidence", "edge-case test data with failed API and validation states", "risk-based test scenarios connected to product behaviour").get(index % 3);
        }
        if (focus.contains("data")) {
            return List.of("messy CSV examples, cleanup summaries, and SQL-backed reports", "before-and-after data outputs with validation explanations", "sample data that exposes duplicates, missing fields, and suspicious values").get(index % 3);
        }
        return List.of("queue states, owner assignment, and workflow handoff notes", "support screenshots, permission states, and escalation history", "before-and-after workflow simplification evidence").get(index % 3);
    }

    private String stockGrowthEdgeFor(List<String> skills, int index) {
        String focus = stockFocusFor(skills);
        if (focus.contains("React")) {
            return List.of("accessibility details once the core workflow is stable", "knowing when a UI is polished enough to stop refining", "keeping larger component systems consistent as they grow").get(index % 3);
        }
        if (focus.contains("Spring")) {
            return List.of("broader automated test depth", "judging when backend abstractions are worth the complexity", "communicating API constraints even more clearly to frontend teammates").get(index % 3);
        }
        if (focus.contains("Rails")) {
            return List.of("deeper Rails test coverage", "speed in an older codebase I did not start", "knowing when a workflow wants a simpler model split").get(index % 3);
        }
        if (focus.contains("deployment")) {
            return List.of("wider CI/CD confidence beyond the practical basics", "choosing which operational checks matter most under pressure", "production-style rollback judgement").get(index % 3);
        }
        if (focus.contains("QA")) {
            return List.of("automating the right things without losing judgment", "keeping test work lean when there are many possible cases", "connecting bug proof back to product tradeoffs").get(index % 3);
        }
        if (focus.contains("data")) {
            return List.of("handling noisier data at larger scale", "writing even clearer feedback for non-technical users", "deciding where a cleanup rule should stay simple").get(index % 3);
        }
        return List.of("choosing which workflow pain matters most next", "balancing speed with stronger polish on internal tools", "knowing when a rough ops tool wants product-level refinement").get(index % 3);
    }

    private String stockEmployerFitFor(List<String> skills, int index) {
        String focus = stockFocusFor(skills);
        if (focus.contains("React")) {
            return List.of("a small product team with dashboard or admin-screen friction", "an ops-heavy team that needs clearer UI flow more than visual flair", "an employer who needs a careful junior on internal product surfaces").get(index % 3);
        }
        if (focus.contains("Spring")) {
            return List.of("a backend team that wants readable API behaviour over cleverness", "a product team with validation-heavy service work", "an employer dealing with auth, endpoints, or predictable admin data").get(index % 3);
        }
        if (focus.contains("Rails")) {
            return List.of("a Rails team with account workflows or status-heavy CRUD work", "a company that values boring but important backend product work", "an employer who needs admin flows to stay understandable").get(index % 3);
        }
        if (focus.contains("deployment")) {
            return List.of("a team frustrated by fragile setup and local environment drift", "an employer that needs someone practical on Docker and service readiness", "a small company where developer environment friction is costing real time").get(index % 3);
        }
        if (focus.contains("QA")) {
            return List.of("a team tired of repeated validation bugs", "an employer that values careful verification more than swagger", "a product team where reliability and reproduction notes matter").get(index % 3);
        }
        if (focus.contains("data")) {
            return List.of("an employer dealing with messy imports or reporting cleanup", "a small company where data quality issues keep leaking into daily work", "a team that needs practical reporting and validation help").get(index % 3);
        }
        return List.of("a team with operational confusion and too many manual handoffs", "an employer whose internal tools are useful but messy", "a support-heavy product where ownership and status keep getting muddled").get(index % 3);
    }

    private String stockWorkingStyleFor(int index) {
        return List.of(
                "clear review comments and tidy handoff notes",
                "small, steady iteration with visible reasoning",
                "asking product questions before polishing the wrong thing",
                "quiet reliability on unglamorous workflow details",
                "feedback that turns into a cleaner second version"
        ).get(index % 5);
    }

    private List<String> stockImages(String focus, String domain, int index, int offset, int count) {
        List<String> images = new java.util.ArrayList<>();
        for (int imageIndex = 0; imageIndex < count; imageIndex += 1) {
            images.add(stockImage(focus, domain, index, offset * 10 + imageIndex));
        }
        return images;
    }

    private String stockImage(String focus, String domain, int index, int offset) {
        String query = queryPart(focus) + "," + queryPart(domain) + ",software,workspace";
        return "https://source.unsplash.com/900x560/?" + query.replaceAll(",+", ",").replaceAll("^,|,$", "") + "&sig=stock-dev-" + index + "-" + offset;
    }

    private List<String> rotate(List<String> values, int offset) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        List<String> rotated = new java.util.ArrayList<>();
        for (int index = 0; index < values.size(); index += 1) {
            rotated.add(values.get((index + offset) % values.size()));
        }
        return rotated;
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

    private String slugify(String value) {
        return value == null ? "" : value.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private String queryPart(String value) {
        return value == null ? "" : value.toLowerCase().replaceAll("[^a-z0-9]+", ",").replaceAll("^,|,$", "");
    }

    private String titleCase(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return java.util.Arrays.stream(value.split(" "))
                .filter(word -> !word.isBlank())
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
                .reduce((first, second) -> first + " " + second)
                .orElse("");
    }

    private String twoDigit(int value) {
        return value < 10 ? "0" + value : String.valueOf(value);
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

    private record DeveloperStockSeed(
            String title,
            String summary,
            List<String> skills,
            ProfileContactLinksResponse contactLinks,
            DeveloperPreferencesResponse preferences,
            List<ProfileProjectResponse> projects,
            List<ProfilePostResponse> posts
    ) {
    }
}
