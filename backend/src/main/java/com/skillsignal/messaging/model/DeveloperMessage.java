package com.skillsignal.messaging.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "developer_messages")
public class DeveloperMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private DeveloperConversation conversation;

    @Column(nullable = false)
    private Long senderUserId;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected DeveloperMessage() {
    }

    public DeveloperMessage(DeveloperConversation conversation, Long senderUserId, String body) {
        this.conversation = conversation;
        this.senderUserId = senderUserId;
        this.body = body;
    }

    public Long getId() {
        return id;
    }

    public DeveloperConversation getConversation() {
        return conversation;
    }

    public Long getSenderUserId() {
        return senderUserId;
    }

    public String getBody() {
        return body;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
