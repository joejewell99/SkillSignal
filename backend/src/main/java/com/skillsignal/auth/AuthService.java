package com.skillsignal.auth;

import com.skillsignal.security.JwtService;
import com.skillsignal.security.UserPrincipal;
import com.skillsignal.marketplace.MarketplaceProfileService;
import com.skillsignal.user.AppUser;
import com.skillsignal.user.Role;
import com.skillsignal.user.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final MarketplaceProfileService marketplaceProfileService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            MarketplaceProfileService marketplaceProfileService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.marketplaceProfileService = marketplaceProfileService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (request.role() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin accounts cannot be self-registered.");
        }

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("An account already exists for this email.");
        }

        AppUser user = new AppUser(
                request.name(),
                request.email().toLowerCase(),
                passwordEncoder.encode(request.password()),
                request.role()
        );
        AppUser savedUser = userRepository.save(user);
        if (savedUser.getRole() == Role.DEVELOPER) {
            marketplaceProfileService.createDeveloperProfile(savedUser.getId(), savedUser.getName());
        }
        return toAuthResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        AppUser user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(AppUser user) {
        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }
}
