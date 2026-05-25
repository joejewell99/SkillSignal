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

    @Column(nullable = false, columnDefinition = "text")
    private String image;

    @Column(nullable = false, columnDefinition = "text")
    private String projectsJson = "[]";

    @Column(unique = true)
    private Long userId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "marketplace_profile_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @OrderColumn(name = "skill_order")
    @Column(name = "skill", nullable = false)
    private List<String> skills = new ArrayList<>();

    @Column(nullable = false)
    private boolean featured;

    @Column(nullable = false)
    private boolean displayed = true;

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
        this.projectsJson = "[]";
        this.skills = new ArrayList<>(skills);
        this.featured = featured;
        this.displayed = true;
        this.displayOrder = displayOrder;
    }

    public static MarketplaceProfile forDeveloperUser(Long userId, String name) {
        MarketplaceProfile profile = new MarketplaceProfile(
                ProfileType.DEVELOPER,
                name,
                "Junior developer",
                "Project-backed developer profile.",
                "",
                List.of("React", "Spring Boot", "PostgreSQL"),
                false,
                1000
        );
        profile.userId = userId;
        profile.displayed = false;
        return profile;
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

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Long getUserId() {
        return userId;
    }

    public String getProjectsJson() {
        return projectsJson;
    }

    public void setProjectsJson(String projectsJson) {
        this.projectsJson = projectsJson == null || projectsJson.isBlank() ? "[]" : projectsJson;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = new ArrayList<>(skills);
    }

    public boolean isFeatured() {
        return featured;
    }

    public boolean isDisplayed() {
        return displayed;
    }

    public void setDisplayed(boolean displayed) {
        this.displayed = displayed;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }
}
