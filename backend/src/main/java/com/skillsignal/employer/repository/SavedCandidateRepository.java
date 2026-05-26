package com.skillsignal.employer.repository;

import com.skillsignal.employer.model.SavedCandidate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedCandidateRepository extends JpaRepository<SavedCandidate, Long> {
    List<SavedCandidate> findByEmployerUserIdOrderByCreatedAtDesc(Long employerUserId);

    Optional<SavedCandidate> findByEmployerUserIdAndDeveloperProfileId(Long employerUserId, Long developerProfileId);
}
