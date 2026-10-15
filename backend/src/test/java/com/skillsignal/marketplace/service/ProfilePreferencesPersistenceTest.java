package com.skillsignal.marketplace.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.marketplace.dto.DeveloperPreferencesResponse;
import com.skillsignal.marketplace.dto.ProfileContactLinksResponse;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProfilePreferencesPersistenceTest {
    @Test
    void uploadedProjectImageDoesNotBlockProfileChanges() {
        try (var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            var image = "data:image/png;base64," + "A".repeat(73700);
            var project = new com.skillsignal.marketplace.dto.ProfileProjectResponse("Project", "Description", "", "", List.of(), List.of(image), false);
            var request = new com.skillsignal.developer.dto.DeveloperProfileUpdateRequest("Developer", "Summary", "", List.of(), null,
                    new DeveloperPreferencesResponse("Open to internships", List.of("Full-stack"), "London", List.of("Senior")),
                    List.of(project), List.of(), false);
            assertTrue(factory.getValidator().validate(request).isEmpty());
            var oversized = new com.skillsignal.marketplace.dto.ProfileProjectResponse("Project", "Description", "", "", List.of(), List.of("data:image/png;base64," + "A".repeat(200_000)), false);
            assertFalse(factory.getValidator().validate(oversized).isEmpty());
        }
    }

    @Test
    void avifProjectImageIsSupported() {
        try (var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            var avif = "data:image/avif;base64," + "A".repeat(73700);
            var project = new com.skillsignal.marketplace.dto.ProfileProjectResponse("Project", "Description", "", "", List.of(), List.of(avif), false);
            assertTrue(factory.getValidator().validate(project).isEmpty());
        }
    }

    @Test
    void preferencesAndContactsSurviveStorageReloadAndCanBeCleared() {
        var repository = mock(MarketplaceProfileRepository.class);
        var users = mock(UserRepository.class);
        var mapper = new ObjectMapper();
        var service = new MarketplaceProfileService(repository, users, mapper);
        var entity = MarketplaceProfile.forDeveloperUser(42L, "Persistence check");
        when(repository.findByUserId(42L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenAnswer(call -> call.getArgument(0));
        var preferences = new DeveloperPreferencesResponse("Open to contract roles", List.of("Security", "DevOps & Cloud"), "London", List.of("Mid-level", "Senior"));
        var contacts = new ProfileContactLinksResponse("", "https://github.com/example", "check@example.test", "");
        service.updateDeveloperProfile(42L, "Persistence check", "Developer", "Summary", "", List.of("React"), contacts, preferences, List.of(), List.of(), false);
        verify(repository).save(entity);
        // Reconstruct an entity from serialized storage, not the PATCH response.
        var reloaded = MarketplaceProfile.forDeveloperUser(42L, "Persistence check");
        reloaded.setPreferencesJson(entity.getPreferencesJson());
        reloaded.setContactLinksJson(entity.getContactLinksJson());
        when(repository.findByUserId(42L)).thenReturn(Optional.of(reloaded));
        var saved = service.findDeveloperProfile(42L, "Persistence check");
        assertEquals(preferences, saved.preferences());
        assertEquals(contacts, saved.contactLinks());
        var empty = new DeveloperPreferencesResponse("Not currently looking", List.of(), "", List.of());
        var emptyContacts = new ProfileContactLinksResponse("", "", "", "");
        service.updateDeveloperProfile(42L, "Persistence check", "Developer", "Summary", "", List.of(), emptyContacts, empty, List.of(), List.of(), false);
        var cleared = service.findDeveloperProfile(42L, "Persistence check");
        assertEquals(empty, cleared.preferences());
        assertEquals(emptyContacts, cleared.contactLinks());
    }
}
