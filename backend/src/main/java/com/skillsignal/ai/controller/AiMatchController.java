package com.skillsignal.ai.controller;

import com.skillsignal.ai.dto.AiMatchRequest;
import com.skillsignal.ai.dto.AiMatchResponse;
import com.skillsignal.ai.dto.CandidateRundownRequest;
import com.skillsignal.ai.dto.CandidateRundownResponse;
import com.skillsignal.ai.service.CandidateRundownService;
import com.skillsignal.ai.service.DeveloperMatchingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiMatchController {
    private final DeveloperMatchingService matchService;
    private final CandidateRundownService rundownService;

    public AiMatchController(DeveloperMatchingService matchService, CandidateRundownService rundownService) {
        this.matchService = matchService;
        this.rundownService = rundownService;
    }

    @PostMapping("/rundown")
    CandidateRundownResponse rundown(@Valid @RequestBody CandidateRundownRequest request,
            Authentication authentication, HttpServletRequest servletRequest) {
        return rundownService.generate(request.profileId(), request.brief(), authentication, servletRequest);
    }

    @PostMapping("/matches")
    AiMatchResponse matchDevelopers(
            @Valid @RequestBody AiMatchRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        return matchService.matchDevelopers(request.brief(), request.mode(), authentication, servletRequest);
    }

    @GetMapping("/matches/{searchId}")
    AiMatchResponse getMatchSearch(
            @PathVariable String searchId,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        return matchService.getMatchSearch(searchId, authentication, servletRequest);
    }
}
