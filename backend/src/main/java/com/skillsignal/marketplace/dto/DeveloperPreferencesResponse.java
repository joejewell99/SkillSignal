package com.skillsignal.marketplace.dto;

import java.util.List;

public record DeveloperPreferencesResponse(
        String availability,
        List<String> workTypes,
        String remotePreference
) {
}
