package com.skillsignal.ai.controller;

import com.skillsignal.ai.dto.AiMatchRequest;
import com.skillsignal.ai.dto.AiMatchResponse;
import com.skillsignal.ai.service.DeveloperMatchingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiMatchController {
    private final DeveloperMatchingService matchService;

    public AiMatchController(DeveloperMatchingService matchService) {
        this.matchService = matchService;
    }

    @PostMapping("/matches")
    AiMatchResponse matchDevelopers(
            @Valid @RequestBody AiMatchRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        return matchService.matchDevelopers(request.brief(), authentication, servletRequest);
    }
}
