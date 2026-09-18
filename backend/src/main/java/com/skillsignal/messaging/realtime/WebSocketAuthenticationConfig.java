package com.skillsignal.messaging.realtime;

import com.skillsignal.security.UserPrincipal;
import java.security.Principal;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
public class WebSocketAuthenticationConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                Principal principal = accessor.getUser();
                if (StompCommand.CONNECT.equals(accessor.getCommand())
                        && (!(principal instanceof Authentication authentication)
                        || !(authentication.getPrincipal() instanceof UserPrincipal))) {
                    throw new IllegalArgumentException("Authenticated WebSocket connection required.");
                }

                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())
                        && !"/user/queue/messages".equals(accessor.getDestination())) {
                    throw new IllegalArgumentException("Subscription destination is not allowed.");
                }

                if (StompCommand.SEND.equals(accessor.getCommand())) {
                    throw new IllegalArgumentException("Client message publishing is not allowed.");
                }
                return message;
            }
        });
    }
}
