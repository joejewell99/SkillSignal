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
import jakarta.persistence.Index;
import java.time.Instant;

@Entity
@Table(name = "developer_messages", indexes = {
        @Index(name = "idx_message_conversation_created", columnList = "conversation_id, created_at")
})
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

    @Column(columnDefinition = "text")
    private String imageUrl;

    @Column(nullable = false)
    private boolean imageSpoiler = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column
    private Long replyToMessageId;

    public Long getReplyToMessageId() { return replyToMessageId; }

    public void setReplyToMessageId(Long value) { replyToMessageId = value; }

    protected DeveloperMessage() {
    }

    public DeveloperMessage(DeveloperConversation conversation, Long senderUserId, String body, String imageUrl) {
        this.conversation = conversation;
        this.senderUserId = senderUserId;
        this.body = body;
        this.imageUrl = imageUrl;
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

    public void setBody(String body) {
        this.body = body;
    }

    public String getBody() {
        return body;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public boolean isImageSpoiler() { return imageSpoiler; }

    public void setImageSpoiler(boolean value) { imageSpoiler = value; }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
