package com.skillsignal.messaging.service;

import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.messaging.dto.DeveloperConversationResponse;
import com.skillsignal.messaging.dto.DeveloperMessageResponse;
import com.skillsignal.messaging.dto.MessageParticipantResponse;
import com.skillsignal.messaging.model.ConversationStatus;
import com.skillsignal.messaging.model.DeveloperConversation;
import com.skillsignal.messaging.model.DeveloperMessage;
import com.skillsignal.messaging.model.UserSafetyRelation;
import com.skillsignal.messaging.repository.DeveloperConversationRepository;
import com.skillsignal.messaging.repository.DeveloperMessageRepository;
import com.skillsignal.messaging.repository.UserSafetyRelationRepository;
import com.skillsignal.messaging.realtime.RealtimeMessagingEvent;
import java.time.Instant;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserMessagingService {
    private final DeveloperConversationRepository conversationRepository;
    private final DeveloperMessageRepository messageRepository;
    private final MarketplaceProfileRepository profileRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final MessagingRateLimiter messagingRateLimiter;
    private final UserSafetyRelationRepository safetyRelationRepository;

    public UserMessagingService(
            DeveloperConversationRepository conversationRepository,
            DeveloperMessageRepository messageRepository,
            MarketplaceProfileRepository profileRepository,
            ApplicationEventPublisher eventPublisher,
            MessagingRateLimiter messagingRateLimiter,
            UserSafetyRelationRepository safetyRelationRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.profileRepository = profileRepository;
        this.eventPublisher = eventPublisher;
        this.messagingRateLimiter = messagingRateLimiter;
        this.safetyRelationRepository = safetyRelationRepository;
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
    public DeveloperConversationResponse sendMessage(Long senderUserId, Long receiverProfileId, String body, String imageUrl) {
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
        ensureUserPairMessagingAllowed(senderUserId, receiverProfile.getUserId());

        DeveloperConversation conversation = conversationRepository
                .findBetweenUsers(senderUserId, receiverProfile.getUserId())
                .orElseGet(() -> conversationRepository.save(new DeveloperConversation(
                        senderUserId,
                        receiverProfile.getUserId(),
                        senderProfile,
                        receiverProfile
                )));

        if (conversation.getRequesterUserId().equals(senderUserId) && conversation.getStatus() == ConversationStatus.REQUEST) {
            appendMessage(conversation, senderUserId, body, imageUrl);
            return toConversationResponse(conversation, senderUserId);
        }

        if (conversation.getReceiverUserId().equals(senderUserId) && conversation.getStatus() == ConversationStatus.REQUEST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accept this message request before replying.");
        }

        appendMessage(conversation, senderUserId, body, imageUrl);
        return toConversationResponse(conversation, senderUserId);
    }

    @Transactional
    public DeveloperConversationResponse reply(Long userId, Long conversationId, String body, String imageUrl) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        if (conversation.getStatus() == ConversationStatus.REQUEST && conversation.getReceiverUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accept this message request before replying.");
        }
        appendMessage(conversation, userId, body, imageUrl);
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
        DeveloperConversationResponse updated = toConversationResponse(conversationRepository.save(conversation), userId);
        publishConversationUpdate(conversation);
        return updated;
    }

    @Transactional
    public DeveloperConversationResponse toggleFavorite(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        if (conversation.getRequesterUserId().equals(userId)) {
            conversation.setRequesterFavorited(!conversation.isRequesterFavorited());
        } else if (conversation.getReceiverUserId().equals(userId)) {
            conversation.setReceiverFavorited(!conversation.isReceiverFavorited());
        }
        DeveloperConversationResponse updated = toConversationResponse(conversationRepository.save(conversation), userId);
        publishConversationUpdate(conversation);
        return updated;
    }

    @Transactional
    public DeveloperConversationResponse markRead(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        if (conversation.getRequesterUserId().equals(userId)) {
            conversation.setRequesterReadAt(Instant.now());
        } else {
            conversation.setReceiverReadAt(Instant.now());
        }
        DeveloperConversationResponse updated = toConversationResponse(conversationRepository.save(conversation), userId);
        eventPublisher.publishEvent(RealtimeMessagingEvent.conversationUpdated(conversation.getId(), userId));
        return updated;
    }

    @Transactional
    public DeveloperConversationResponse setBlocked(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        UserSafetyRelation relation = safetyRelationFor(conversation, userId);
        relation.setBlocked(true);
        safetyRelationRepository.save(relation);
        DeveloperConversationResponse updated = toConversationResponse(conversationRepository.save(conversation), userId);
        publishConversationUpdate(conversation);
        return updated;
    }

    @Transactional
    public DeveloperConversationResponse clearBlocked(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        UserSafetyRelation relation = safetyRelationFor(conversation, userId);
        relation.setBlocked(false);
        safetyRelationRepository.save(relation);
        if (conversation.getRequesterUserId().equals(userId)) {
            conversation.setRequesterBlockedUntil(null);
        } else {
            conversation.setReceiverBlockedUntil(null);
        }
        DeveloperConversationResponse updated = toConversationResponse(conversationRepository.save(conversation), userId);
        publishConversationUpdate(conversation);
        return updated;
    }

    @Transactional
    public DeveloperConversationResponse setMuted(Long userId, Long conversationId, Long durationSeconds) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        Instant mutedUntil = Instant.now().plusSeconds(durationSeconds);
        if (conversation.getRequesterUserId().equals(userId)) {
            conversation.setRequesterMutedUntil(mutedUntil);
        } else {
            conversation.setReceiverMutedUntil(mutedUntil);
        }
        DeveloperConversationResponse updated = toConversationResponse(conversationRepository.save(conversation), userId);
        publishConversationUpdate(conversation);
        return updated;
    }

    @Transactional
    public DeveloperConversationResponse clearMuted(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        if (conversation.getRequesterUserId().equals(userId)) {
            conversation.setRequesterMutedUntil(null);
        } else {
            conversation.setReceiverMutedUntil(null);
        }
        DeveloperConversationResponse updated = toConversationResponse(conversationRepository.save(conversation), userId);
        publishConversationUpdate(conversation);
        return updated;
    }

    @Transactional
    public void decline(Long userId, Long conversationId) {
        DeveloperConversation conversation = conversationForUser(userId, conversationId);
        if (!conversation.getReceiverUserId().equals(userId) || conversation.getStatus() != ConversationStatus.REQUEST) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Message request not found.");
        }
        if (isBlockedForViewer(conversation, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unblock this conversation before declining the request.");
        }
        eventPublisher.publishEvent(RealtimeMessagingEvent.conversationDeleted(conversation.getId(), conversation.getRequesterUserId()));
        messageRepository.deleteByConversationId(conversation.getId());
        conversationRepository.delete(conversation);
    }

    private void appendMessage(DeveloperConversation conversation, Long senderUserId, String body, String imageUrl) {
        String normalizedBody = normalizeBody(body, imageUrl);
        ensureMessagingAllowed(conversation, senderUserId);
        messagingRateLimiter.check(senderUserId);
        messageRepository.save(new DeveloperMessage(conversation, senderUserId, normalizedBody, normalizeImageUrl(imageUrl)));
        if (conversation.getRequesterUserId().equals(senderUserId)) {
            conversation.setRequesterReadAt(Instant.now());
        } else {
            conversation.setReceiverReadAt(Instant.now());
        }
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);
        publishConversationUpdate(conversation);
    }

    private void publishConversationUpdate(DeveloperConversation conversation) {
        eventPublisher.publishEvent(RealtimeMessagingEvent.conversationUpdated(
                conversation.getId(),
                conversation.getRequesterUserId()
        ));
        eventPublisher.publishEvent(RealtimeMessagingEvent.conversationUpdated(
                conversation.getId(),
                conversation.getReceiverUserId()
        ));
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
                        message.getImageUrl(),
                        message.getCreatedAt()
                ))
                .toList();
        String preview = messages.isEmpty() ? "" : messages.get(messages.size() - 1).body();
        int unreadCount = (int) messages.stream()
                .filter(message -> !message.senderUserId().equals(viewerUserId))
                .filter(message -> wasSentAfter(message.createdAt(), readAtFor(conversation, viewerUserId)))
                .count();

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
                messages,
                unreadCount > 0,
                unreadCount,
                isBlockedForViewer(conversation, viewerUserId),
                isMutedForViewer(conversation, viewerUserId),
                isBlockedByPartner(conversation, viewerUserId),
                isConversationMutedForViewer(conversation, viewerUserId)
            );
    }

    private void ensureMessagingAllowed(DeveloperConversation conversation, Long senderUserId) {
        if (isBlockedForViewer(conversation, senderUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You have blocked this conversation.");
        }
        if (isBlockedByPartner(conversation, senderUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This person has blocked messages from you.");
        }
    }

    private void ensureUserPairMessagingAllowed(Long senderUserId, Long receiverUserId) {
        if (relationIsBlocked(senderUserId, receiverUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You have blocked this person.");
        }
        if (relationIsBlocked(receiverUserId, senderUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This person has blocked messages from you.");
        }
    }

    private UserSafetyRelation safetyRelationFor(DeveloperConversation conversation, Long userId) {
        Long partnerUserId = partnerUserId(conversation, userId);
        return safetyRelationRepository.findByOwnerUserIdAndTargetUserId(userId, partnerUserId)
                .orElseGet(() -> new UserSafetyRelation(userId, partnerUserId));
    }

    private boolean isBlockedForViewer(DeveloperConversation conversation, Long userId) {
        Long partnerUserId = partnerUserId(conversation, userId);
        return relationIsBlocked(userId, partnerUserId) || isActive(blockedUntilFor(conversation, userId));
    }

    private boolean isBlockedByPartner(DeveloperConversation conversation, Long userId) {
        Long partnerUserId = partnerUserId(conversation, userId);
        return relationIsBlocked(partnerUserId, userId) || isActive(blockedUntilForPartner(conversation, userId));
    }

    private boolean isMutedForViewer(DeveloperConversation conversation, Long userId) {
        return isConversationMutedForViewer(conversation, userId);
    }

    private boolean isConversationMutedForViewer(DeveloperConversation conversation, Long userId) {
        return isActive(mutedUntilFor(conversation, userId));
    }

    private Long partnerUserId(DeveloperConversation conversation, Long userId) {
        return conversation.getRequesterUserId().equals(userId)
                ? conversation.getReceiverUserId()
                : conversation.getRequesterUserId();
    }

    private boolean relationIsBlocked(Long ownerUserId, Long targetUserId) {
        return safetyRelationRepository.findByOwnerUserIdAndTargetUserId(ownerUserId, targetUserId)
                .map(UserSafetyRelation::isBlocked)
                .orElse(false);
    }

    private Instant blockedUntilFor(DeveloperConversation conversation, Long userId) {
        return conversation.getRequesterUserId().equals(userId)
                ? conversation.getRequesterBlockedUntil()
                : conversation.getReceiverBlockedUntil();
    }

    private Instant blockedUntilForPartner(DeveloperConversation conversation, Long userId) {
        return conversation.getRequesterUserId().equals(userId)
                ? conversation.getReceiverBlockedUntil()
                : conversation.getRequesterBlockedUntil();
    }

    private Instant mutedUntilFor(DeveloperConversation conversation, Long userId) {
        return conversation.getRequesterUserId().equals(userId)
                ? conversation.getRequesterMutedUntil()
                : conversation.getReceiverMutedUntil();
    }

    private boolean isActive(Instant until) {
        return until != null && until.isAfter(Instant.now());
    }

    private Instant readAtFor(DeveloperConversation conversation, Long viewerUserId) {
        return conversation.getRequesterUserId().equals(viewerUserId)
                ? conversation.getRequesterReadAt()
                : conversation.getReceiverReadAt();
    }

    private boolean wasSentAfter(Instant createdAt, Instant readAt) {
        return readAt == null || createdAt.isAfter(readAt);
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

    private String normalizeBody(String body, String imageUrl) {
        String trimmed = body == null ? "" : body.trim();
        if (trimmed.isBlank() && normalizeImageUrl(imageUrl) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be blank.");
        }
        return trimmed;
    }

    private String normalizeImageUrl(String imageUrl) {
        String trimmed = imageUrl == null ? "" : imageUrl.trim();
        if (trimmed.isBlank()) {
            return null;
        }
        if (!trimmed.startsWith("data:image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image attachments are supported.");
        }
        return trimmed;
    }
}
