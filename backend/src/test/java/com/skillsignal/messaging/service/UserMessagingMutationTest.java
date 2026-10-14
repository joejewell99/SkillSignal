package com.skillsignal.messaging.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.skillsignal.messaging.model.*;
import com.skillsignal.messaging.repository.*;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

class UserMessagingMutationTest {
    DeveloperConversationRepository conversations = mock(DeveloperConversationRepository.class);
    DeveloperMessageRepository messages = mock(DeveloperMessageRepository.class);
    ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    UserMessagingService service = new UserMessagingService(conversations, messages,
            mock(MarketplaceProfileRepository.class), events, mock(MessagingRateLimiter.class),
            mock(UserSafetyRelationRepository.class));
    DeveloperConversation conversation;
    DeveloperMessage message;

    @BeforeEach void setup() {
        conversation = new DeveloperConversation(1L, 2L, mock(MarketplaceProfile.class), mock(MarketplaceProfile.class));
        ReflectionTestUtils.setField(conversation, "id", 10L);
        message = new DeveloperMessage(conversation, 1L, "Original", "data:image/png;base64,abc");
        when(conversations.findByIdForUser(10L, 1L)).thenReturn(Optional.of(conversation));
        when(conversations.findByIdForUser(10L, 2L)).thenReturn(Optional.of(conversation));
        when(messages.findById(20L)).thenReturn(Optional.of(message));
        when(messages.findByConversationIdOrderByCreatedAtAsc(10L)).thenReturn(List.of(message));
    }
    @Test void editsOwnMessageAndKeepsImageAndTimestamp() {
        var created = message.getCreatedAt();
        service.editMessage(1L, 10L, 20L, " Updated ");
        assertThat(message.getBody()).isEqualTo("Updated");
        assertThat(message.getImageUrl()).isEqualTo("data:image/png;base64,abc");
        assertThat(message.getCreatedAt()).isEqualTo(created);
        verify(messages).saveAndFlush(message);
        verify(events, times(2)).publishEvent(any(Object.class));
    }
    @Test void cannotEditOrDeletePartnersMessage() {
        assertThatThrownBy(() -> service.editMessage(2L, 10L, 20L, "Changed")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.deleteMessage(2L, 10L, 20L)).isInstanceOf(ResponseStatusException.class);
        verify(messages, never()).delete(any(DeveloperMessage.class));
        assertThat(message.getBody()).isEqualTo("Original");
    }
    @Test void cannotMutateOutsideConversation() {
        ReflectionTestUtils.setField(conversation, "id", 99L);
        assertThatThrownBy(() -> service.editMessage(1L, 10L, 20L, "Changed")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.deleteMessage(1L, 10L, 20L)).isInstanceOf(ResponseStatusException.class);
    }
    @Test void outsiderCannotDeleteMessage() {
        assertThatThrownBy(() -> service.deleteMessage(3L, 10L, 20L)).isInstanceOf(ResponseStatusException.class);
        verify(messages, never()).delete(any(DeveloperMessage.class));
    }
    @Test void deletesOwnMessageAndNotifiesBothParticipants() {
        service.deleteMessage(1L, 10L, 20L);
        verify(messages).delete(message);
        verify(messages).flush();
        verify(events, times(2)).publishEvent(any(Object.class));
    }
    @Test void rejectsBlankTextWithoutImageAndOversizedEdits() {
        message = new DeveloperMessage(conversation, 1L, "Original", null);
        when(messages.findById(20L)).thenReturn(Optional.of(message));
        assertThatThrownBy(() -> service.editMessage(1L, 10L, 20L, " ")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.editMessage(1L, 10L, 20L, "x".repeat(1001))).isInstanceOf(ResponseStatusException.class);
        assertThat(message.getBody()).isEqualTo("Original");
    }
    @Test void replyStoresReferenceToOriginalMessage() {
        service.reply(1L, 10L, "Reply", null, 20L);
        var captor = org.mockito.ArgumentCaptor.forClass(DeveloperMessage.class);
        verify(messages).save(captor.capture());
        assertThat(captor.getValue().getReplyToMessageId()).isEqualTo(20L);
        assertThat(captor.getValue().getBody()).isEqualTo("Reply");
    }
    @Test void replyRejectsOriginalFromDifferentConversation() {
        ReflectionTestUtils.setField(conversation, "id", 99L);
        assertThatThrownBy(() -> service.reply(1L, 10L, "Reply", null, 20L)).isInstanceOf(ResponseStatusException.class);
        verify(messages, never()).save(any(DeveloperMessage.class));
    }
    @Test void replyRejectsDeletedOriginal() {
        when(messages.findById(20L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.reply(1L, 10L, "Reply", null, 20L)).isInstanceOf(ResponseStatusException.class);
        verify(messages, never()).save(any(DeveloperMessage.class));
    }
}
