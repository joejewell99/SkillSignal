package com.skillsignal.bootstrap;

import com.skillsignal.common.AccountEmailFormatter;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.messaging.model.DeveloperConversation;
import com.skillsignal.messaging.model.DeveloperMessage;
import com.skillsignal.messaging.repository.DeveloperConversationRepository;
import com.skillsignal.messaging.repository.DeveloperMessageRepository;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(25)
public class DemoMessagingSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final MarketplaceProfileRepository profileRepository;
    private final DeveloperConversationRepository conversationRepository;
    private final DeveloperMessageRepository messageRepository;

    public DemoMessagingSeeder(
            UserRepository userRepository,
            MarketplaceProfileRepository profileRepository,
            DeveloperConversationRepository conversationRepository,
            DeveloperMessageRepository messageRepository
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @Override
    public void run(String... args) {
        Optional<Long> maybeJoeUserId = userRepository.findByEmailIgnoreCase(AccountEmailFormatter.canonicalEmail("joe", Role.DEVELOPER))
                .or(() -> userRepository.findByEmailIgnoreCase("joejewell99@hotmail.com"))
                .map(user -> user.getId());
        if (maybeJoeUserId.isEmpty()) {
            return;
        }

        MarketplaceProfile joeProfile = profileRepository.findByUserId(maybeJoeUserId.get()).orElse(null);
        List<MarketplaceProfile> requesterProfiles = profileRepository.findAll().stream()
                .filter(profile -> profile.getUserId() != null)
                .filter(MarketplaceProfile::isDisplayed)
                .filter(profile -> !profile.getUserId().equals(maybeJoeUserId.get()))
                .sorted(java.util.Comparator.comparingInt(MarketplaceProfile::getDisplayOrder))
                .limit(7)
                .toList();

        if (joeProfile == null || requesterProfiles.size() < 7) {
            return;
        }

        List<String> openingMessages = List.of(
                "Hi Joe, I liked how practical your dashboard work feels. Would you be open to chatting about how you structured the React and Spring Boot split?",
                "Hey Joe, your profile proof is strong. I wanted to ask how you approached the auth flow and whether you would be up for a quick developer chat.",
                "Hi Joe, I saw the way you explained your project decisions and it felt very clear. I would love to hear how you decide what proof matters most on a portfolio piece.",
                "Hey Joe, your backend and frontend work looks thoughtfully connected. Would you be up for comparing how you handle auth, routing, and state without making the UI feel heavy?",
                "Hi Joe, I liked that your projects feel grounded in real workflows instead of generic demos. I wanted to ask how you choose which tradeoffs to write up for reviewers.",
                "Hey Joe, your dashboard work feels calm in a good way. I am trying to get better at that too and wondered if you would be open to a quick developer chat sometime.",
                "Hi Joe, I came across your profile while looking through other junior developers. Your proof reads clearly, and I would love to swap notes on how you present project thinking."
        );

        for (int index = 0; index < openingMessages.size(); index += 1) {
            seedRequest(joeProfile, requesterProfiles.get(index), openingMessages.get(index));
        }
    }

    private void seedRequest(MarketplaceProfile receiverProfile, MarketplaceProfile requesterProfile, String body) {
        if (receiverProfile.getUserId() == null || requesterProfile.getUserId() == null) {
            return;
        }

        DeveloperConversation conversation = conversationRepository
                .findBetweenUsers(receiverProfile.getUserId(), requesterProfile.getUserId())
                .orElseGet(() -> conversationRepository.save(new DeveloperConversation(
                        requesterProfile.getUserId(),
                        receiverProfile.getUserId(),
                        requesterProfile,
                        receiverProfile
                )));

        if (messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).isEmpty()) {
            messageRepository.save(new DeveloperMessage(conversation, requesterProfile.getUserId(), body));
        }
    }
}
