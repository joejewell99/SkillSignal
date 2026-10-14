package com.skillsignal.bootstrap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.user.model.AppUser;
import com.skillsignal.user.model.PresenceStatus;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class DemoProfileAccountSeederTest {
    @Test void attachesDemoAccountOnceAndPreservesVisibilityAndExistingOwners() {
        var profiles = mock(MarketplaceProfileRepository.class);
        var users = mock(UserRepository.class);
        var passwords = mock(PasswordEncoder.class);
        var demo = MarketplaceProfile.forDeveloperUser(null, "Sample developer");
        ReflectionTestUtils.setField(demo, "id", 22L);
        demo.setDemoProfile(true);
        demo.setDisplayed(false);
        var owned = MarketplaceProfile.forDeveloperUser(7L, "Existing account");
        owned.setDemoProfile(true);
        var nonDemo = MarketplaceProfile.forDeveloperUser(null, "Not demo data");
        when(profiles.findAll()).thenReturn(List.of(demo, owned, nonDemo));
        when(passwords.encode(anyString())).thenReturn("encoded-random-password");
        when(users.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            assertThat(user.getRole()).isEqualTo(Role.DEVELOPER);
            assertThat(user.getPresence()).isEqualTo(PresenceStatus.INVISIBLE);
            assertThat(user.getEmail()).isEqualTo("stock-profile-22@demo.skillsignal.invalid");
            ReflectionTestUtils.setField(user, "id", 42L);
            return user;
        });
        var seeder = new DemoProfileAccountSeeder(profiles, users, passwords);

        seeder.run();
        seeder.run();

        assertThat(demo.getUserId()).isEqualTo(42L);
        assertThat(demo.isDisplayed()).isFalse();
        assertThat(owned.getUserId()).isEqualTo(7L);
        assertThat(nonDemo.getUserId()).isNull();
        verify(users, times(1)).save(any(AppUser.class));
        verify(profiles, times(1)).save(demo);
    }
}
