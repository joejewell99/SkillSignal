package com.skillsignal.employer.model;

import com.skillsignal.marketplace.model.MarketplaceProfile;
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
@Table(name = "saved_candidates")
public class SavedCandidate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employerUserId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "developer_profile_id")
    private MarketplaceProfile developerProfile;

    private Instant createdAt = Instant.now();

    protected SavedCandidate() {
    }

    public SavedCandidate(Long employerUserId, MarketplaceProfile developerProfile) {
        this.employerUserId = employerUserId;
        this.developerProfile = developerProfile;
    }

    public Long getId() {
        return id;
    }

    public Long getEmployerUserId() {
        return employerUserId;
    }

    public MarketplaceProfile getDeveloperProfile() {
        return developerProfile;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
