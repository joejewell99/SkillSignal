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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.ResponseCookie;
import org.springframework.beans.factory.annotation.Value;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import org.springframework.security.web.csrf.CsrfToken;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final long jwtExpirationMs;
    private final boolean secureCookie;

    public AuthController(
            AuthService authService,
            @Value("${app.jwt.expiration-ms}") long jwtExpirationMs,
            @Value("${app.auth.cookie-secure}") boolean secureCookie
    ) {
        this.authService = authService;
        this.jwtExpirationMs = jwtExpirationMs;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        return authenticatedResponse(authService.register(request), response);
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        return authenticatedResponse(authService.login(request), response);
    }

    @PatchMapping("/account")
    AuthResponse updateAccountName(@Valid @RequestBody AccountNameUpdateRequest request, Authentication authentication, HttpServletResponse response) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return authenticatedResponse(authService.updateAccountName(principal.id(), request), response);
    }

    @PatchMapping("/presence")
    AuthResponse updatePresence(@Valid @RequestBody PresenceUpdateRequest request, Authentication authentication, HttpServletResponse response) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return authenticatedResponse(authService.updatePresence(principal.id(), request), response);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(HttpServletResponse response) {
        response.addHeader("Set-Cookie", sessionCookie("", 0).toString());
    }

    @org.springframework.web.bind.annotation.GetMapping("/csrf")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void csrf(CsrfToken token) {
        // Force token creation so Spring Security issues the XSRF-TOKEN cookie.
        token.getToken();
    }

    @DeleteMapping("/account")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteAccount(Authentication authentication, HttpServletResponse response) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        authService.deleteAccount(principal.id());
        response.addHeader("Set-Cookie", sessionCookie("", 0).toString());
    }

    private AuthResponse authenticatedResponse(AuthResponse auth, HttpServletResponse response) {
        response.addHeader("Set-Cookie", sessionCookie(auth.token(), jwtExpirationMs / 1000).toString());
        return new AuthResponse(null, auth.userId(), auth.name(), auth.email(), auth.role(), auth.presence());
    }

    private ResponseCookie sessionCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from("skillsignal_session", value)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build();
    }
}
