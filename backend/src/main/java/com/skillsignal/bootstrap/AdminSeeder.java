package com.skillsignal.bootstrap;

import com.skillsignal.common.AccountEmailFormatter;
import com.skillsignal.user.model.AppUser;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public AdminSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email}") String adminEmail,
            @Value("${app.admin.password}") String adminPassword
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        String canonicalAdminEmail = AccountEmailFormatter.canonicalEmail("SkillSignal Admin", Role.ADMIN);
        AppUser adminUser = userRepository.findByEmailIgnoreCase(canonicalAdminEmail)
                .or(() -> userRepository.findByEmailIgnoreCase(adminEmail))
                .orElse(null);

        if (adminUser == null) {
            userRepository.save(new AppUser(
                    "SkillSignal Admin",
                    canonicalAdminEmail,
                    passwordEncoder.encode(adminPassword),
                    Role.ADMIN
            ));
            return;
        }

        adminUser.setName("SkillSignal Admin");
        adminUser.setEmail(canonicalAdminEmail);
        adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
        userRepository.save(adminUser);
    }
}
