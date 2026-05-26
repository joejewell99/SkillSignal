package com.skillsignal.proof.dto;

public record ProofSignalRequest(
        Long employerProfileId,
        String projectName,
        String note,
        String projectUrl
) {
}
