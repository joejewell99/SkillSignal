package com.skillsignal.messaging.model;

import com.skillsignal.marketplace.model.MarketplaceProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "developer_conversations")
public class DeveloperConversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long requesterUserId;

    @Column(nullable = false)
    private Long receiverUserId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_profile_id", nullable = false)
    private MarketplaceProfile requesterProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_profile_id", nullable = false)
    private MarketplaceProfile receiverProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConversationStatus status = ConversationStatus.REQUEST;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected DeveloperConversation() {
    }

    public DeveloperConversation(
            Long requesterUserId,
            Long receiverUserId,
            MarketplaceProfile requesterProfile,
            MarketplaceProfile receiverProfile
    ) {
        this.requesterUserId = requesterUserId;
        this.receiverUserId = receiverUserId;
        this.requesterProfile = requesterProfile;
        this.receiverProfile = receiverProfile;
    }

    public Long getId() {
        return id;
    }

    public Long getRequesterUserId() {
        return requesterUserId;
    }

    public Long getReceiverUserId() {
        return receiverUserId;
    }

    public MarketplaceProfile getRequesterProfile() {
        return requesterProfile;
    }

    public MarketplaceProfile getReceiverProfile() {
        return receiverProfile;
    }

    public ConversationStatus getStatus() {
        return status;
    }

    public void setStatus(ConversationStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
