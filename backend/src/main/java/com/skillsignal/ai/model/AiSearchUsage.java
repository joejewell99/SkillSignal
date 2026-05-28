package com.skillsignal.ai.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;

@Entity
@Table(
        name = "ai_search_usage",
        uniqueConstraints = @UniqueConstraint(columnNames = {"subject_type", "subject_key", "usage_date"})
)
public class AiSearchUsage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subject_type", nullable = false)
    private String subjectType;

    @Column(name = "subject_key", nullable = false)
    private String subjectKey;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(nullable = false)
    private int searchCount;

    protected AiSearchUsage() {
    }

    public AiSearchUsage(String subjectType, String subjectKey, LocalDate usageDate) {
        this.subjectType = subjectType;
        this.subjectKey = subjectKey;
        this.usageDate = usageDate;
        this.searchCount = 0;
    }

    public int getSearchCount() {
        return searchCount;
    }

    public void increment() {
        this.searchCount += 1;
    }
}
