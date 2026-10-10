package com.skillsignal.marketplace.dto;

import jakarta.validation.constraints.Size;

public record ProfilePostResponse(
        @Size(max = 80) String id,
        @Size(max = 4000) String body,
        @Size(max = 80) String createdAt
) {
}
