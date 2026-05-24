package com.skillsignal.marketplace;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "marketplace_profiles")
public class MarketplaceProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProfileType type;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 800)
    private String summary;

    @Column(nullable = false)
    private String image;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "marketplace_profile_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @OrderColumn(name = "skill_order")
    @Column(name = "skill", nullable = false)
    private List<String> skills = new ArrayList<>();

    @Column(nullable = false)
    private boolean featured;

    @Column(nullable = false)
    private int displayOrder;

    protected MarketplaceProfile() {
    }

    public MarketplaceProfile(
            ProfileType type,
            String name,
            String title,
            String summary,
            String image,
            List<String> skills,
            boolean featured,
            int displayOrder
    ) {
        this.type = type;
        this.name = name;
        this.title = title;
        this.summary = summary;
        this.image = image;
        this.skills = new ArrayList<>(skills);
        this.featured = featured;
        this.displayOrder = displayOrder;
    }

    public Long getId() {
        return id;
    }

    public ProfileType getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }

    public String getImage() {
        return image;
    }

    public List<String> getSkills() {
        return skills;
    }

    public boolean isFeatured() {
        return featured;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }
}

