package com.skillsignal.messaging.repository;

import com.skillsignal.messaging.model.UserSafetyRelation;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSafetyRelationRepository extends JpaRepository<UserSafetyRelation, Long> {
    Optional<UserSafetyRelation> findByOwnerUserIdAndTargetUserId(Long ownerUserId, Long targetUserId);

    void deleteByOwnerUserIdOrTargetUserId(Long ownerUserId, Long targetUserId);
}
