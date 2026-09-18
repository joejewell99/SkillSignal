import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

function websocketUrl() {
  const configuredApiUrl = import.meta.env.VITE_API_URL
    || (import.meta.env.DEV ? 'http://localhost:8080' : window.location.origin);
  if (configuredApiUrl) {
    const url = new URL(configuredApiUrl, window.location.origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = `${url.pathname.replace(/\/$/, '')}/ws`;
    return url.toString();
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export default function useMessagingRealtime({ token, onConversationUpdated, onConversationDeleted }) {
  const updatedRef = useRef(onConversationUpdated);
  const deletedRef = useRef(onConversationDeleted);

  useEffect(() => {
    updatedRef.current = onConversationUpdated;
    deletedRef.current = onConversationDeleted;
  }, [onConversationUpdated, onConversationDeleted]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const client = new Client({
      brokerURL: websocketUrl(),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        client.subscribe('/user/queue/messages', (frame) => {
          try {
            const event = JSON.parse(frame.body);
            if (event.type === 'CONVERSATION_UPDATED' && event.conversation) {
              updatedRef.current?.(event.conversation);
            }
            if (event.type === 'CONVERSATION_DELETED' && event.conversationId) {
              deletedRef.current?.(event.conversationId);
            }
          } catch {
            // Ignore malformed broker frames; the REST inbox remains authoritative.
          }
        });
      },
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [token]);
}
