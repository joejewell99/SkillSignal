import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, LayoutDashboard, LogOut, Settings, X } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';
import { apiRequest } from '../api/client.js';

const PRESENCE_OPTIONS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'IDLE', label: 'Idle' },
  { value: 'DO_NOT_DISTURB', label: 'Do not disturb' },
  { value: 'INVISIBLE', label: 'Invisible' },
];
const NOTIFICATION_PREFERENCES_KEY = 'skillsignal.settings';

function attentionCountCacheKey(user) {
  return user?.email ? `skillsignal.header-attention-count.${user.email}` : '';
}

function readCachedAttentionCount(user) {
  const cacheKey = attentionCountCacheKey(user);
  if (!cacheKey) {
    return 0;
  }
  try {
    const count = JSON.parse(localStorage.getItem(cacheKey) ?? '0');
    return Number.isInteger(count) && count >= 0 ? count : 0;
  } catch {
    return 0;
  }
}

function cacheAttentionCount(user, count) {
  const cacheKey = attentionCountCacheKey(user);
  if (!cacheKey) {
    return;
  }
  try {
    localStorage.setItem(cacheKey, JSON.stringify(count));
  } catch {
    // Keep the current in-memory value if browser storage is unavailable.
  }
}

function notificationCacheKey(user) {
  return user?.email ? `skillsignal.header-notifications.${user.email}` : '';
}

function readCachedNotifications(user) {
  const cacheKey = notificationCacheKey(user);
  if (!cacheKey) {
    return [];
  }
  try {
    const notifications = JSON.parse(localStorage.getItem(cacheKey) ?? '[]');
    return Array.isArray(notifications) ? notifications.filter((notification) => notification?.id && notification?.title).slice(0, 100) : [];
  } catch {
    return [];
  }
}

function cacheNotifications(user, notifications) {
  const cacheKey = notificationCacheKey(user);
  if (!cacheKey) {
    return;
  }
  try {
    localStorage.setItem(cacheKey, JSON.stringify(notifications.slice(0, 100)));
  } catch {
    // Keep the current in-memory notifications if browser storage is unavailable.
  }
}

function acceptedConnectionNotificationCacheKey(user) {
  return user?.email ? `skillsignal.accepted-connection-notifications.${user.email}` : '';
}

function readAcceptedConnectionNotifications(user) {
  const cacheKey = acceptedConnectionNotificationCacheKey(user);
  if (!cacheKey) {
    return [];
  }
  try {
    const notifications = JSON.parse(localStorage.getItem(cacheKey) ?? '[]');
    return Array.isArray(notifications) ? notifications.filter((notification) => notification?.id && notification?.title).slice(0, 100) : [];
  } catch {
    return [];
  }
}

function cacheAcceptedConnectionNotifications(user, notifications) {
  const cacheKey = acceptedConnectionNotificationCacheKey(user);
  if (!cacheKey) {
    return;
  }
  try {
    localStorage.setItem(cacheKey, JSON.stringify(notifications.slice(0, 100)));
  } catch {
    // Keep acceptance alerts for the current session if browser storage is unavailable.
  }
}

function dismissedNotificationCacheKey(user) {
  return user?.email ? `skillsignal.dismissed-notifications.${user.email}` : '';
}

function readDismissedNotificationIds(user) {
  const cacheKey = dismissedNotificationCacheKey(user);
  if (!cacheKey) {
    return [];
  }
  try {
    const ids = JSON.parse(localStorage.getItem(cacheKey) ?? '[]');
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string').slice(-100) : [];
  } catch {
    return [];
  }
}

function cacheDismissedNotificationIds(user, ids) {
  const cacheKey = dismissedNotificationCacheKey(user);
  if (!cacheKey) {
    return;
  }
  try {
    localStorage.setItem(cacheKey, JSON.stringify(ids.slice(-100)));
  } catch {
    // Dismissing remains available for the current session if storage is unavailable.
  }
}

function headerProfileCacheKey(user) {
  return user?.email ? `skillsignal.header-profile.${user.email}` : '';
}

function readCachedHeaderProfile(user) {
  const cacheKey = headerProfileCacheKey(user);
  if (!cacheKey) {
    return null;
  }
  try {
    return JSON.parse(localStorage.getItem(cacheKey) ?? 'null');
  } catch {
    return null;
  }
}

function cacheHeaderProfile(user, profile) {
  const cacheKey = headerProfileCacheKey(user);
  if (!cacheKey || !profile) {
    return;
  }
  try {
    localStorage.setItem(cacheKey, JSON.stringify(profile));
  } catch {
    // The network response remains usable even if browser storage is unavailable.
  }
}

function readNotificationPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFICATION_PREFERENCES_KEY) ?? '{}');
    return {
      messages: true,
      messageRequests: true,
      connectionRequests: stored.connections ?? true,
      connectionAccepted: true,
      ...stored,
    };
  } catch {
    return { messages: true, messageRequests: true, connectionRequests: true, connectionAccepted: true };
  }
}

function findNewAcceptedConnections(connections, email) {
  const storageKey = `skillsignal.seen-accepted-connections.${email}`;
  const currentIds = connections.map((connection) => String(connection.id));
  try {
    const seenIds = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(seenIds)) {
      localStorage.setItem(storageKey, JSON.stringify(currentIds));
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return connections.filter((connection) => {
        const acceptedAt = new Date(connection.respondedAt ?? connection.createdAt).getTime();
        return !Number.isNaN(acceptedAt) && acceptedAt >= oneDayAgo;
      });
    }
    const newConnections = connections.filter((connection) => !seenIds.includes(String(connection.id)));
    localStorage.setItem(storageKey, JSON.stringify(currentIds));
    return newConnections;
  } catch {
    return [];
  }
}

function otherConnectionName(connection, user) {
  return connection.requesterName === user?.name ? connection.receiverName : connection.requesterName;
}

function otherConnectionProfileId(connection, user) {
  return connection.requesterName === user?.name ? connection.receiverProfileId : connection.requesterProfileId;
}

function messageDashboardHref(user, threadId) {
  const section = user?.role === 'EMPLOYER' ? 'proof' : 'inbox';
  return `/dashboard?section=${section}&thread=${encodeURIComponent(threadId)}`;
}

function notificationPreview(value) {
  const preview = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!preview) {
    return 'Open the conversation to read it.';
  }
  return preview.length > 90 ? `${preview.slice(0, 87).trimEnd()}...` : preview;
}

export default function PublicHeader() {
  const { user, token, logout, updateAuth } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => readCachedHeaderProfile(user));
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isPresenceMenuOpen, setIsPresenceMenuOpen] = useState(false);
  const [selectedPresence, setSelectedPresence] = useState(user?.presence ?? 'ONLINE');
  const [attentionCount, setAttentionCount] = useState(() => readCachedAttentionCount(user));
  const [notifications, setNotifications] = useState(() => readCachedNotifications(user));
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const accountMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const notificationAudioRef = useRef(null);
  const previousAttentionCountRef = useRef(null);
  const isRefreshingAttentionRef = useRef(false);
  const dismissedNotificationIdsRef = useRef(readDismissedNotificationIds(user));
  const notificationCloseTimerRef = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      setProfile(null);
      return undefined;
    }

    const endpoint = user.role === 'EMPLOYER' ? '/api/employer/profile' : '/api/developer/profile';
    const cachedProfile = readCachedHeaderProfile(user);
    setProfile(cachedProfile);
    let isCurrent = true;

    apiRequest(endpoint, { token })
      .then((nextProfile) => {
        if (isCurrent) {
          cacheHeaderProfile(user, nextProfile);
          setProfile(nextProfile);
        }
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [token, user]);

  useEffect(() => {
    setSelectedPresence(user?.presence ?? 'ONLINE');
  }, [user?.presence]);

  useEffect(() => {
    function updateCachedProfile(event) {
      if (event.detail?.email !== user?.email || !event.detail.profile) {
        return;
      }
      cacheHeaderProfile(user, event.detail.profile);
      setProfile(event.detail.profile);
    }

    window.addEventListener('skillsignal:profile-updated', updateCachedProfile);
    return () => window.removeEventListener('skillsignal:profile-updated', updateCachedProfile);
  }, [user]);

  useEffect(() => {
    if (!user || !token) {
      setAttentionCount(0);
      setNotifications([]);
      return undefined;
    }
    dismissedNotificationIdsRef.current = readDismissedNotificationIds(user);
    setNotifications(readCachedNotifications(user));
    setAttentionCount(readCachedAttentionCount(user));
    if (selectedPresence === 'DO_NOT_DISTURB') {
      setAttentionCount(0);
      return undefined;
    }
    const messageEndpoint = user.role === 'EMPLOYER' ? '/api/employer/messages' : '/api/developer/messages';
    const requestsEndpoint = user.role === 'DEVELOPER' ? '/api/developer/connections/requests' : null;
    const connectionsEndpoint = user.role === 'DEVELOPER' ? '/api/developer/connections' : null;
    let isCurrent = true;

    function refreshAttention() {
      if (isRefreshingAttentionRef.current) {
        return;
      }
      isRefreshingAttentionRef.current = true;
      Promise.all([
        apiRequest(messageEndpoint, { token }),
        requestsEndpoint ? apiRequest(requestsEndpoint, { token }) : Promise.resolve([]),
        connectionsEndpoint ? apiRequest(connectionsEndpoint, { token }) : Promise.resolve([]),
      ])
        .then(([threads, requests, connections]) => {
          if (isCurrent) {
            const preferences = readNotificationPreferences();
            const unreadThreads = threads.filter((thread) => !thread.requestReceived && thread.unreadCount > 0);
            const pendingMessageRequests = threads.filter((thread) => thread.requestReceived && !thread.accepted);
            const newlyAcceptedConnections = findNewAcceptedConnections(connections, user.email);
            const cachedAcceptedConnectionNotifications = readAcceptedConnectionNotifications(user).map((notification) => {
              const connectionId = notification.id.replace('connection-accepted-', '');
              const connection = connections.find((item) => String(item.id) === connectionId);
              if (!connection) {
                return notification;
              }
              return {
                ...notification,
                title: `${otherConnectionName(connection, user) ?? 'A developer'} accepted your connection`,
                detail: 'View their profile or clear this update when you are ready.',
                href: `/profiles/${otherConnectionProfileId(connection, user)}`,
              };
            });
            const acceptedConnectionNotifications = [
              ...cachedAcceptedConnectionNotifications,
              ...newlyAcceptedConnections.map((connection) => ({
                id: `connection-accepted-${connection.id}`,
                type: 'connection-accepted',
                count: 1,
                title: `${otherConnectionName(connection, user) ?? 'A developer'} accepted your connection`,
                detail: 'View their profile or clear this update when you are ready.',
                href: `/profiles/${otherConnectionProfileId(connection, user)}`,
              })),
            ].filter((notification, index, collection) => (
              collection.findIndex((candidate) => candidate.id === notification.id) === index
            )).filter((notification) => !dismissedNotificationIdsRef.current.includes(notification.id));
            cacheAcceptedConnectionNotifications(user, acceptedConnectionNotifications);
            const allNotifications = [
              ...(preferences.messages ? unreadThreads.map((thread) => ({
                id: `message-${thread.id}-${thread.updatedAt ?? thread.unreadCount}`,
                type: 'message',
                threadId: thread.id,
                count: thread.unreadCount,
                title: `${thread.partner?.name ?? 'Someone'} sent ${thread.unreadCount} new message${thread.unreadCount === 1 ? '' : 's'}`,
                detail: notificationPreview(thread.preview),
                href: messageDashboardHref(user, thread.id),
              })) : []),
              ...(preferences.messageRequests ? pendingMessageRequests.map((thread) => ({
                id: `message-request-${thread.id}`,
                type: 'message-request',
                count: 1,
                title: `${thread.partner?.name ?? 'Someone'} sent you a message request`,
                detail: notificationPreview(thread.preview),
                href: messageDashboardHref(user, thread.id),
              })) : []),
              ...(preferences.connectionRequests ? requests.map((connection) => ({
                id: `connection-request-${connection.id}`,
                type: 'connection-request',
                count: 1,
                title: `${connection.requesterName ?? 'Someone'} wants to connect`,
                detail: 'Review their connection request.',
                href: '/dashboard?section=connections',
              })) : []),
              ...(preferences.connectionAccepted ? acceptedConnectionNotifications : []),
            ];
            const visibleNotifications = allNotifications.filter((notification) => !dismissedNotificationIdsRef.current.includes(notification.id));
            const nextAttentionCount = visibleNotifications.reduce((count, notification) => count + notification.count, 0);
            cacheAttentionCount(user, nextAttentionCount);
            cacheNotifications(user, visibleNotifications);
            setAttentionCount(nextAttentionCount);
            setNotifications(visibleNotifications);
          }
        })
        .catch(() => {})
        .finally(() => {
          isRefreshingAttentionRef.current = false;
        });
    }

    refreshAttention();
    window.addEventListener('skillsignal:message-state-changed', refreshAttention);
    window.addEventListener('skillsignal:notification-preferences-changed', refreshAttention);
    const intervalId = window.setInterval(refreshAttention, 60_000);
    return () => {
      isCurrent = false;
      window.removeEventListener('skillsignal:message-state-changed', refreshAttention);
      window.removeEventListener('skillsignal:notification-preferences-changed', refreshAttention);
      window.clearInterval(intervalId);
    };
  }, [selectedPresence, token, user]);

  useEffect(() => {
    const previousCount = previousAttentionCountRef.current;
    previousAttentionCountRef.current = attentionCount;
    if (selectedPresence !== 'ONLINE' || previousCount === null || attentionCount <= previousCount) {
      return;
    }
    const audioContext = notificationAudioRef.current;
    if (!audioContext || audioContext.state !== 'running') {
      return;
    }
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 680;
    gain.gain.setValueAtTime(0.018, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
  }, [attentionCount, selectedPresence]);

  useEffect(() => {
    function closeMenus(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
        setIsPresenceMenuOpen(false);
      }
      if (!notificationMenuRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    function closeMenusOnEscape(event) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
        setIsPresenceMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeMenus);
    document.addEventListener('keydown', closeMenusOnEscape);
    return () => {
      window.clearTimeout(notificationCloseTimerRef.current);
      document.removeEventListener('mousedown', closeMenus);
      document.removeEventListener('keydown', closeMenusOnEscape);
    };
  }, []);

  const profileImage = profile?.image || profile?.photo;
  const profileInitial = (user?.name || profile?.name || user?.email || '?').slice(0, 1).toUpperCase();

  function prepareNotificationSound() {
    if (selectedPresence === 'DO_NOT_DISTURB') {
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    if (!notificationAudioRef.current) {
      notificationAudioRef.current = new AudioContext();
    }
    if (notificationAudioRef.current.state === 'suspended') {
      notificationAudioRef.current.resume().catch(() => {});
    }
  }

  function dismissNotifications(notificationIds) {
    const nextDismissedIds = [...new Set([...dismissedNotificationIdsRef.current, ...notificationIds])].slice(-100);
    dismissedNotificationIdsRef.current = nextDismissedIds;
    cacheDismissedNotificationIds(user, nextDismissedIds);
    cacheAcceptedConnectionNotifications(
      user,
      readAcceptedConnectionNotifications(user).filter((notification) => !notificationIds.includes(notification.id))
    );
    const nextNotifications = notifications.filter((notification) => !notificationIds.includes(notification.id));
    cacheNotifications(user, nextNotifications);
    setNotifications(nextNotifications);
    const removedCount = notifications
      .filter((notification) => notificationIds.includes(notification.id))
      .reduce((count, notification) => count + notification.count, 0);
    const nextAttentionCount = Math.max(0, attentionCount - removedCount);
    cacheAttentionCount(user, nextAttentionCount);
    setAttentionCount(nextAttentionCount);
  }

  async function openNotification(event, notification) {
    event.preventDefault();
    if (isUpdatingNotifications) {
      return;
    }
    setIsUpdatingNotifications(true);
    try {
      if (notification.type === 'message') {
        const messageEndpoint = user.role === 'EMPLOYER' ? '/api/employer/messages' : '/api/developer/messages';
        await apiRequest(`${messageEndpoint}/${notification.threadId}/read`, { token, method: 'PATCH' });
      }
      dismissNotifications([notification.id]);
      window.dispatchEvent(new Event('skillsignal:message-state-changed'));
      setIsNotificationsOpen(false);
      navigate(notification.href);
    } catch {
      // Leave the notification in place if marking the underlying message as read fails.
    } finally {
      setIsUpdatingNotifications(false);
    }
  }

  function clearAllNotifications() {
    dismissNotifications(notifications.map((notification) => notification.id));
  }

  function keepNotificationsOpen() {
    window.clearTimeout(notificationCloseTimerRef.current);
    setIsNotificationsOpen(true);
  }

  function closeNotificationsAfterPointerLeaves() {
    window.clearTimeout(notificationCloseTimerRef.current);
    notificationCloseTimerRef.current = window.setTimeout(() => setIsNotificationsOpen(false), 180);
  }

  async function updatePresence(presence) {
    const previousPresence = selectedPresence;
    setSelectedPresence(presence);
    setIsPresenceMenuOpen(false);
    try {
      const nextAuth = await apiRequest('/api/auth/presence', { token, method: 'PATCH', body: JSON.stringify({ presence }) });
      updateAuth(nextAuth);
    } catch {
      setSelectedPresence(previousPresence);
    }
  }

  const currentPresence = PRESENCE_OPTIONS.find((option) => option.value === selectedPresence) ?? PRESENCE_OPTIONS[0];

  return (
    <header className="site-header">
      <Link className="site-brand" to="/">
        <span className="brand-mark">SS</span>
        <strong>SkillSignal</strong>
      </Link>

      <nav className="site-nav" aria-label="Primary navigation">
        <Link to="/">Home</Link>
        <Link to="/match">AI match</Link>
        <Link to="/profiles">Profiles</Link>
        {user ? (
          <>
            <div
              className="header-notifications"
              ref={notificationMenuRef}
              onMouseEnter={keepNotificationsOpen}
              onMouseLeave={closeNotificationsAfterPointerLeaves}
            >
              <button
                className="header-notifications-trigger"
                type="button"
                aria-label={`Open notifications${attentionCount > 0 ? `, ${attentionCount} unread` : ''}`}
                aria-expanded={isNotificationsOpen}
                aria-haspopup="dialog"
                onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
              >
                <Bell size={24} aria-hidden="true" />
                {attentionCount > 0 ? <strong className="header-message-count">{attentionCount > 99 ? '99+' : attentionCount}</strong> : null}
              </button>
              {isNotificationsOpen ? (
                <section className="header-notifications-panel" role="dialog" aria-label="Notifications">
                  <div className="header-notifications-heading">
                    <strong>Notifications</strong>
                    {attentionCount > 0 ? <span>{attentionCount > 99 ? '99+' : attentionCount} new</span> : null}
                  </div>
                  {notifications.length > 0 ? (
                    <div className="header-notifications-actions">
                      <button type="button" onClick={clearAllNotifications} disabled={isUpdatingNotifications}>Clear all</button>
                    </div>
                  ) : null}
                  {notifications.length > 0 ? (
                    <div className="header-notifications-list">
                      {notifications.slice(0, 6).map((notification) => (
                        <article className="header-notification-item" key={notification.id}>
                          <Link to={notification.href} onClick={(event) => openNotification(event, notification)}>
                            <strong>{notification.title}</strong>
                            <span>{notification.detail}</span>
                          </Link>
                          <button className="header-notification-dismiss" type="button" onClick={() => dismissNotifications([notification.id])} aria-label={`Clear notification: ${notification.title}`}>
                            <X size={14} aria-hidden="true" />
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="header-notifications-empty">You are all caught up.</p>
                  )}
                  <Link className="header-notifications-all" to={user.role === 'EMPLOYER' ? '/dashboard?section=proof' : '/dashboard?section=inbox'} onClick={() => setIsNotificationsOpen(false)}>
                    View all messages
                  </Link>
                </section>
              ) : null}
            </div>
            <div className="account-cluster" ref={accountMenuRef}>
            <button
              className={`account-avatar-link presence-ring ${currentPresence.value.toLowerCase().replaceAll('_', '-')}`}
              type="button"
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="menu"
              aria-label="Open your account menu"
              onClick={() => {
                prepareNotificationSound();
                setIsAccountMenuOpen((isOpen) => !isOpen);
              }}
              >
                {profileImage ? <img className="account-avatar" src={profileImage} alt="Your profile" decoding="sync" fetchPriority="high" /> : <span className="account-avatar account-avatar-fallback" aria-hidden="true">{profileInitial}</span>}
              </button>
            {isAccountMenuOpen ? (
              <div className="account-menu" role="menu">
                <div className="presence-menu" aria-label="Set your presence">
                  <button className="presence-menu-current" type="button" onClick={() => setIsPresenceMenuOpen((open) => !open)}>
                    <i className={`presence-dot ${currentPresence.value.toLowerCase().replaceAll('_', '-')}`} aria-hidden="true" />
                    <span>{currentPresence.label}</span>
                    <ChevronRight size={15} />
                  </button>
                  {isPresenceMenuOpen ? (
                    <div className="presence-menu-options">
                      {PRESENCE_OPTIONS.map((option) => (
                        <button className={option.value === currentPresence.value ? 'presence-menu-option active' : 'presence-menu-option'} type="button" key={option.value} onClick={() => updatePresence(option.value)}>
                          <i className={`presence-dot ${option.value.toLowerCase().replaceAll('_', '-')}`} aria-hidden="true" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  className="account-menu-settings account-menu-dashboard"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    navigate('/dashboard');
                  }}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                  {attentionCount > 0 ? <strong className="dashboard-attention-count account-menu-attention-count">{attentionCount > 99 ? '99+' : attentionCount}</strong> : null}
                </button>
                <button
                  className="account-menu-settings"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    navigate('/settings');
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button className="account-menu-signout" type="button" role="menuitem" onClick={logout}>
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            ) : null}
            </div>
          </>
        ) : (
          <Link className="dashboard-link" to="/login">
            <span>Log in</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
