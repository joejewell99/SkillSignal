package com.skillsignal.bootstrap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.marketplace.dto.ProfileContactLinksResponse;
import com.skillsignal.marketplace.dto.ProfilePostResponse;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.user.model.AppUser;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(30)
public class DemoEmployerSeeder implements CommandLineRunner {
    private static final String PASSWORD = "Password123!";

    private final UserRepository userRepository;
    private final MarketplaceProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public DemoEmployerSeeder(
            UserRepository userRepository,
            MarketplaceProfileRepository profileRepository,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) {
        List<EmployerSeed> seeds = employerSeeds();
        List<MarketplaceProfile> activeProfiles = new java.util.ArrayList<>();
        for (int index = 0; index < seeds.size(); index += 1) {
            EmployerSeed seed = seeds.get(index);
            AppUser user = userRepository.findByEmailIgnoreCase(seed.email())
                    .filter(existingUser -> existingUser.getRole() == Role.EMPLOYER)
                    .orElseGet(() -> userRepository.save(new AppUser(
                            seed.accountName(),
                            seed.email(),
                            passwordEncoder.encode(PASSWORD),
                            Role.EMPLOYER
                    )));
            user.setName(seed.accountName());
            user.setPasswordHash(passwordEncoder.encode(PASSWORD));
            user = userRepository.save(user);
            AppUser savedUser = user;

            MarketplaceProfile profile = profileRepository.findByUserId(savedUser.getId())
                    .orElseGet(() -> profileRepository.save(MarketplaceProfile.forEmployerUser(savedUser.getId(), seed.companyName())));
            profile.setName(seed.companyName());
            profile.setTitle(seed.title());
            profile.setSummary(seed.summary());
            profile.setImage(seed.image());
            profile.setSkills(seed.skills());
            profile.setDisplayOrder(400 + index);
            profile.setContactLinksJson(writeJson(new ProfileContactLinksResponse(
                    "https://www.linkedin.com/company/" + seed.slug(),
                    "https://github.com/" + seed.slug(),
                    "hiring@" + seed.slug() + ".example",
                    "https://www." + seed.slug() + ".example"
            ), "{}"));
            profile.setProjectsJson(writeJson(seed.needs(), "[]"));
            profile.setPostsJson(writeJson(seed.posts(), "[]"));
            profile.setDisplayed(true);
            activeProfiles.add(profileRepository.save(profile));
        }
        hideStaleGeneratedEmployerProfiles(activeProfiles);
    }

    private void hideStaleGeneratedEmployerProfiles(List<MarketplaceProfile> activeProfiles) {
        Set<Long> activeIds = activeProfiles.stream()
                .map(MarketplaceProfile::getId)
                .collect(java.util.stream.Collectors.toSet());
        profileRepository.findAll().stream()
                .filter(profile -> profile.getType() == ProfileType.EMPLOYER)
                .filter(profile -> profile.getDisplayOrder() >= 400 && profile.getDisplayOrder() <= 449)
                .filter(profile -> !activeIds.contains(profile.getId()))
                .forEach(profile -> {
                    profile.setDisplayed(false);
                    profile.setDisplayOrder(1000);
                    profileRepository.save(profile);
                });
    }

    private List<EmployerSeed> employerSeeds() {
        return List.of(
                employer(
                        "Google",
                        "Google / Cloud Hiring Team",
                        "We are adding junior support to an internal cloud operations group. The best candidates show they can make dashboards readable, explain backend tradeoffs, and handle permissions carefully before a feature reaches a larger team.",
                        "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Spring Boot", "Cloud", "Dashboards", "Authentication"),
                        List.of(
                                need("Cloud Usage Review Console", "A junior developer could help build a React dashboard that explains service usage, cost movement, and account-level warnings for internal teams.", List.of("React", "Dashboards", "Cloud", "REST APIs"), true),
                                need("Admin Access Audit Flow", "We need a careful proof of role-based access screens, audit notes, and protected routes for support staff working across customer environments.", List.of("Authentication", "Spring Security", "Protected Routes", "Audit Logs"), false)
                        ),
                        List.of(
                                post("google-cloud-feed-usage", "Looking for project proof where a junior developer made technical data easier to act on, not just prettier to look at.", "2026-05-27T09:15:00.000Z"),
                                post("google-cloud-feed-auth", "Permission changes are the risky part of our junior-sized work. Screenshots, tests, and clear notes matter here.", "2026-05-24T16:40:00.000Z")
                        )
                ),
                employer(
                        "Stripe",
                        "Stripe / Engineering Manager",
                        "Our payments tooling team needs early-career developers who can reason about reliability, validation, and admin workflows. We care less about perfect polish and more about clear proof that the candidate understands edge cases.",
                        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=240&q=80",
                        List.of("Java", "Spring Boot", "Validation", "SQL", "Testing"),
                        List.of(
                                need("Dispute Evidence Intake", "Build a backend-backed intake workflow that validates uploaded dispute fields, stores review status, and returns useful errors for operations staff.", List.of("Spring Boot", "Validation", "PostgreSQL", "REST APIs"), true),
                                need("Failed Payment Admin Notes", "Create a small admin screen for viewing failed payment reasons, adding internal notes, and filtering records by status.", List.of("React", "SQL", "Admin Screens", "Workflow States"), false)
                        ),
                        List.of(
                                post("stripe-feed-validation", "A strong junior candidate for us can explain validation decisions and what should happen when a request is almost correct but still unsafe.", "2026-05-26T11:05:00.000Z"),
                                post("stripe-feed-admin", "We are reviewing proof around admin tools this week: status changes, audit notes, and readable backend structure.", "2026-05-22T14:25:00.000Z")
                        )
                ),
                employer(
                        "Shopify",
                        "Shopify / Merchant Tools Lead",
                        "We build tools for merchant support teams. The junior profile we want has proof of practical React screens, clear empty states, and small backend endpoints that make busy workflows easier to trust.",
                        "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Node.js", "Internal Tools", "SQL", "Forms"),
                        List.of(
                                need("Merchant Support Queue", "We need a queue view for support agents with filters, assignment, escalation states, and clean loading and empty states.", List.of("React", "Internal Tools", "Workflow States", "CSS"), true),
                                need("Refund Reason Tagging", "A junior developer could build a simple tagging workflow that stores refund reasons and lets managers compare trends over time.", List.of("Node.js", "SQL", "Forms", "Reporting"), false)
                        ),
                        List.of(
                                post("shopify-feed-queue", "Interested in junior portfolios that show how a user moves through a screen under pressure: filters, states, and fewer ambiguous actions.", "2026-05-25T10:35:00.000Z"),
                                post("shopify-feed-tags", "Small internal tools are not small if the data becomes messy. We like candidates who show tidy models and thoughtful labels.", "2026-05-23T15:55:00.000Z")
                        )
                ),
                employer(
                        "Canva",
                        "Canva / Frontend Hiring Partner",
                        "Our team is looking for design-aware junior developers who can build accessible React components, explain interaction choices, and use screenshots to show how an interface improved between versions.",
                        "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Accessibility", "Design Systems", "CSS", "Forms"),
                        List.of(
                                need("Template Review Panel", "Create a React panel for reviewing template submissions with keyboard-friendly controls, validation states, and useful empty views.", List.of("React", "Accessibility", "Forms", "CSS"), true),
                                need("Component State Library", "Document and build a few reusable UI states for loading, failed requests, disabled actions, and review approval.", List.of("React", "Design Systems", "API Error States", "Documentation"), false)
                        ),
                        List.of(
                                post("canva-feed-accessibility", "We are paying close attention to accessibility proof: not generic claims, but components that can be navigated and understood.", "2026-05-27T12:10:00.000Z"),
                                post("canva-feed-states", "Junior candidates stand out when their screenshots show iteration: first version, problem, improved state.", "2026-05-21T09:50:00.000Z")
                        )
                ),
                employer(
                        "Monzo",
                        "Monzo / Backend Platform Lead",
                        "We need junior backend help on internal banking operations tools. Good profiles for us show careful API validation, PostgreSQL relationships, audit-friendly notes, and a calm approach to sensitive changes.",
                        "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=240&q=80",
                        List.of("Spring Boot", "PostgreSQL", "Security", "Validation", "Audit Logs"),
                        List.of(
                                need("Account Change Audit API", "Build read-only endpoints for viewing account changes with pagination, filters, and clear response shapes for an internal admin UI.", List.of("Spring Boot", "PostgreSQL", "Pagination", "Audit Logs"), true),
                                need("Sensitive Action Validation", "Improve validation around sensitive admin actions so errors are explicit and unsafe updates cannot pass silently.", List.of("Validation", "Security", "REST APIs", "Testing"), false)
                        ),
                        List.of(
                                post("monzo-feed-audit", "Looking for developers who treat audit trails as a product feature, not just a database table.", "2026-05-26T08:30:00.000Z"),
                                post("monzo-feed-validation", "The strongest junior examples show what should be rejected and why, with test notes or request examples.", "2026-05-22T17:05:00.000Z")
                        )
                ),
                employer(
                        "Notion",
                        "Notion / Product Engineering Team",
                        "We are hiring around collaboration workflows. The right junior developer can make complex states feel understandable, connect a small API cleanly, and document tradeoffs in plain English.",
                        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "REST APIs", "Workflow States", "Documentation", "Testing"),
                        List.of(
                                need("Workspace Invite Flow", "Build an invite flow with pending, accepted, expired, and revoked states so teams can understand who has access.", List.of("React", "REST APIs", "Workflow States", "Authentication"), true),
                                need("Collaboration Activity Notes", "Create a lightweight activity feed that explains recent document changes without overwhelming the user.", List.of("React", "APIs", "Empty States", "Documentation"), false)
                        ),
                        List.of(
                                post("notion-feed-invites", "We like project proof where state names are boring and obvious. Clever is less useful than understandable.", "2026-05-25T13:20:00.000Z"),
                                post("notion-feed-docs", "Documentation counts when it shows why a workflow behaves the way it does.", "2026-05-23T10:15:00.000Z")
                        )
                ),
                employer(
                        "HubSpot",
                        "HubSpot / CRM Engineering Manager",
                        "We are looking for junior help on CRM workflows where data quality and user trust matter. Strong candidates show forms, validation, SQL-backed records, and thoughtful error states.",
                        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Forms", "SQL", "Validation", "Data cleanup"),
                        List.of(
                                need("Lead Import Validator", "Build a lead import checker that catches duplicate companies, missing owners, and invalid emails before records enter the CRM.", List.of("Data cleanup", "Validation", "CSV", "SQL"), true),
                                need("Sales Activity Dashboard", "Create a dashboard that shows stale deals, upcoming tasks, and recent contact activity without burying reps in noise.", List.of("React", "Dashboards", "REST APIs", "Empty States"), false)
                        ),
                        List.of(
                                post("hubspot-feed-import", "Messy imports are a real hiring signal for us. We want to see how candidates explain bad data, not just clean data.", "2026-05-27T15:05:00.000Z"),
                                post("hubspot-feed-dashboard", "A useful CRM dashboard makes the next action obvious. We are looking for proof of that judgment.", "2026-05-24T11:35:00.000Z")
                        )
                ),
                employer(
                        "Airbnb",
                        "Airbnb / Trust Tools Hiring Team",
                        "Our trust operations tools need careful junior developers who can build review queues, status history, and admin screens without making sensitive workflows harder to reason about.",
                        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "SQL", "Admin Screens", "Workflow States", "Security"),
                        List.of(
                                need("Host Review Queue", "Create a review queue where trust agents can sort cases, update statuses, and see the reason behind each escalation.", List.of("React", "Workflow States", "SQL", "Admin Screens"), true),
                                need("Case History Timeline", "Build a timeline that records case updates, status changes, and reviewer notes with a clear audit trail.", List.of("SQL", "Audit Logs", "Internal Tools", "Security"), false)
                        ),
                        List.of(
                                post("airbnb-feed-review", "Trust tooling rewards candidates who make the workflow calmer and clearer, not louder.", "2026-05-26T10:25:00.000Z"),
                                post("airbnb-feed-history", "Status history is a strong proof area: we want to see how juniors model change over time.", "2026-05-22T12:40:00.000Z")
                        )
                ),
                employer(
                        "BBC",
                        "BBC / News Product Tech Lead",
                        "We need junior support for newsroom tooling. Candidates should show they can build reliable publishing support screens, document edge cases, and keep editorial workflows readable.",
                        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "APIs", "Workflow States", "Testing", "Documentation"),
                        List.of(
                                need("Editorial Checklist Tool", "Build a checklist screen that tracks story readiness, missing metadata, image status, and publication blockers.", List.of("React", "Workflow States", "Forms", "Testing"), true),
                                need("Publishing API Examples", "Document common publishing API requests and errors so junior editors and developers can understand what went wrong.", List.of("API Documentation", "REST APIs", "Error Handling", "Developer Experience"), false)
                        ),
                        List.of(
                                post("bbc-feed-checklist", "Newsroom tools need calm interfaces. We are looking for project proof around checklists, blockers, and clear status language.", "2026-05-27T08:10:00.000Z"),
                                post("bbc-feed-api", "A good API example saves time during a deadline. Documentation proof is very welcome.", "2026-05-23T18:20:00.000Z")
                        )
                ),
                employer(
                        "NHS Digital",
                        "NHS Digital / Service Delivery Lead",
                        "We are hiring for junior-friendly work on healthcare service tools. We value clarity, accessibility, safe data handling, and practical evidence that a developer can support real users.",
                        "https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=240&q=80",
                        List.of("Accessibility", "Data cleanup", "React", "Validation", "Security"),
                        List.of(
                                need("Clinic Referral Review", "Build a referral review screen with clear missing-information warnings, accessible form controls, and safe status updates.", List.of("React", "Accessibility", "Forms", "Validation"), true),
                                need("Patient CSV Quality Check", "Create a CSV checker that flags missing identifiers, duplicate rows, and inconsistent clinic codes before import.", List.of("Python", "CSV", "Data cleanup", "Validation"), false)
                        ),
                        List.of(
                                post("nhs-feed-access", "Accessibility proof matters here. We want candidates who can show the details, not just say the word.", "2026-05-26T09:45:00.000Z"),
                                post("nhs-feed-csv", "Healthcare data cleanup needs careful error messages and conservative assumptions.", "2026-05-21T16:00:00.000Z")
                        )
                ),
                employer(
                        "Deliveroo",
                        "Deliveroo / Logistics Engineering Manager",
                        "Our logistics team needs junior developers who can build operational dashboards and workflow tools that help support teams spot problems quickly during busy service windows.",
                        "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Dashboards", "SQL", "APIs", "Internal Tools"),
                        List.of(
                                need("Courier Delay Dashboard", "Create a dashboard for live delivery delays, region filters, and clear empty/error states for support teams.", List.of("React", "Dashboards", "REST APIs", "SQL"), true),
                                need("Restaurant Escalation Tracker", "Build a tracker for restaurant escalations with owner assignment, status history, and resolution notes.", List.of("Internal Tools", "Workflow States", "SQL", "Forms"), false)
                        ),
                        List.of(
                                post("deliveroo-feed-dashboard", "Operational dashboards need fast scanning. We want proof that candidates can design for pressure.", "2026-05-25T08:50:00.000Z"),
                                post("deliveroo-feed-escalation", "Escalation tooling is about ownership and status clarity. Small projects can prove that well.", "2026-05-23T13:30:00.000Z")
                        )
                ),
                employer(
                        "GitHub",
                        "GitHub / Developer Experience Lead",
                        "We are looking for junior developers who care about API examples, onboarding flows, and docs that help other engineers succeed without needing a meeting.",
                        "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=240&q=80",
                        List.of("API Documentation", "Developer Experience", "JavaScript", "Authentication", "REST APIs"),
                        List.of(
                                need("OAuth Example Sandbox", "Build a small sandbox that shows OAuth login, token errors, and authenticated API calls with clear copy.", List.of("Authentication", "JavaScript", "REST APIs", "Developer Experience"), true),
                                need("Webhook Debug Guide", "Create examples and troubleshooting notes for webhook payloads, retry behavior, and common signature mistakes.", List.of("API Documentation", "Webhooks", "Testing", "Docs"), false)
                        ),
                        List.of(
                                post("github-feed-oauth", "A junior project with honest OAuth edge-case notes is more useful than a polished demo that hides every failure.", "2026-05-26T14:00:00.000Z"),
                                post("github-feed-webhooks", "We are scanning for candidates who write docs like someone else will actually depend on them.", "2026-05-22T10:45:00.000Z")
                        )
                ),
                employer(
                        "Wise",
                        "Wise / Compliance Tools Manager",
                        "We build internal compliance tools where data quality and traceability matter. Junior candidates should show careful validation, useful SQL, and simple review screens.",
                        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=240&q=80",
                        List.of("SQL", "Data cleanup", "Validation", "React", "Audit Logs"),
                        List.of(
                                need("KYC Review Batch Tool", "Build a batch review screen for KYC checks with missing-field warnings, reviewer notes, and clear status transitions.", List.of("React", "Validation", "Workflow States", "Audit Logs"), true),
                                need("Compliance CSV Reconciliation", "Create SQL and Python checks that compare uploaded compliance files against expected records and explain mismatches.", List.of("Python", "SQL", "CSV", "Data cleanup"), false)
                        ),
                        List.of(
                                post("wise-feed-kyc", "Compliance tools need boring, reliable workflows. We like candidates who show status history and conservative validation.", "2026-05-27T09:40:00.000Z"),
                                post("wise-feed-reconcile", "Reconciliation proof is a strong signal: can the candidate explain exactly why two records do not match?", "2026-05-24T15:10:00.000Z")
                        )
                ),
                employer(
                        "Atlassian",
                        "Atlassian / Jira Platform Team",
                        "Our team is interested in junior developers who understand workflow states, admin screens, and the small UX details that make tools useful for technical teams.",
                        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Workflow States", "REST APIs", "Admin Screens", "Testing"),
                        List.of(
                                need("Issue Automation Rule Builder", "Create a simple rule builder for issue updates with validation, preview states, and clear error handling.", List.of("React", "Forms", "Workflow States", "API Error States"), true),
                                need("Admin Permission Matrix", "Build an admin matrix that shows which user groups can edit, delete, or automate project workflows.", List.of("Authentication", "Admin Screens", "Security", "React"), false)
                        ),
                        List.of(
                                post("atlassian-feed-rules", "Rule builders are a great junior project because they expose validation, UX, and edge cases quickly.", "2026-05-25T12:35:00.000Z"),
                                post("atlassian-feed-permissions", "Permission matrices are easy to mock and hard to reason about. Good proof here stands out.", "2026-05-22T09:25:00.000Z")
                        )
                ),
                employer(
                        "Figma",
                        "Figma / Design Systems Engineering",
                        "We are looking for junior frontend developers who can turn component states into clean, documented examples. The best proof shows accessibility, responsive behavior, and practical error states.",
                        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Design Systems", "Accessibility", "CSS", "Documentation"),
                        List.of(
                                need("Component State Gallery", "Build a gallery of component states for loading, disabled, warning, empty, and failed request conditions.", List.of("React", "Design Systems", "CSS", "Documentation"), true),
                                need("Accessible Form Pattern", "Create an accessible form pattern with validation messages, keyboard behavior, and screen-reader-friendly labels.", List.of("Accessibility", "Forms", "React", "Validation"), false)
                        ),
                        List.of(
                                post("figma-feed-gallery", "We are not looking for fancy visuals first. We want component states that communicate clearly.", "2026-05-26T13:15:00.000Z"),
                                post("figma-feed-forms", "Accessible forms are a very useful junior proof area when the candidate documents the details.", "2026-05-23T11:55:00.000Z")
                        )
                ),
                employer(
                        "Slack",
                        "Slack / Internal Tools Staff Engineer",
                        "We need junior support on tools that help customer teams triage issues quickly. A strong candidate can build searchable workflows, useful filters, and readable API-backed screens.",
                        "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Node.js", "Internal Tools", "Search", "APIs"),
                        List.of(
                                need("Customer Issue Triage", "Create a triage tool with search, filters, assignment, and a compact activity summary for customer incidents.", List.of("React", "Node.js", "Internal Tools", "Search"), true),
                                need("Support Macro Usage Report", "Build a report showing which support macros are used, stale, or missing owner review.", List.of("SQL", "Reporting", "Dashboards", "APIs"), false)
                        ),
                        List.of(
                                post("slack-feed-triage", "Triage tools should reduce noise. We are interested in candidates who show restraint in UI decisions.", "2026-05-25T16:20:00.000Z"),
                                post("slack-feed-macros", "Reporting projects stand out when they help a team decide what to do next.", "2026-05-21T10:05:00.000Z")
                        )
                ),
                employer(
                        "Spotify",
                        "Spotify / Creator Tools Lead",
                        "Our creator tooling team needs junior developers who can build data-informed product screens without losing sight of the person using them.",
                        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Dashboards", "APIs", "Data Visualization", "Testing"),
                        List.of(
                                need("Creator Metrics Snapshot", "Build a metrics snapshot showing listener changes, release activity, and simple trend explanations for creators.", List.of("React", "Dashboards", "Data Visualization", "REST APIs"), true),
                                need("Playlist Submission Review", "Create a review workflow for playlist submissions with status tracking, notes, and clear empty states.", List.of("React", "Workflow States", "Forms", "Testing"), false)
                        ),
                        List.of(
                                post("spotify-feed-metrics", "Metrics screens should explain movement, not just display numbers. Junior proof can show that judgment.", "2026-05-27T11:30:00.000Z"),
                                post("spotify-feed-review", "Review workflows are valuable when a candidate can show the boring states: empty, rejected, waiting, approved.", "2026-05-22T13:45:00.000Z")
                        )
                ),
                employer(
                        "Netflix",
                        "Netflix / Studio Engineering Manager",
                        "We are exploring junior support for production operations tooling. Useful profiles show workflow tracking, role-aware screens, and backend data that helps teams make decisions quickly.",
                        "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Spring Boot", "PostgreSQL", "Workflow States", "Security"),
                        List.of(
                                need("Production Request Tracker", "Build a tracker for studio production requests with owners, status changes, due dates, and escalation notes.", List.of("React", "PostgreSQL", "Workflow States", "Admin Screens"), true),
                                need("Crew Access Admin", "Create a role-aware admin screen for assigning temporary access to production tooling.", List.of("Spring Security", "Authentication", "React", "Audit Logs"), false)
                        ),
                        List.of(
                                post("netflix-feed-tracker", "Production tools need a clear source of truth. We are looking for candidates who can model workflow change well.", "2026-05-26T10:10:00.000Z"),
                                post("netflix-feed-access", "Temporary access is a great test of whether someone understands roles, expiry, and audit notes.", "2026-05-24T12:05:00.000Z")
                        )
                ),
                employer(
                        "Bloomberg",
                        "Bloomberg / Data Products Engineering Lead",
                        "We hire juniors who can handle data-heavy screens and explain backend decisions. Strong evidence includes SQL, validation, API structure, and interfaces that make dense information usable.",
                        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=240&q=80",
                        List.of("SQL", "Spring Boot", "Dashboards", "Data Quality", "REST APIs"),
                        List.of(
                                need("Market Data Quality Monitor", "Build a monitor that flags missing prices, stale records, and suspicious values before reports are published.", List.of("SQL", "Data Quality", "Validation", "Dashboards"), true),
                                need("Reference Data API", "Create backend endpoints for reference data lookup with filtering, pagination, and clear error responses.", List.of("Spring Boot", "REST APIs", "Pagination", "PostgreSQL"), false)
                        ),
                        List.of(
                                post("bloomberg-feed-quality", "Data quality proof is strongest when candidates show examples of bad records and how the tool responds.", "2026-05-27T08:55:00.000Z"),
                                post("bloomberg-feed-api", "Dense APIs still need readable examples. We value candidates who document request and response decisions.", "2026-05-23T14:35:00.000Z")
                        )
                ),
                employer(
                        "Octopus Energy",
                        "Octopus Energy / Product Engineering Lead",
                        "We need junior developers who can work on customer energy tools with practical dashboards, clean forms, and clear explanations of usage or billing data.",
                        "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Python", "Dashboards", "Data cleanup", "Forms"),
                        List.of(
                                need("Energy Usage Explainer", "Build a dashboard that helps customers understand usage changes, unusual spikes, and simple month-by-month trends.", List.of("React", "Dashboards", "Data Visualization", "APIs"), true),
                                need("Meter Reading Import Check", "Create a validation tool for meter reading uploads that catches duplicates, missing values, and impossible readings.", List.of("Python", "CSV", "Validation", "Data cleanup"), false)
                        ),
                        List.of(
                                post("octopus-feed-usage", "Customer-facing dashboards should explain what changed and why. That is the proof we want to see.", "2026-05-25T09:05:00.000Z"),
                                post("octopus-feed-meter", "Meter data can go wrong in strange ways. Juniors who test awkward cases stand out.", "2026-05-22T16:50:00.000Z")
                        )
                )
        );
    }

    private EmployerSeed employer(
            String companyName,
            String title,
            String summary,
            String image,
            List<String> skills,
            List<ProfileProjectResponse> needs,
            List<ProfilePostResponse> posts
    ) {
        String slug = slugify(companyName);
        return new EmployerSeed(companyName, companyName, slug + "@gmail.com", slug, title, summary, image, skills, needs, posts);
    }

    private ProfileProjectResponse need(String name, String description, List<String> skills, boolean featured) {
        return new ProfileProjectResponse(name, description, "", "", skills, List.of(), featured);
    }

    private ProfilePostResponse post(String id, String body, String createdAt) {
        return new ProfilePostResponse(id, body, createdAt);
    }

    private String slugify(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private String writeJson(Object value, String fallback) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            return fallback;
        }
    }

    private record EmployerSeed(
            String accountName,
            String companyName,
            String email,
            String slug,
            String title,
            String summary,
            String image,
            List<String> skills,
            List<ProfileProjectResponse> needs,
            List<ProfilePostResponse> posts
    ) {
    }
}
