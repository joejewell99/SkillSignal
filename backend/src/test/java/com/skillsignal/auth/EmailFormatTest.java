package com.skillsignal.auth;

import com.skillsignal.auth.dto.LoginRequest;
import com.skillsignal.auth.dto.RegisterRequest;
import com.skillsignal.user.model.Role;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class EmailFormatTest {
    @Test void validatesEmailOnBothAuthRequests() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (String email : new String[]{"joejewell99@hotmail.com", "dev+jobs@example.dev", "first.last@company.co.uk", "a@my-company.uk"}) {
                assertTrue(validator.validateProperty(new LoginRequest(email, "unused"), "email").isEmpty(), email);
                assertTrue(validator.validateProperty(new RegisterRequest("Name", email, "unused", Role.DEVELOPER, true, "token"), "email").isEmpty(), email);
            }
            for (String email : new String[]{"joe@hotmail", "joe@@hotmail.com", ".joe@example.com", "joe..j@example.com", "joe.@example.com", "joe@-host.com", "joe@host-.com", "joe@host..com", "joe j@example.com", "joe@example.com\n", "a".repeat(65) + "@example.com"}) {
                assertFalse(validator.validateProperty(new LoginRequest(email, "unused"), "email").isEmpty(), email);
                assertFalse(validator.validateProperty(new RegisterRequest("Name", email, "unused", Role.EMPLOYER, true, "token"), "email").isEmpty(), email);
            }
        }
    }
}
