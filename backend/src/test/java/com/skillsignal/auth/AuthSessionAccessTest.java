package com.skillsignal.auth;

import com.skillsignal.auth.controller.AuthController;
import com.skillsignal.auth.dto.AuthResponse;
import com.skillsignal.auth.service.AuthService;
import com.skillsignal.security.JwtAuthenticationFilter;
import com.skillsignal.security.JwtService;
import com.skillsignal.security.SecurityConfig;
import com.skillsignal.security.UserPrincipal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AuthController.class,
        properties = {
                "app.cors.allowed-origin=http://localhost:5173",
                "app.jwt.expiration-ms=3600000",
                "app.auth.cookie-secure=false"
        }
)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AuthSessionAccessTest {
    @Autowired MockMvc mvc;
    @MockBean AuthService authService;
    @MockBean JwtService jwtService;
    @MockBean UserDetailsService userDetailsService;

    @Test
    void anonymousUsersReceiveUnauthorizedForCurrentSession() throws Exception {
        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void authenticatedUsersCanRestoreTheirCurrentSession() throws Exception {
        UserPrincipal principal = org.mockito.Mockito.mock(UserPrincipal.class);
        when(principal.id()).thenReturn(7L);
        var authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_DEVELOPER"))
        );
        when(authService.currentSession(7L)).thenReturn(new AuthResponse(
                null,
                7L,
                "Jordan Blake",
                "jordan@example.com",
                "DEVELOPER",
                "ONLINE"
        ));

        mvc.perform(get("/api/auth/me").with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.userId").value(7))
                .andExpect(jsonPath("$.email").value("jordan@example.com"))
                .andExpect(jsonPath("$.role").value("DEVELOPER"));

        verify(authService).currentSession(7L);
    }
}
