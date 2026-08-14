package com.skillsignal.bootstrap;

import com.skillsignal.common.AccountEmailFormatter;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.user.model.AppUser;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(21)
public class ExtraDemoDeveloperSeeder implements CommandLineRunner {
    private static final String PASSWORD = "Password123!";

    private final UserRepository userRepository;
    private final MarketplaceProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public ExtraDemoDeveloperSeeder(
            UserRepository userRepository,
            MarketplaceProfileRepository profileRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        List<DeveloperSeed> seeds = List.of(
                new DeveloperSeed(
                        "Aisha Khan",
                        "aisha-khan",
                        "Junior Frontend Developer",
                        "I enjoy making dashboard flows feel lighter and easier to scan. Most of my practice projects come from messy support workflows where the real challenge is reducing friction without hiding useful detail.",
                        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Accessibility", "Design systems", "TypeScript"),
                        205
                ),
                new DeveloperSeed(
                        "Leo Santos",
                        "leo-santos",
                        "Backend Developer",
                        "A lot of my work is small backend tooling for internal teams. I like APIs that are easy to reason about, clear validation paths, and data that is boring in the best possible way.",
                        "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=240&q=80",
                        List.of("Java", "Spring Boot", "PostgreSQL", "REST APIs"),
                        206
                ),
                new DeveloperSeed(
                        "Nina Rossi",
                        "nina-rossi",
                        "Product-minded Developer",
                        "I tend to be strongest when a project needs calmer UX decisions and cleaner handoffs between frontend and backend. I care a lot about making proof readable for the next person reviewing the work.",
                        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "API integration", "UX writing", "Testing"),
                        207
                ),
                new DeveloperSeed(
                        "Marcus Bell",
                        "marcus-bell",
                        "Junior Full-stack Developer",
                        "Most of my portfolio work comes from operations-heavy product ideas. I like the awkward bits: filtering, edge cases, admin screens, and the places where software either earns trust or loses it.",
                        "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=240&q=80",
                        List.of("React", "Node.js", "SQL", "Internal tools"),
                        208
                ),
                new DeveloperSeed(
                        "Priya Desai",
                        "priya-desai",
                        "Junior Software Developer",
                        "I usually build around workflow problems that need better structure rather than more features. The strongest part of my projects is normally how clearly the decisions and tradeoffs are explained.",
                        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80",
                        List.of("Spring Boot", "React", "Documentation", "Problem solving"),
                        209
                )
        );

        for (DeveloperSeed seed : seeds) {
            AppUser user = userRepository.findByEmailIgnoreCase(seed.email())
                    .orElseGet(() -> userRepository.save(new AppUser(
                            seed.name(),
                            seed.email(),
                            passwordEncoder.encode(PASSWORD),
                            Role.DEVELOPER
                    )));
            user.setName(seed.name());
            user.setEmail(seed.email());
            user.setPasswordHash(passwordEncoder.encode(PASSWORD));
            user = userRepository.save(user);

            MarketplaceProfile profile = profileRepository.findByUserId(user.getId())
                    .orElseGet(() -> profileRepository.save(MarketplaceProfile.forDeveloperUser(user.getId(), seed.name())));

            profile.setName(seed.name());
            profile.setTitle(seed.title());
            profile.setSummary(seed.summary());
            profile.setImage(seed.image());
            profile.setSkills(seed.skills());
            profile.setDisplayed(true);
            profile.setDemoProfile(true);
            profile.setDisplayOrder(seed.displayOrder());
            profileRepository.save(profile);
        }
    }

    private record DeveloperSeed(
            String name,
            String slug,
            String title,
            String summary,
            String image,
            List<String> skills,
            int displayOrder
    ) {
        String email() {
            return AccountEmailFormatter.canonicalEmail(name, Role.DEVELOPER);
        }
    }
}
