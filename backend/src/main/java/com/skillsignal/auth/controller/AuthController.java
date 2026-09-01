package com.skillsignal.auth.controller;

import com.skillsignal.auth.dto.AuthResponse;
import com.skillsignal.auth.dto.AccountNameUpdateRequest;
import com.skillsignal.auth.dto.PresenceUpdateRequest;
import com.skillsignal.auth.dto.LoginRequest;
import com.skillsignal.auth.dto.RegisterRequest;
import com.skillsignal.auth.service.AuthService;
import com.skillsignal.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PatchMapping("/account")
    AuthResponse updateAccountName(@Valid @RequestBody AccountNameUpdateRequest request, Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return authService.updateAccountName(principal.id(), request);
    }

    @PatchMapping("/presence")
    AuthResponse updatePresence(@Valid @RequestBody PresenceUpdateRequest request, Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return authService.updatePresence(principal.id(), request);
    }
}
