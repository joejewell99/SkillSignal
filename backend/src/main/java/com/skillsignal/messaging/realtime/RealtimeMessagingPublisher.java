package com.skillsignal.messaging.realtime;

import com.skillsignal.messaging.service.UserMessagingService;
import com.skillsignal.user.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class RealtimeMessagingPublisher {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserMessagingService messagingService;
    private final UserRepository userRepository;

    public RealtimeMessagingPublisher(
            SimpMessagingTemplate messagingTemplate,
            UserMessagingService messagingService,
            UserRepository userRepository
    ) {
        this.messagingTemplate = messagingTemplate;
        this.messagingService = messagingService;
        this.userRepository = userRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishConversationUpdate(RealtimeMessagingEvent event) {
        if ("CONVERSATION_DELETED".equals(event.type())) {
            send(event.userId(), new RealtimeEnvelope(event.type(), event.conversationId(), null));
            return;
        }

        var conversation = messagingService.findConversation(event.userId(), event.conversationId());
        send(event.userId(), new RealtimeEnvelope(event.type(), event.conversationId(), conversation));
    }

    private void send(Long userId, RealtimeEnvelope envelope) {
        userRepository.findById(userId)
                .map(user -> user.getEmail())
                .ifPresent(username -> messagingTemplate.convertAndSendToUser(username, "/queue/messages", envelope));
    }

    public record RealtimeEnvelope(
            String type,
            Long conversationId,
            Object conversation
    ) {
    }
}
