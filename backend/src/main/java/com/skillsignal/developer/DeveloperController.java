package com.skillsignal.developer;

import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/developer")
public class DeveloperController {
    @GetMapping("/profile")
    Map<String, Object> profile(Authentication authentication) {
        return Map.of(
                "message", "Developer profile workspace",
                "user", authentication.getName(),
                "sourceOfTruth", "Projects",
                "nextSteps", List.of(
                        "Create DeveloperProfile entity",
                        "Add Project and Skill models",
                        "Link skills to evidence inside projects",
                        "Calculate readiness from project proof"
                )
        );
    }
}
