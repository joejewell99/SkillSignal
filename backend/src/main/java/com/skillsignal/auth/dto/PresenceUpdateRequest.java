package com.skillsignal.auth.dto;

import com.skillsignal.user.model.PresenceStatus;
import jakarta.validation.constraints.NotNull;

public record PresenceUpdateRequest(@NotNull PresenceStatus presence) {
}
