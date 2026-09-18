package com.skillsignal.messaging.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "user_safety_relations", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_safety_owner_target", columnNames = {"owner_user_id", "target_user_id"})
})
public class UserSafetyRelation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerUserId;

    @Column(nullable = false)
    private Long targetUserId;

    @Column(nullable = false)
    private boolean blocked = false;

    protected UserSafetyRelation() {
    }

    public UserSafetyRelation(Long ownerUserId, Long targetUserId) {
        this.ownerUserId = ownerUserId;
        this.targetUserId = targetUserId;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public Long getTargetUserId() {
        return targetUserId;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }

}
