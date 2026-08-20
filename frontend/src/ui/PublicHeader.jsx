import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Settings, UserCircle } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';
import { apiRequest } from '../api/client.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function PublicHeader() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
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
    function closeAccountMenu(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }

    function closeAccountMenuOnEscape(event) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
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
        <ThemeToggle />
        {user ? (
          <div className="account-cluster" ref={accountMenuRef}>
            <Link className="dashboard-link" to="/dashboard">Dashboard</Link>
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
                <button className="account-menu-settings" type="button" role="menuitem" onClick={() => setIsAccountMenuOpen(false)}>
                  <UserCircle size={16} />
                  <span>Account</span>
                </button>
                <button className="account-menu-settings" type="button" role="menuitem" onClick={() => setIsAccountMenuOpen(false)}>
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
