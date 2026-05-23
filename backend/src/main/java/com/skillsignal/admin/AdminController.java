package com.skillsignal.admin;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @GetMapping("/moderation")
    Map<String, Object> moderationQueue() {
        return Map.of(
                "message", "Admin moderation dashboard",
                "queue", List.of(
                        Map.of("type", "PROJECT_EVIDENCE", "status", "PENDING_REVIEW"),
                        Map.of("type", "CONTACT_REQUEST", "status", "PENDING_REVIEW")
                )
        );
    }
}
