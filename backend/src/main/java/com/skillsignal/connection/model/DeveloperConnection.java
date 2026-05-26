package com.skillsignal.connection.model;

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
@Table(name = "developer_connections")
public class DeveloperConnection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long requesterUserId;

    @Column(nullable = false)
    private Long receiverUserId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_profile_id")
    private MarketplaceProfile requesterProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_profile_id")
    private MarketplaceProfile receiverProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConnectionStatus status = ConnectionStatus.PENDING;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant respondedAt;

    protected DeveloperConnection() {
    }

    public DeveloperConnection(
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

    public ConnectionStatus getStatus() {
        return status;
    }

    public void setStatus(ConnectionStatus status) {
        this.status = status;
        this.respondedAt = Instant.now();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getRespondedAt() {
        return respondedAt;
    }
}
