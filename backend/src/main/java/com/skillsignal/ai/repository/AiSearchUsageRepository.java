package com.skillsignal.ai.repository;

import com.skillsignal.ai.model.AiSearchUsage;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiSearchUsageRepository extends JpaRepository<AiSearchUsage, Long> {
    Optional<AiSearchUsage> findBySubjectTypeAndSubjectKeyAndUsageDate(
            String subjectType,
            String subjectKey,
            LocalDate usageDate
    );
}
