package com.skillsignal.marketplace;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketplaceProfileRepository extends JpaRepository<MarketplaceProfile, Long> {
    List<MarketplaceProfile> findAllByOrderByDisplayOrderAsc();
}

