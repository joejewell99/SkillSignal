package com.skillsignal.marketplace.dto;

import java.util.List;

public record ProfilePageResponse(
        List<ProfileResponse> profiles,
        int page,
        int pageSize,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
}
