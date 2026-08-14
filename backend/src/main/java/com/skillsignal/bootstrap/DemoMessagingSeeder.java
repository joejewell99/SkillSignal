package com.skillsignal.bootstrap;

import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.messaging.model.DeveloperConversation;
import com.skillsignal.messaging.model.DeveloperMessage;
import com.skillsignal.messaging.repository.DeveloperConversationRepository;
import com.skillsignal.messaging.repository.DeveloperMessageRepository;
import com.skillsignal.user.repository.UserRepository;
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
        Optional<Long> maybeJoeUserId = userRepository.findByEmailIgnoreCase("joejewell99@hotmail.com").map(user -> user.getId());
        if (maybeJoeUserId.isEmpty()) {
            return;
        }

        MarketplaceProfile joeProfile = profileRepository.findByUserId(maybeJoeUserId.get()).orElse(null);
        MarketplaceProfile mayaProfile = findDeveloperProfileByName("Maya Clarke");
        MarketplaceProfile danielProfile = findDeveloperProfileByName("Daniel Rowe");

        if (joeProfile == null || mayaProfile == null || danielProfile == null) {
            return;
        }

        seedRequest(
                joeProfile,
                mayaProfile,
                "Hi Joe, I liked how practical your dashboard work feels. Would you be open to chatting about how you structured the React and Spring Boot split?"
        );
        seedRequest(
                joeProfile,
                danielProfile,
                "Hey Joe, your profile proof is strong. I wanted to ask how you approached the auth flow and whether you would be up for a quick developer chat."
        );
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

    private MarketplaceProfile findDeveloperProfileByName(String name) {
        return profileRepository.findAll().stream()
                .filter(profile -> profile.getUserId() != null)
                .filter(MarketplaceProfile::isDisplayed)
                .filter(profile -> name.equalsIgnoreCase(profile.getName()))
                .findFirst()
                .orElse(null);
    }
}
