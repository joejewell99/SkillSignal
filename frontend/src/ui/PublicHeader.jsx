import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';
import { apiRequest } from '../api/client.js';

const PRESENCE_OPTIONS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'IDLE', label: 'Idle' },
  { value: 'DO_NOT_DISTURB', label: 'Do not disturb' },
  { value: 'INVISIBLE', label: 'Invisible' },
];
const NOTIFICATION_PREFERENCES_KEY = 'skillsignal.settings';

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

function countNewAcceptedConnections(connections, email) {
  const storageKey = `skillsignal.seen-accepted-connections.${email}`;
  const currentIds = connections.map((connection) => String(connection.id));
  try {
    const seenIds = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(seenIds)) {
      localStorage.setItem(storageKey, JSON.stringify(currentIds));
      return 0;
    }
    const newCount = currentIds.filter((id) => !seenIds.includes(id)).length;
    localStorage.setItem(storageKey, JSON.stringify(currentIds));
    return newCount;
  } catch {
    localStorage.setItem(storageKey, JSON.stringify(currentIds));
    return 0;
  }
}

export default function PublicHeader() {
  const { user, token, logout, updateAuth } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => readCachedHeaderProfile(user));
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isPresenceMenuOpen, setIsPresenceMenuOpen] = useState(false);
  const [selectedPresence, setSelectedPresence] = useState(user?.presence ?? 'ONLINE');
  const [attentionCount, setAttentionCount] = useState(0);
  const accountMenuRef = useRef(null);
  const notificationAudioRef = useRef(null);
  const previousAttentionCountRef = useRef(null);
  const isRefreshingAttentionRef = useRef(false);

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
      return undefined;
    }
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
            const unreadMessages = preferences.messages
              ? threads.filter((thread) => !thread.requestReceived).reduce((count, thread) => count + (thread.unreadCount ?? 0), 0)
              : 0;
            const messageRequests = preferences.messageRequests
              ? threads.filter((thread) => thread.requestReceived && !thread.accepted).length
              : 0;
            const connectionRequests = preferences.connectionRequests ? requests.length : 0;
            const newlyAcceptedConnections = countNewAcceptedConnections(connections, user.email);
            const acceptedConnections = preferences.connectionAccepted ? newlyAcceptedConnections : 0;
            setAttentionCount(unreadMessages + messageRequests + connectionRequests + acceptedConnections);
          }
        })
        .catch(() => isCurrent && setAttentionCount(0))
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
    function closeAccountMenu(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
        setIsPresenceMenuOpen(false);
      }
    }

    function closeAccountMenuOnEscape(event) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
        setIsPresenceMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', closeAccountMenu);
    document.addEventListener('keydown', closeAccountMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeAccountMenu);
      document.removeEventListener('keydown', closeAccountMenuOnEscape);
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
                {attentionCount > 0 ? <strong className="account-notification-count">{attentionCount > 99 ? '99+' : attentionCount}</strong> : null}
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
        ) : (
          <Link className="dashboard-link" to="/login">
            <span>Log in</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
