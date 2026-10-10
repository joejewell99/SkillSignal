package com.skillsignal.employer.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SavedCandidateRequest(@NotNull @Positive Long developerProfileId) {
}
