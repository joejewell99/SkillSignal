package com.skillsignal.ai.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BriefAnalysisServiceTest {
    private final BriefAnalysisService service = new BriefAnalysisService();

    @Test
    void rejectsRepeatedCharacterSpam() {
        BriefAnalysis analysis = service.analyze("saddadadadadadadadadadadad d d d d");

        assertThat(analysis.rejected()).isTrue();
        assertThat(analysis.quality()).isEqualTo("INVALID_BRIEF");
        assertThat(analysis.rejectionReason()).contains("technical or work-related");
    }

    @Test
    void rejectsLongSignalFreeTextInsteadOfInventingMatches() {
        BriefAnalysis analysis = service.analyze("hello there this is just some random words with no useful context");

        assertThat(analysis.rejected()).isTrue();
    }

    @Test
    void keepsTechnicalBriefsInTheDetailFlow() {
        BriefAnalysis analysis = service.analyze("Need a developer for an API project with clear requirements");

        assertThat(analysis.rejected()).isFalse();
        assertThat(analysis.quality()).isEqualTo("NEEDS_MORE_DETAIL");
    }
}
