import React, { useEffect, useRef, useState } from 'react';
import { Eye, ShieldBan, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { apiRequest } from '../../../api/client.js';

const DURATIONS = [
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '24 hours' },
  { value: 604800, label: '7 days' },
];

export default function ConversationContextMenu({ menu, endpoint, token, onClose, onError, onThreadUpdated, onViewProfile }) {
  const [isBusy, setIsBusy] = useState(false);
  const menuRef = useRef(null);
  const thread = menu?.thread;

  useEffect(() => {
    if (!menu) {
      return undefined;
    }

    function closeOnPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        onClose();
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', closeOnPointerDown);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnPointerDown);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menu, onClose]);

  if (!menu || !thread) {
    return null;
  }

  const partner = thread.partner;
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - 260));
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - 300));

  async function updateRestriction(type, enabled, durationSeconds = null) {
    setIsBusy(true);
    try {
      const updatedThread = await apiRequest(`${endpoint}/${thread.id}/${type}`, {
        token,
        method: enabled ? 'PATCH' : 'DELETE',
        ...(enabled && durationSeconds ? { body: JSON.stringify({ durationSeconds }) } : {}),
      });
      onThreadUpdated(updatedThread);
      onClose();
      window.dispatchEvent(new Event('skillsignal:message-state-changed'));
    } catch (error) {
      onError(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div ref={menuRef} className="conversation-context-menu" style={{ left, top }} role="menu" aria-label={`Actions for ${partner?.name ?? 'contact'}`}>
      <button type="button" role="menuitem" onClick={() => { onClose(); onViewProfile(partner?.profileId); }} disabled={isBusy}>
        <Eye size={15} aria-hidden="true" />
        <span>View profile</span>
      </button>
      <div className="conversation-context-menu-divider" />
      <p>Mute conversation</p>
      {thread.conversationMuted ? (
        <button type="button" role="menuitem" onClick={() => updateRestriction('mute', false)} disabled={isBusy}>
          <Volume2 size={15} aria-hidden="true" />
          <span>Unmute now</span>
        </button>
      ) : DURATIONS.map((duration) => (
        <button key={`conversation-${duration.value}`} type="button" role="menuitem" onClick={() => updateRestriction('mute', true, duration.value)} disabled={isBusy}>
          <VolumeX size={15} aria-hidden="true" />
          <span>For {duration.label}</span>
        </button>
      ))}
      <div className="conversation-context-menu-divider" />
      <button className={thread.blocked ? 'danger' : ''} type="button" role="menuitem" onClick={() => updateRestriction('block', !thread.blocked)} disabled={isBusy}>
        {thread.blocked ? <ShieldCheck size={15} aria-hidden="true" /> : <ShieldBan size={15} aria-hidden="true" />}
        <span>{thread.blocked ? 'Unblock person' : 'Block person'}</span>
      </button>
    </div>
  );
}
