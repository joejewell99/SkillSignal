package com.skillsignal.ai;

import com.skillsignal.ai.controller.AiMatchController;
import com.skillsignal.ai.service.CandidateRundownService;
import com.skillsignal.ai.service.DeveloperMatchingService;
import com.skillsignal.security.JwtAuthenticationFilter;
import com.skillsignal.security.JwtService;
import com.skillsignal.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AiMatchController.class, properties = "app.cors.allowed-origin=http://localhost:5173")
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class CandidateRundownAccessTest {
    @Autowired MockMvc mvc;
    @MockBean CandidateRundownService rundowns;
    @MockBean DeveloperMatchingService matches;
    @MockBean JwtService jwt;
    @MockBean UserDetailsService users;

    @Test
    void guestsCannotGenerateRundowns() throws Exception {
        mvc.perform(post("/api/ai/rundown").contentType("application/json")
                .content("{\"profileId\":7,\"brief\":\"React dashboard\"}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(rundowns);
    }

    @ParameterizedTest
    @ValueSource(strings = {"DEVELOPER", "EMPLOYER", "ADMIN"})
    void accountRolesCanGenerateRundowns(String role) throws Exception {
        mvc.perform(post("/api/ai/rundown").with(user("account").roles(role)).contentType("application/json")
                .content("{\"profileId\":7,\"brief\":\"React dashboard\"}"))
                .andExpect(status().isOk());
        verify(rundowns).generate(eq(7L), eq("React dashboard"), any(), any());
    }

    @Test
    void otherRolesCannotGenerateRundowns() throws Exception {
        mvc.perform(post("/api/ai/rundown").with(user("other").roles("OTHER")).contentType("application/json")
                .content("{\"profileId\":7,\"brief\":\"React dashboard\"}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(rundowns);
    }

    @Test
    void guestsCanStillUseGeneralMatching() throws Exception {
        mvc.perform(post("/api/ai/matches").contentType("application/json")
                .content("{\"brief\":\"React dashboard\"}"))
                .andExpect(status().isOk());
        verify(matches).matchDevelopers(eq("React dashboard"), isNull(), any(), any());
    }
}
