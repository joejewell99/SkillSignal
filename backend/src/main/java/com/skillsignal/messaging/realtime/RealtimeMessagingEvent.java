package com.skillsignal.messaging.realtime;

public record RealtimeMessagingEvent(
        String type,
        Long conversationId,
        Long userId
) {
    public static RealtimeMessagingEvent conversationUpdated(Long conversationId, Long userId) {
        return new RealtimeMessagingEvent("CONVERSATION_UPDATED", conversationId, userId);
    }

    public static RealtimeMessagingEvent conversationDeleted(Long conversationId, Long userId) {
        return new RealtimeMessagingEvent("CONVERSATION_DELETED", conversationId, userId);
    }
}
