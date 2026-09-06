package com.skillsignal.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import com.skillsignal.marketplace.dto.ProfileResponse;
import com.skillsignal.marketplace.service.MarketplaceProfileService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class CandidateRundownServiceTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final MarketplaceProfileService profiles = mock(MarketplaceProfileService.class);
    private final AiSearchQuotaService quotas = mock(AiSearchQuotaService.class);
    private MockRestServiceServer server;
    private RestClient.Builder builder;
    private CandidateRundownService service;

    @BeforeEach
    void setup() {
        var realBuilder = RestClient.builder().baseUrl("https://api.openai.com/v1");
        server = MockRestServiceServer.bindTo(realBuilder).build();
        builder = mock(RestClient.Builder.class, RETURNS_SELF);
        when(builder.build()).thenReturn(realBuilder.build());
        service = new CandidateRundownService(profiles, quotas, mapper, builder, "test-key", "test-model");
        var profile = mock(ProfileResponse.class);
        when(profile.name()).thenReturn("Alex");
        when(profile.type()).thenReturn("DEVELOPER");
        when(profile.title()).thenReturn("Frontend developer");
        when(profile.summary()).thenReturn("Builds dashboards");
        when(profile.skills()).thenReturn(List.of("React"));
        when(profile.projects()).thenReturn(List.of(new ProfileProjectResponse("Inventory dashboard",
                "React tables with loading states.", "https://github.com/example/inventory", "",
                List.of("React"), List.of(), false)));
        when(profiles.findPublicProfile(7L)).thenReturn(profile);
        when(quotas.consumeSearch(isNull(), any())).thenReturn(new AiSearchQuota(3, 1, 2));
    }

    private String response(int index) throws Exception {
        return responseWithEvidence(List.of(Map.of("projectIndex", index,
                "whyItMatters", "Loading states are relevant to your slow dashboard.",
                "question", "How did you handle failed requests?")));
    }

    private String responseWithEvidence(List<?> evidence) throws Exception {
        var text = mapper.writeValueAsString(Map.of("summary", "Alex describes relevant React work.",
                "evidence", evidence, "uncertainties", List.of("Large dataset performance is not demonstrated."),
                "nextStep", "Ask for a project walkthrough."));
        return mapper.writeValueAsString(Map.of("status", "completed", "output", List.of(Map.of("content",
                List.of(Map.of("type", "output_text", "text", text))))));
    }

    @Test
    void connectsBriefToStoredEvidenceAndReturnsTrustedSourceLinks() throws Exception {
        server.expect(requestTo("https://api.openai.com/v1/responses"))
                .andExpect(jsonPath("$.input[1].content").value(org.hamcrest.Matchers.containsString("My slow dashboard")))
                .andExpect(jsonPath("$.input[1].content").value(org.hamcrest.Matchers.containsString("React tables with loading states.")))
                .andRespond(withSuccess(response(0), MediaType.APPLICATION_JSON));
        var result = service.generate(7L, "My slow dashboard", null, new MockHttpServletRequest());
        assertThat(result.evidence()).hasSize(1);
        assertThat(result.evidence().getFirst().projectName()).isEqualTo("Inventory dashboard");
        assertThat(result.evidence().getFirst().description()).isEqualTo("React tables with loading states.");
        assertThat(result.evidence().getFirst().githubUrl()).isEqualTo("https://github.com/example/inventory");
        assertThat(result.dailySearchesRemaining()).isEqualTo(2);
        server.verify();
    }

    @Test
    void rejectsInventedProjectReferences() throws Exception {
        server.expect(requestTo("https://api.openai.com/v1/responses"))
                .andRespond(withSuccess(response(99), MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> service.generate(7L, "React", null, new MockHttpServletRequest()))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        server.verify();
    }

    @Test
    void allowsHonestNoRelevantEvidenceResponse() throws Exception {
        server.expect(requestTo("https://api.openai.com/v1/responses"))
                .andRespond(withSuccess(responseWithEvidence(List.of()), MediaType.APPLICATION_JSON));
        assertThat(service.generate(7L, "COBOL", null, new MockHttpServletRequest()).evidence()).isEmpty();
        server.verify();
    }

    @Test
    void refusesHiddenProfilesBeforeSpendingAllowance() {
        when(profiles.findPublicProfile(7L)).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));
        assertThatThrownBy(() -> service.generate(7L, "React", null, new MockHttpServletRequest()))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verifyNoInteractions(quotas);
        server.verify();
    }

    @Test
    void respectsAllowanceBeforeCallingProvider() {
        when(quotas.consumeSearch(isNull(), any())).thenThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS));
        assertThatThrownBy(() -> service.generate(7L, "React", null, new MockHttpServletRequest()))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        server.verify();
    }

    @Test
    void missingConfigurationDoesNotSpendAllowance() {
        service = new CandidateRundownService(profiles, quotas, mapper, builder, "", "test-model");
        assertThatThrownBy(() -> service.generate(7L, "React", null, new MockHttpServletRequest()))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        verifyNoInteractions(quotas);
        server.verify();
    }

    @Test
    void providerFailureReturnsActionableErrorWithoutProviderDetails() {
        server.expect(requestTo("https://api.openai.com/v1/responses"))
                .andRespond(withStatus(HttpStatus.BAD_GATEWAY).body("private provider diagnostics"));
        assertThatThrownBy(() -> service.generate(7L, "React", null, new MockHttpServletRequest()))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> {
                    assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(ex.getReason()).contains("match results are still available").doesNotContain("private");
                });
        server.verify();
    }
}
