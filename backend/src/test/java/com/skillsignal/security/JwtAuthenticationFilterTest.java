package com.skillsignal.security;

import com.skillsignal.user.model.AppUser;
import com.skillsignal.user.model.Role;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {
    private final UserDetailsService users = mock(UserDetailsService.class);
    private final FilterChain chain = mock(FilterChain.class);
    private final UserPrincipal principal = new UserPrincipal(new AppUser("Test", "test@example.invalid", "unused", Role.DEVELOPER));
    private final String secret = "test-only-secret-with-at-least-thirty-two-characters";

    @AfterEach
    void clearContext() { SecurityContextHolder.clearContext(); }

    private MockHttpServletResponse request(String token, JwtService jwt) throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/ai/rundown");
        if (token != null) request.addHeader("Authorization", "Bearer " + token);
        var response = new MockHttpServletResponse();
        new JwtAuthenticationFilter(jwt, users).doFilter(request, response, chain);
        return response;
    }

    @Test
    void expiredTokenReturnsActionableJsonWithoutCallingRundown() throws Exception {
        var jwt = new JwtService(secret, -60000);
        var response = request(jwt.generateToken(principal), jwt);
        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).startsWith("application/json");
        assertThat(response.getContentAsString()).contains("SESSION_EXPIRED", "Please sign in again");
        verifyNoInteractions(chain, users);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void malformedTokenReturnsUnauthorizedInsteadOfServerError() throws Exception {
        assertThat(request("not-a-jwt", new JwtService(secret, 60000)).getStatus()).isEqualTo(401);
        verifyNoInteractions(chain, users);
    }

    @Test
    void invalidSignatureDoesNotBecomeGuestRequest() throws Exception {
        var otherSigner = new JwtService("another-test-only-secret-with-at-least-thirty-two-characters", 60000);
        assertThat(request(otherSigner.generateToken(principal), new JwtService(secret, 60000)).getStatus()).isEqualTo(401);
        verifyNoInteractions(chain, users);
    }

    @Test
    void removedUserReturnsUnauthorized() throws Exception {
        var jwt = new JwtService(secret, 60000);
        when(users.loadUserByUsername(principal.getUsername())).thenThrow(new UsernameNotFoundException("Removed"));
        assertThat(request(jwt.generateToken(principal), jwt).getStatus()).isEqualTo(401);
        verifyNoInteractions(chain);
    }

    @Test
    void validTokenAuthenticatesAndContinues() throws Exception {
        var jwt = new JwtService(secret, 60000);
        when(users.loadUserByUsername(principal.getUsername())).thenReturn(principal);
        assertThat(request(jwt.generateToken(principal), jwt).getStatus()).isEqualTo(200);
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal()).isSameAs(principal);
        verify(chain).doFilter(any(), any());
    }

    @Test
    void guestRequestContinuesWithoutAuthentication() throws Exception {
        assertThat(request(null, new JwtService(secret, 60000)).getStatus()).isEqualTo(200);
        verify(chain).doFilter(any(), any());
        verifyNoInteractions(users);
    }
}
