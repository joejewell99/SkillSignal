package com.skillsignal.messaging.controller;

import com.skillsignal.messaging.dto.DeveloperConversationResponse;
import com.skillsignal.messaging.dto.ReplyDeveloperMessageRequest;
import com.skillsignal.messaging.dto.SendDeveloperMessageRequest;
import com.skillsignal.messaging.service.DeveloperMessagingService;
import com.skillsignal.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/developer/messages")
public class DeveloperMessagingController {
    private final DeveloperMessagingService messagingService;

    public DeveloperMessagingController(DeveloperMessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @GetMapping
    List<DeveloperConversationResponse> inbox(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return messagingService.findInbox(principal.id());
    }

    @GetMapping("/{id}")
    DeveloperConversationResponse conversation(@PathVariable Long id, Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return messagingService.findConversation(principal.id(), id);
    }

    @PostMapping
    DeveloperConversationResponse sendMessage(
            @Valid @RequestBody SendDeveloperMessageRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return messagingService.sendMessage(principal.id(), request.receiverProfileId(), request.body());
    }

    @PostMapping("/{id}/reply")
    DeveloperConversationResponse reply(
            @PathVariable Long id,
            @Valid @RequestBody ReplyDeveloperMessageRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return messagingService.reply(principal.id(), id, request.body());
    }

    @PatchMapping("/{id}/accept")
    DeveloperConversationResponse accept(@PathVariable Long id, Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return messagingService.accept(principal.id(), id);
    }

    @DeleteMapping("/{id}")
    void decline(@PathVariable Long id, Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        messagingService.decline(principal.id(), id);
    }
}
