package com.skillsignal.proof.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record ProofSignalRequest(
        @NotNull @Positive Long employerProfileId,
        @NotBlank @Size(max = 160) String projectName,
        @NotBlank @Size(max = 2000) String note,
        @Size(max = 2048) @Pattern(regexp = "^$|https?://.*", message = "Project link must use HTTP or HTTPS") String projectUrl
) {
}
