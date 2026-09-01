import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';
import { apiRequest } from '../api/client.js';

const PRESENCE_OPTIONS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'IDLE', label: 'Idle' },
  { value: 'DO_NOT_DISTURB', label: 'Do not disturb' },
  { value: 'INVISIBLE', label: 'Invisible' },
];

export default function PublicHeader() {
  const { user, token, logout, updateAuth } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isPresenceMenuOpen, setIsPresenceMenuOpen] = useState(false);
  const [attentionCount, setAttentionCount] = useState(0);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      setProfile(null);
      return undefined;
    }

    const endpoint = user.role === 'EMPLOYER' ? '/api/employer/profile' : '/api/developer/profile';
    let isCurrent = true;

    apiRequest(endpoint, { token })
      .then((nextProfile) => {
        if (isCurrent) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setProfile(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [token, user]);

  useEffect(() => {
    if (!user || !token) {
      setAttentionCount(0);
      return undefined;
    }
    const messageEndpoint = user.role === 'EMPLOYER' ? '/api/employer/messages' : '/api/developer/messages';
    const requestsEndpoint = user.role === 'DEVELOPER' ? '/api/developer/connections/requests' : null;
    let isCurrent = true;

    function refreshAttention() {
      Promise.all([apiRequest(messageEndpoint, { token }), requestsEndpoint ? apiRequest(requestsEndpoint, { token }) : Promise.resolve([])])
        .then(([threads, requests]) => {
          if (isCurrent) {
            const unreadMessages = threads.reduce((count, thread) => count + (thread.unreadCount ?? 0), 0);
            setAttentionCount(unreadMessages + requests.length);
          }
        })
        .catch(() => isCurrent && setAttentionCount(0));
    }

    refreshAttention();
    window.addEventListener('skillsignal:message-state-changed', refreshAttention);
    const intervalId = window.setInterval(refreshAttention, 30_000);
    return () => {
      isCurrent = false;
      window.removeEventListener('skillsignal:message-state-changed', refreshAttention);
      window.clearInterval(intervalId);
    };
  }, [token, user]);

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

  async function updatePresence(presence) {
    const nextAuth = await apiRequest('/api/auth/presence', { token, method: 'PATCH', body: JSON.stringify({ presence }) });
    updateAuth(nextAuth);
    setIsPresenceMenuOpen(false);
  }

  const currentPresence = PRESENCE_OPTIONS.find((option) => option.value === user?.presence) ?? PRESENCE_OPTIONS[0];

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
            <Link className="dashboard-link" to="/dashboard">Dashboard{attentionCount > 0 ? <strong className="dashboard-attention-count">{attentionCount > 99 ? '99+' : attentionCount}</strong> : null}</Link>
            <button
              className="account-avatar-link"
              type="button"
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="menu"
              aria-label="Open your account menu"
              onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
            >
              {profileImage ? <img className="account-avatar" src={profileImage} alt="Your profile" /> : <span className="account-avatar account-avatar-fallback" aria-hidden="true">{profileInitial}</span>}
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
