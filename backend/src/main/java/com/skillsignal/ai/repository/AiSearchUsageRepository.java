package com.skillsignal.ai.repository;

import com.skillsignal.ai.model.AiSearchUsage;
import java.time.LocalDate;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiSearchUsageRepository extends JpaRepository<AiSearchUsage, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AiSearchUsage> findBySubjectTypeAndSubjectKeyAndUsageDate(
            String subjectType,
            String subjectKey,
            LocalDate usageDate
    );

    void deleteBySubjectTypeAndSubjectKey(String subjectType, String subjectKey);
}
