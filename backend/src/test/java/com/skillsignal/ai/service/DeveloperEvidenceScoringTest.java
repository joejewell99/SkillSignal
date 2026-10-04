package com.skillsignal.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.marketplace.dto.ProfileProjectResponse;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DeveloperEvidenceScoringTest {
    private final DeveloperMatchingService service = new DeveloperMatchingService(
            null, new ObjectMapper(), new BriefAnalysisService(), null, "", "");
    private final BriefAnalysis brief = new BriefAnalysis("React authentication", "GOOD", false, "",
            List.of("React"), List.of("Authentication"), List.of(), List.of());

    private int score(List<ProfileProjectResponse> projects) {
        MarketplaceProfile profile = mock(MarketplaceProfile.class);
        when(profile.getTitle()).thenReturn("Developer");
        when(profile.getSummary()).thenReturn("React authentication developer");
        when(profile.getSkills()).thenReturn(List.of("React"));
        return ReflectionTestUtils.invokeMethod(service, "evidenceFitScore", profile, projects, brief);
    }

    private ProfileProjectResponse project(String description, String code) {
        return new ProfileProjectResponse("Work sample", description, code, "", List.of("React"), List.of(), false);
    }

    @Test void relevantWorkOutranksSameStackUnrelatedWork() {
        assertTrue(score(List.of(project("React authentication with protected routes", "https://github.com/example/auth")))
                > score(List.of(project("React recipe display", "https://github.com/example/recipes"))));
    }
    @Test void relevantProofAddsValueAndUnrelatedProofDoesNotDominate() {
        assertTrue(score(List.of(project("React authentication", "https://github.com/example/auth")))
                > score(List.of(project("React authentication", ""))));
        assertTrue(score(List.of(project("React authentication", ""))) > score(List.of()));
    }
    @Test void genericFrontendMentionDoesNotProveReact() {
        assertEquals(false, ReflectionTestUtils.invokeMethod(service, "hasScoringSkill", "frontend components", "React"));
        assertEquals(true, ReflectionTestUtils.invokeMethod(service, "hasScoringSkill", "react components", "React"));
    }
}
