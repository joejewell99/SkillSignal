package com.skillsignal.auth.dto;

import com.skillsignal.user.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;

public record RegisterRequest(
        @NotBlank @Size(max = 80, message = "Name must be 80 characters or fewer") String name,
        @Email @jakarta.validation.constraints.Pattern(regexp = EmailFormat.REGEX, message = EmailFormat.MESSAGE) @NotBlank @Size(max = 254, message = "Email must be 254 characters or fewer") String email,
        @NotBlank @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters") String password,
        @NotNull Role role,
        @AssertTrue(message = "You must accept the Terms and Conditions and Privacy Policy") boolean acceptedTerms,
        @NotBlank @Size(max = 2048) String turnstileToken
) {
}
