package com.skillsignal.proof.repository;

import com.skillsignal.proof.model.ProofSignal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProofSignalRepository extends JpaRepository<ProofSignal, Long> {
    List<ProofSignal> findByDeveloperUserIdOrderByCreatedAtDesc(Long developerUserId);

    List<ProofSignal> findByEmployerProfileUserIdOrderByCreatedAtDesc(Long employerUserId);
}
