package com.skillsignal.bootstrap;

import com.skillsignal.common.AccountEmailFormatter;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import com.skillsignal.messaging.model.DeveloperConversation;
import com.skillsignal.messaging.model.DeveloperMessage;
import com.skillsignal.messaging.model.ConversationStatus;
import com.skillsignal.messaging.repository.DeveloperConversationRepository;
import com.skillsignal.messaging.repository.DeveloperMessageRepository;
import com.skillsignal.user.model.Role;
import com.skillsignal.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Component
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
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

        seedReplyReadyFollowUp(joeProfile, requesterProfiles.get(0), "Thanks for being open to it. I would especially like to compare notes on the login flow and the small edge cases that made the UI feel dependable.");
        seedReplyReadyFollowUp(joeProfile, requesterProfiles.get(1), "I have been thinking about your authentication work. What was the first thing you tested once the protected routes were in place?");
        seedReplyReadyFollowUp(joeProfile, requesterProfiles.get(2), "Your explanation of project decisions stuck with me. If you have a moment, I would love to hear how you decide what belongs in the README versus the interface itself.");
        seedReplyReadyFollowUp(joeProfile, requesterProfiles.get(3), "I noticed you favour clear workflows over flashy ones. How do you decide when a dashboard needs another view versus a simpler filter or status summary?");
        seedReplyReadyFollowUp(joeProfile, requesterProfiles.get(4), "Your portfolio notes make the tradeoffs easy to follow. I am revisiting one of my projects this week and would value your view on what makes technical proof feel credible.");
        seedReplyReadyFollowUp(joeProfile, requesterProfiles.get(5), "I am working through protected route edge cases at the moment. Did you find any particular checks useful for keeping the authentication experience understandable for users?");
        seedUnreadMessages(joeProfile, requesterProfiles.get(0), List.of(
                "I have been mapping the login flow again and found a small edge case around expired sessions.",
                "Your dashboard approach made me think about keeping the next step visible instead of adding another modal.",
                "I am curious how you decide when validation should happen in the form versus at the API boundary.",
                "The project notes helped me see why documenting the tradeoff can be more useful than a longer feature list.",
                "I tried the protected-route flow with an expired token and the failure state still feels like the hardest part.",
                "Would you keep the error inline here, or use a short status message above the form?",
                "I also noticed that a small loading state can make a technical workflow feel much calmer.",
                "Your explanation of the database relationships made the data model much easier to follow.",
                "I am going to test the unhappy paths next and write down what a user should see at each stage.",
                "Thanks again, this has given me a clearer plan for the next version."
        ));
        seedUnreadMessages(joeProfile, requesterProfiles.get(1), List.of(
                "I tried your suggestion about keeping the route guard simple and it made the whole flow easier to reason about.",
                "One quick question: what would you test first before changing the authentication screen?"
        ));
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
            messageRepository.save(new DeveloperMessage(conversation, requesterProfile.getUserId(), body, null));
        }
    }

    private void seedReplyReadyFollowUp(MarketplaceProfile receiverProfile, MarketplaceProfile requesterProfile, String body) {
        DeveloperConversation conversation = conversationRepository
                .findBetweenUsers(receiverProfile.getUserId(), requesterProfile.getUserId())
                .orElseThrow();
        List<DeveloperMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        if (messages.stream().anyMatch(message -> body.equals(message.getBody()))) {
            return;
        }

        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setUpdatedAt(java.time.Instant.now());
        conversationRepository.save(conversation);
        messageRepository.save(new DeveloperMessage(conversation, requesterProfile.getUserId(), body, null));
    }

    private void seedUnreadMessages(MarketplaceProfile receiverProfile, MarketplaceProfile requesterProfile, List<String> bodies) {
        DeveloperConversation conversation = conversationRepository
                .findBetweenUsers(receiverProfile.getUserId(), requesterProfile.getUserId())
                .orElseThrow();
        List<DeveloperMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        if (bodies.stream().allMatch(body -> messages.stream().anyMatch(message -> body.equals(message.getBody())))) {
            return;
        }

        conversation.setStatus(ConversationStatus.ACTIVE);
        // Start a clean unread batch so the notification count matches the requested scenario.
        conversation.setReceiverReadAt(java.time.Instant.now());
        conversation.setUpdatedAt(java.time.Instant.now());
        conversationRepository.save(conversation);
        bodies.stream()
                .filter(body -> messages.stream().noneMatch(message -> body.equals(message.getBody())))
                .forEach(body -> messageRepository.save(new DeveloperMessage(conversation, requesterProfile.getUserId(), body, null)));
    }
}
