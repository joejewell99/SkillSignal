package com.skillsignal.ai;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiMatchController {
    private final MockAiMatchService matchService;

    public AiMatchController(MockAiMatchService matchService) {
        this.matchService = matchService;
    }

    @PostMapping("/matches")
    AiMatchResponse matchDevelopers(@Valid @RequestBody AiMatchRequest request) {
        return matchService.matchDevelopers(request.brief());
    }
}
