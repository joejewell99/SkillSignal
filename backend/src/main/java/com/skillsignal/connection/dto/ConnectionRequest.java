package com.skillsignal.connection.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ConnectionRequest(@NotNull @Positive Long receiverProfileId) {
}
