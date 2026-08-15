package com.skillsignal.messaging.service;

import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.messaging.dto.DeveloperConversationResponse;
import com.skillsignal.messaging.dto.DeveloperMessageResponse;
import com.skillsignal.messaging.dto.MessageParticipantResponse;
import com.skillsignal.messaging.model.ConversationStatus;
import com.skillsignal.messaging.model.DeveloperConversation;
import com.skillsignal.messaging.model.DeveloperMessage;
import com.skillsignal.messaging.repository.DeveloperConversationRepository;
import com.skillsignal.messaging.repository.DeveloperMessageRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserMessagingService {
    private final DeveloperConversationRepository conversationRepository;
    private final DeveloperMessageRepository messageRepository;
    private final MarketplaceProfileRepository profileRepository;

    public UserMessagingService(
            DeveloperConversationRepository conversationRepository,
            DeveloperMessageRepository messageRepository,
            MarketplaceProfileRepository profileRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public List<DeveloperConversationResponse> findInbox(Long userId) {
        return conversationRepository.findForUser(userId).stream()
                .map(conversation -> toConversationResponse(conversation, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public DeveloperConversationResponse findConversation(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        return toConversationResponse(conversation, userId);
    }

    @Transactional
    public DeveloperConversationResponse sendMessage(Long senderUserId, Long receiverProfileId, String body) {
        MarketplaceProfile senderProfile = profileForUser(senderUserId);
        MarketplaceProfile receiverProfile = profileRepository.findById(receiverProfileId)
                .filter(MarketplaceProfile::isDisplayed)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found."));

        if (receiverProfile.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This user is not accepting messages yet.");
        }
        if (senderUserId.equals(receiverProfile.getUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot message yourself.");
        }

        DeveloperConversation conversation = conversationRepository
                .findBetweenUsers(senderUserId, receiverProfile.getUserId())
                .orElseGet(() -> conversationRepository.save(new DeveloperConversation(
                        senderUserId,
                        receiverProfile.getUserId(),
                        senderProfile,
                        receiverProfile
                )));

        if (conversation.getRequesterUserId().equals(senderUserId) && conversation.getStatus() == ConversationStatus.REQUEST) {
            appendMessage(conversation, senderUserId, body);
            return toConversationResponse(conversation, senderUserId);
        }

        if (conversation.getReceiverUserId().equals(senderUserId) && conversation.getStatus() == ConversationStatus.REQUEST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accept this message request before replying.");
        }

        appendMessage(conversation, senderUserId, body);
        return toConversationResponse(conversation, senderUserId);
    }

    @Transactional
    public DeveloperConversationResponse reply(Long userId, Long conversationId, String body) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        if (conversation.getStatus() == ConversationStatus.REQUEST && conversation.getReceiverUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accept this message request before replying.");
        }
        appendMessage(conversation, userId, body);
        return toConversationResponse(conversation, userId);
    }

    @Transactional
    public DeveloperConversationResponse accept(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        if (!conversation.getReceiverUserId().equals(userId) || conversation.getStatus() != ConversationStatus.REQUEST) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Message request not found.");
        }
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setUpdatedAt(Instant.now());
        return toConversationResponse(conversationRepository.save(conversation), userId);
    }

    @Transactional
    public DeveloperConversationResponse toggleFavorite(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        if (conversation.getRequesterUserId().equals(userId)) {
            conversation.setRequesterFavorited(!conversation.isRequesterFavorited());
        } else if (conversation.getReceiverUserId().equals(userId)) {
            conversation.setReceiverFavorited(!conversation.isReceiverFavorited());
        }
        return toConversationResponse(conversationRepository.save(conversation), userId);
    }

    @Transactional
    public void decline(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        if (!conversation.getReceiverUserId().equals(userId) || conversation.getStatus() != ConversationStatus.REQUEST) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Message request not found.");
        }
        messageRepository.deleteByConversationId(conversation.getId());
        conversationRepository.delete(conversation);
    }

    private void appendMessage(DeveloperConversation conversation, Long senderUserId, String body) {
        messageRepository.save(new DeveloperMessage(conversation, senderUserId, normalizeBody(body)));
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);
    }

    private DeveloperConversation conversationForUser(Long userId, Long conversationId) {
        return conversationRepository.findByIdForUser(conversationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found."));
    }

    private MarketplaceProfile profileForUser(Long userId) {
        return profileRepository.findByUserId(userId)
                .filter(MarketplaceProfile::isDisplayed)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Create your profile before messaging."));
    }

    private DeveloperConversationResponse toConversationResponse(DeveloperConversation conversation, Long viewerUserId) {
        MarketplaceProfile partnerProfile = conversation.getRequesterUserId().equals(viewerUserId)
                ? conversation.getReceiverProfile()
                : conversation.getRequesterProfile();
        List<DeveloperMessageResponse> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream()
                .map(message -> new DeveloperMessageResponse(
                        message.getId(),
                        message.getSenderUserId(),
                        resolveSenderName(conversation, message.getSenderUserId()),
                        message.getBody(),
                        message.getCreatedAt()
                ))
                .toList();
        String preview = messages.isEmpty() ? "" : messages.get(messages.size() - 1).body();

        return new DeveloperConversationResponse(
                conversation.getId(),
                conversation.getStatus().name(),
                conversation.getStatus() == ConversationStatus.ACTIVE || conversation.getRequesterUserId().equals(viewerUserId),
                conversation.getStatus() == ConversationStatus.REQUEST && conversation.getReceiverUserId().equals(viewerUserId),
                conversation.getRequesterUserId().equals(viewerUserId)
                        ? conversation.isRequesterFavorited()
                        : conversation.isReceiverFavorited(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt(),
                new MessageParticipantResponse(
                        partnerProfile.getUserId(),
                        partnerProfile.getId(),
                        partnerProfile.getName(),
                        partnerProfile.getTitle(),
                        partnerProfile.getImage()
                ),
                preview,
                messages
        );
    }

    private String resolveSenderName(DeveloperConversation conversation, Long senderUserId) {
        if (conversation.getRequesterUserId().equals(senderUserId)) {
            return conversation.getRequesterProfile().getName();
        }
        if (conversation.getReceiverUserId().equals(senderUserId)) {
            return conversation.getReceiverProfile().getName();
        }
        return "User";
    }

    private String normalizeBody(String body) {
        String trimmed = body == null ? "" : body.trim();
        if (trimmed.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be blank.");
        }
        return trimmed;
    }
}
