package com.skillsignal.marketplace.repository;

import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.model.ProfileType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MarketplaceProfileRepository extends JpaRepository<MarketplaceProfile, Long> {
    List<MarketplaceProfile> findAllByOrderByDisplayOrderAsc();

    Page<MarketplaceProfile> findByDisplayedTrueOrderByDisplayOrderAsc(Pageable pageable);

    Page<MarketplaceProfile> findByDisplayedTrueAndTypeOrderByDisplayOrderAsc(ProfileType type, Pageable pageable);

    Optional<MarketplaceProfile> findByUserId(Long userId);

    long countByDisplayedTrue();

    long countByTypeAndDisplayedTrue(ProfileType type);
}
