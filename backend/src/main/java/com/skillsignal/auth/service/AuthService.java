package com.skillsignal.auth.service;

import com.skillsignal.auth.dto.AuthResponse;
import com.skillsignal.auth.dto.AccountNameUpdateRequest;
import com.skillsignal.auth.dto.PresenceUpdateRequest;
import com.skillsignal.auth.dto.LoginRequest;
import com.skillsignal.auth.dto.RegisterRequest;
import com.skillsignal.marketplace.service.MarketplaceProfileService;
import com.skillsignal.ai.repository.AiSearchUsageRepository;
import com.skillsignal.ai.service.DeveloperMatchingService;
import com.skillsignal.connection.model.DeveloperConnection;
import com.skillsignal.connection.repository.DeveloperConnectionRepository;
import com.skillsignal.employer.repository.SavedCandidateRepository;
import com.skillsignal.messaging.model.DeveloperConversation;
import com.skillsignal.messaging.repository.DeveloperConversationRepository;
import com.skillsignal.messaging.repository.DeveloperMessageRepository;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.proof.repository.ProofSignalRepository;
import com.skillsignal.security.JwtService;
import com.skillsignal.security.UserPrincipal;
import com.skillsignal.user.model.AppUser;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final String CURRENT_TERMS_VERSION = "2026-09-06";
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final MarketplaceProfileService marketplaceProfileService;
    private final MarketplaceProfileRepository marketplaceProfileRepository;
    private final DeveloperConversationRepository conversationRepository;
    private final DeveloperMessageRepository messageRepository;
    private final DeveloperConnectionRepository connectionRepository;
    private final SavedCandidateRepository savedCandidateRepository;
    private final ProofSignalRepository proofSignalRepository;
    private final AiSearchUsageRepository aiSearchUsageRepository;
    private final DeveloperMatchingService matchingService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            MarketplaceProfileService marketplaceProfileService,
            MarketplaceProfileRepository marketplaceProfileRepository,
            DeveloperConversationRepository conversationRepository,
            DeveloperMessageRepository messageRepository,
            DeveloperConnectionRepository connectionRepository,
            SavedCandidateRepository savedCandidateRepository,
            ProofSignalRepository proofSignalRepository,
            AiSearchUsageRepository aiSearchUsageRepository,
            DeveloperMatchingService matchingService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.marketplaceProfileService = marketplaceProfileService;
        this.marketplaceProfileRepository = marketplaceProfileRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.connectionRepository = connectionRepository;
        this.savedCandidateRepository = savedCandidateRepository;
        this.proofSignalRepository = proofSignalRepository;
        this.aiSearchUsageRepository = aiSearchUsageRepository;
        this.matchingService = matchingService;
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
        user.setTermsAcceptedAt(java.time.Instant.now());
        user.setTermsVersion(CURRENT_TERMS_VERSION);
        AppUser savedUser = userRepository.save(user);
        if (savedUser.getRole() == Role.DEVELOPER) {
            marketplaceProfileService.createDeveloperProfile(savedUser.getId(), savedUser.getName());
        }
        if (savedUser.getRole() == Role.EMPLOYER) {
            marketplaceProfileService.createEmployerProfile(savedUser.getId(), savedUser.getName());
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

    @Transactional
    public AuthResponse updateAccountName(Long userId, AccountNameUpdateRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found."));
        user.setName(request.name().trim());
        AppUser savedUser = userRepository.save(user);
        marketplaceProfileService.updateProfileName(savedUser.getId(), savedUser.getName());
        return toAuthResponse(savedUser);
    }

    public AuthResponse updatePresence(Long userId, PresenceUpdateRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found."));
        user.setPresence(request.presence());
        return toAuthResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteAccount(Long userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found."));
        MarketplaceProfile profile = marketplaceProfileRepository.findByUserId(userId).orElse(null);
        matchingService.deleteSearchesForUser(userId);

        if (profile != null) {
            savedCandidateRepository.deleteAll(savedCandidateRepository.findByDeveloperProfileId(profile.getId()));
            proofSignalRepository.deleteAll(proofSignalRepository.findByEmployerProfileUserId(userId));
        }
        savedCandidateRepository.deleteAll(savedCandidateRepository.findByEmployerUserIdOrderByCreatedAtDesc(userId));
        proofSignalRepository.deleteAll(proofSignalRepository.findByDeveloperUserId(userId));

        for (DeveloperConversation conversation : conversationRepository.findForUser(userId)) {
            messageRepository.deleteByConversationId(conversation.getId());
            conversationRepository.delete(conversation);
        }
        for (DeveloperConnection connection : connectionRepository.findForUser(userId)) {
            connectionRepository.delete(connection);
        }

        aiSearchUsageRepository.deleteBySubjectTypeAndSubjectKey("USER", String.valueOf(userId));
        if (profile != null) {
            marketplaceProfileRepository.delete(profile);
        }
        userRepository.delete(user);
    }

    private AuthResponse toAuthResponse(AppUser user) {
        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name(), user.getPresence().name());
    }
}
