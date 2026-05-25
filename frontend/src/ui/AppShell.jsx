import React from 'react';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function AppShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <main className="main-view">
        <header className="dashboard-topbar">
          <Link className="site-brand" to="/">
            <span className="brand-mark">SS</span>
            <strong>SkillSignal</strong>
          </Link>
          <nav className="site-nav" aria-label="Dashboard navigation">
            <Link to="/">Home</Link>
            <Link to="/match">AI match</Link>
            <Link to="/profiles">Profiles</Link>
            <ThemeToggle />
            <button className="account-link" type="button" onClick={logout}>
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </nav>
        </header>
        {children}
      </main>
    </div>
  );
}
