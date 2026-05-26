package com.skillsignal.proof.model;

import com.skillsignal.marketplace.model.MarketplaceProfile;
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
@Table(name = "proof_signals")
public class ProofSignal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long developerUserId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "developer_profile_id")
    private MarketplaceProfile developerProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employer_profile_id")
    private MarketplaceProfile employerProfile;

    @Column(nullable = false, length = 160)
    private String projectName;

    @Column(nullable = false, length = 500)
    private String note;

    @Column(length = 600)
    private String projectUrl;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected ProofSignal() {
    }

    public ProofSignal(
            Long developerUserId,
            MarketplaceProfile developerProfile,
            MarketplaceProfile employerProfile,
            String projectName,
            String note,
            String projectUrl
    ) {
        this.developerUserId = developerUserId;
        this.developerProfile = developerProfile;
        this.employerProfile = employerProfile;
        this.projectName = projectName;
        this.note = note;
        this.projectUrl = projectUrl;
    }

    public Long getId() {
        return id;
    }

    public Long getDeveloperUserId() {
        return developerUserId;
    }

    public MarketplaceProfile getDeveloperProfile() {
        return developerProfile;
    }

    public MarketplaceProfile getEmployerProfile() {
        return employerProfile;
    }

    public String getProjectName() {
        return projectName;
    }

    public String getNote() {
        return note;
    }

    public String getProjectUrl() {
        return projectUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
