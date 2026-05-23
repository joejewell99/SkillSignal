package com.skillsignal.employer;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employer")
public class EmployerController {
    @GetMapping("/search")
    Map<String, Object> search(@RequestParam(defaultValue = "authentication") String problem) {
        return Map.of(
                "query", problem,
                "matches", List.of(
                        Map.of(
                                "candidate", "Example Junior Developer",
                                "explanation", "Matched because their project evidence includes Spring Security JWT auth and React protected routes.",
                                "proofTags", List.of("Spring Boot JWT auth", "React protected routes", "REST API integration")
                        )
                )
        );
    }
}
