package com.skillsignal.messaging.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ConversationRestrictionRequest(
        @NotNull
        @Min(value = 60, message = "Restriction duration must be at least 1 minute")
        @Max(value = 604800, message = "Restriction duration cannot exceed 7 days")
        Long durationSeconds
) {
}
