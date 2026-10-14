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
    MarketplaceProfileRepository profiles = mock(MarketplaceProfileRepository.class);
    UserSafetyRelationRepository safetyRelations = mock(UserSafetyRelationRepository.class);
    ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    UserMessagingService service = new UserMessagingService(conversations, messages,
            profiles, events, mock(MessagingRateLimiter.class), safetyRelations);
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
        service.reply(1L, 10L, "Reply", null, false, 20L);
        var captor = org.mockito.ArgumentCaptor.forClass(DeveloperMessage.class);
        verify(messages).save(captor.capture());
        assertThat(captor.getValue().getReplyToMessageId()).isEqualTo(20L);
        assertThat(captor.getValue().getBody()).isEqualTo("Reply");
    }
    @Test void replyRejectsOriginalFromDifferentConversation() {
        ReflectionTestUtils.setField(conversation, "id", 99L);
        assertThatThrownBy(() -> service.reply(1L, 10L, "Reply", null, false, 20L)).isInstanceOf(ResponseStatusException.class);
        verify(messages, never()).save(any(DeveloperMessage.class));
    }
    @Test void replyRejectsDeletedOriginal() {
        when(messages.findById(20L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.reply(1L, 10L, "Reply", null, false, 20L)).isInstanceOf(ResponseStatusException.class);
        verify(messages, never()).save(any(DeveloperMessage.class));
    }

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(booleans = {true, false})
    void hiddenProfileCanStartConversation(boolean receiverDisplayed) {
        MarketplaceProfile hiddenSender = MarketplaceProfile.forDeveloperUser(1L, "Hidden sender");
        hiddenSender.setDisplayed(false);
        MarketplaceProfile receiver = mock(MarketplaceProfile.class);
        when(receiver.getId()).thenReturn(22L);
        when(receiver.getUserId()).thenReturn(2L);
        when(receiver.getName()).thenReturn("Receiver");
        when(receiver.isDisplayed()).thenReturn(receiverDisplayed);
        when(profiles.findByUserId(1L)).thenReturn(Optional.of(hiddenSender));
        when(profiles.findById(22L)).thenReturn(Optional.of(receiver));
        when(conversations.findBetweenUsers(1L, 2L)).thenReturn(Optional.empty());
        when(conversations.save(any(DeveloperConversation.class))).thenAnswer(invocation -> {
            DeveloperConversation created = invocation.getArgument(0);
            ReflectionTestUtils.setField(created, "id", 10L);
            return created;
        });
        when(safetyRelations.findByOwnerUserIdAndTargetUserId(anyLong(), anyLong())).thenReturn(Optional.empty());

        service.sendMessage(1L, 22L, "Hello", null, false);

        verify(messages).save(any(DeveloperMessage.class));
    }

    @Test void profileWithoutAccountCannotReceiveMessages() {
        when(profiles.findByUserId(1L)).thenReturn(Optional.of(MarketplaceProfile.forDeveloperUser(1L, "Sender")));
        MarketplaceProfile unowned = mock(MarketplaceProfile.class);
        when(unowned.getUserId()).thenReturn(null);
        when(profiles.findById(22L)).thenReturn(Optional.of(unowned));

        assertThatThrownBy(() -> service.sendMessage(1L, 22L, "Hello", null, false))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("no account attached");
        verify(messages, never()).save(any(DeveloperMessage.class));
    }

    @Test void messagingAvailabilityDoesNotDependOnVisibility() {
        MarketplaceProfile hidden = MarketplaceProfile.forDeveloperUser(1L, "Hidden");
        hidden.setDisplayed(false);
        assertThat(com.skillsignal.marketplace.dto.ProfileResponse.from(hidden).acceptsMessages()).isTrue();
        ReflectionTestUtils.setField(hidden, "userId", null);
        assertThat(com.skillsignal.marketplace.dto.ProfileResponse.from(hidden).acceptsMessages()).isFalse();
    }
}
