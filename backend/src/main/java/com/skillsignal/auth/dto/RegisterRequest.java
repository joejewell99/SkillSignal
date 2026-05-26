package com.skillsignal.auth.dto;

import com.skillsignal.user.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String name,
        @Email @NotBlank String email,
        @Size(min = 8, message = "Password must be at least 8 characters") String password,
        @NotNull Role role
) {
}
