package com.skillsignal.bootstrap;

import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.user.model.AppUser;
import com.skillsignal.user.model.PresenceStatus;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Gives legacy display-only demo profiles the same inbox ownership as other demo users. */
@Component
@Order(24)
public class DemoProfileAccountSeeder implements CommandLineRunner {
    private final MarketplaceProfileRepository profiles;
    private final UserRepository users;
    private final PasswordEncoder passwords;

    public DemoProfileAccountSeeder(MarketplaceProfileRepository profiles, UserRepository users, PasswordEncoder passwords) {
        this.profiles = profiles;
        this.users = users;
        this.passwords = passwords;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Repair existing demo data even when creation of new demo data has been disabled.
        profiles.findAll().stream()
                .filter(profile -> profile.isDemoProfile() && profile.getUserId() == null)
                .forEach(profile -> {
                    // Reserved domain and an unshared random password: no real identity or email delivery.
                    String email = "stock-profile-" + profile.getId() + "@demo.skillsignal.invalid";
                    if (users.findByEmailIgnoreCase(email).isPresent()) {
                        throw new IllegalStateException("Demo account address is already assigned: " + profile.getId());
                    }
                    AppUser account = new AppUser(profile.getName(), email,
                            passwords.encode(UUID.randomUUID().toString()),
                            profile.getType() == ProfileType.DEVELOPER ? Role.DEVELOPER : Role.EMPLOYER);
                    account.setPresence(PresenceStatus.INVISIBLE);
                    profile.attachAccount(users.save(account).getId());
                    profiles.save(profile);
                });
    }
}
