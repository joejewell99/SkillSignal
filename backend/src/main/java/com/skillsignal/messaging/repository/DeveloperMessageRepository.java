package com.skillsignal.messaging.repository;

import com.skillsignal.messaging.model.DeveloperMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeveloperMessageRepository extends JpaRepository<DeveloperMessage, Long> {
    List<DeveloperMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    void deleteByConversationId(Long conversationId);
}
