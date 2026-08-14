package com.skillsignal.messaging.repository;

import com.skillsignal.messaging.model.DeveloperConversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeveloperConversationRepository extends JpaRepository<DeveloperConversation, Long> {
    @Query("""
            select conversation from DeveloperConversation conversation
            where (conversation.requesterUserId = :firstUserId and conversation.receiverUserId = :secondUserId)
               or (conversation.requesterUserId = :secondUserId and conversation.receiverUserId = :firstUserId)
            """)
    Optional<DeveloperConversation> findBetweenUsers(
            @Param("firstUserId") Long firstUserId,
            @Param("secondUserId") Long secondUserId
    );

    @Query("""
            select conversation from DeveloperConversation conversation
            where conversation.requesterUserId = :userId or conversation.receiverUserId = :userId
            order by conversation.updatedAt desc
            """)
    List<DeveloperConversation> findForUser(@Param("userId") Long userId);

    @Query("""
            select conversation from DeveloperConversation conversation
            where conversation.id = :conversationId
              and (conversation.requesterUserId = :userId or conversation.receiverUserId = :userId)
            """)
    Optional<DeveloperConversation> findByIdForUser(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId
    );
}
