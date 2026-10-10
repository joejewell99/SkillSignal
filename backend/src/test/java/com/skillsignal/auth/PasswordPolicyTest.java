package com.skillsignal.auth;

import com.skillsignal.auth.service.PasswordPolicy;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PasswordPolicyTest {
    @Test void rejectsShortPasswordsEvenWithSymbols() {
        assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.validate("X9!vR2#", "Jordan", "jordan@example.com"));
    }
    @Test void rejectsLongRepetitionAndCommonPatterns() {
        for (String password : new String[]{"aaaaaaaaaaaaaaaaaaaa", "Password123456789!", "password", "12345678"}) {
            assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.validate(password, "Jordan", "jordan@example.com"));
        }
    }
    @Test void acceptsUnrelatedWordsWithoutMandatorySymbols() {
        assertDoesNotThrow(() -> PasswordPolicy.validate("cobalt otter lantern meadow", "Jordan", "jordan@example.com"));
    }
    @Test void acceptsEightCharactersAndAdvisoryWeakRatings() {
        assertDoesNotThrow(() -> PasswordPolicy.validate("LOLIPOP36", "Jordan", "jordan@example.com"));
        assertDoesNotThrow(() -> PasswordPolicy.validate("X9!vR2#k", "Jordan", "jordan@example.com"));
    }
    @Test void rejectsPersonalInformation() {
        assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.validate("VeryUniqueCompany2026!", "VeryUniqueCompany", "owner@example.com"));
    }
    @Test void enforcesBcryptByteLimitBeforeEstimating() {
        assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.validate("界".repeat(25), "Jordan", "jordan@example.com"));
    }
}
