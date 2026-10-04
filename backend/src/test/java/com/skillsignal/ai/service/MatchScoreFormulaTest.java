package com.skillsignal.ai.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class MatchScoreFormulaTest {
    @Test void relativeScoresPreserveOrderAndKeepWeakEvidenceSeparate() {
        assertEquals(94.9, MatchScoreFormula.relative(52.7, 52.7));
        assertTrue(MatchScoreFormula.relative(50, 52.7) < MatchScoreFormula.relative(52.7, 52.7));
        assertTrue(MatchScoreFormula.relative(50, 52.7) >= 70);
        assertEquals(70, MatchScoreFormula.relative(0, 0));
        assertEquals(99, MatchScoreFormula.relative(100, 100));
        assertEquals(MatchScoreFormula.relative(50, 52.7), MatchScoreFormula.relative(50, 52.7));
    }
    @Test void projectsDistinguishCandidatesWithTheSameSkills() {
        assertTrue(MatchScoreFormula.local(1, .9, .8, .8)
                > MatchScoreFormula.local(1, .3, .2, .8));
    }
    @Test void keywordOnlyProfileCannotReceiveHighScore() {
        assertEquals(36, MatchScoreFormula.local(.6, 0, 0, 1));
    }
    @Test void aiCannotReplaceEvidenceWithAnUnsubstantiatedHighScore() {
        assertEquals(55.2, MatchScoreFormula.enhanced(36, 100));
        assertEquals(84.5, MatchScoreFormula.enhanced(80, 95));
    }
    @Test void smallContextualDifferencesSurviveRounding() {
        assertEquals(92.9, MatchScoreFormula.enhanced(93, 92.8));
        assertEquals(93.1, MatchScoreFormula.enhanced(93, 93.4));
        assertTrue(MatchScoreFormula.enhanced(93, 93.4) > MatchScoreFormula.enhanced(93, 92.8));
    }
    @Test void boundsAndTiesAreHonest() {
        assertEquals(100, MatchScoreFormula.local(2, 2, 2, 2));
        assertEquals(0, MatchScoreFormula.local(-1, -1, -1, Double.NaN));
        assertEquals(50, MatchScoreFormula.local(.5, .5, .5, .5));
    }
}
