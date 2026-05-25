package com.skillsignal.bootstrap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.marketplace.MarketplaceProfile;
import com.skillsignal.marketplace.MarketplaceProfileRepository;
import com.skillsignal.marketplace.ProfileProjectResponse;
import com.skillsignal.marketplace.ProfileType;
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
            supplementJoePortfolio();
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
        supplementJoePortfolio();
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
        jdbcTemplate.execute("alter table marketplace_profiles alter column image type text");
        jdbcTemplate.execute("create unique index if not exists idx_marketplace_profiles_user_id on marketplace_profiles(user_id) where user_id is not null");
    }

    private void supplementJoePortfolio() {
        profileRepository.findAll().stream()
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .filter(profile -> isJoeProfile(profile.getName()))
                .forEach(profile -> {
                    List<ProfileProjectResponse> existingProjects = readProjects(profile.getProjectsJson());
                    List<ProfileProjectResponse> sampleProjects = joePortfolioProjects().stream()
                            .filter(sampleProject -> existingProjects.stream().noneMatch(existingProject -> sameProject(existingProject, sampleProject)))
                            .toList();
                    if (!sampleProjects.isEmpty()) {
                        profile.setProjectsJson(writeProjects(
                                java.util.stream.Stream.concat(existingProjects.stream(), sampleProjects.stream()).toList()
                        ));
                        profileRepository.save(profile);
                    }
                });
    }

    private boolean isJoeProfile(String name) {
        String normalizedName = name == null ? "" : name.toLowerCase();
        return normalizedName.contains("joe") || normalizedName.contains("joseph");
    }

    private List<ProfileProjectResponse> joePortfolioProjects() {
        return List.of(
                new ProfileProjectResponse(
                        "SkillSignal Developer Marketplace",
                        "Built a full-stack hiring platform where developers can publish project-backed profiles and employers can search by skills, proof, and technical focus. Implemented React dashboard flows, Spring Boot profile APIs, JWT-protected routes, and PostgreSQL persistence.",
                        "https://github.com/joe/skillsignal",
                        "",
                        List.of("React", "Spring Boot", "PostgreSQL", "JWT", "REST APIs"),
                        List.of("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80"),
                        true
                ),
                new ProfileProjectResponse(
                        "Developer Portfolio Dashboard",
                        "Created an editable developer workspace for uploading a professional photo, adding main skills, publishing profile visibility, and presenting project evidence with screenshots, descriptions, GitHub links, and live demo links.",
                        "https://github.com/joe/developer-dashboard",
                        "",
                        List.of("React", "Local Storage", "UX Design", "File Uploads"),
                        List.of("https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80"),
                        true
                ),
                new ProfileProjectResponse(
                        "Project Proof API",
                        "Designed the backend profile data model that stores project portfolios as JSON, supports featured work, keeps unpublished developer profiles hidden, and exposes safe read-only public profile endpoints.",
                        "https://github.com/joe/project-proof-api",
                        "",
                        List.of("Java", "Spring Boot", "Jackson", "PostgreSQL", "Security"),
                        List.of("https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80"),
                        false
                )
        );
    }

    private boolean sameProject(ProfileProjectResponse firstProject, ProfileProjectResponse secondProject) {
        return normalizeProjectName(firstProject.name()).equals(normalizeProjectName(secondProject.name()));
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
}
