import React from 'react';
import { BriefcaseBusiness, Code2, Home, LogOut, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

const roleIcon = {
  DEVELOPER: Code2,
  EMPLOYER: BriefcaseBusiness,
  ADMIN: ShieldCheck,
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const Icon = roleIcon[user.role] ?? Code2;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SS</div>
          <div>
            <strong>SkillSignal</strong>
            <span>Proof-based hiring</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <Link className="nav-item" to="/">
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link className="nav-item" to="/#search">
            <Search size={18} />
            <span>Search skills</span>
          </Link>
          <button className="nav-item active" type="button">
            <Icon size={18} />
            <span>{user.role.toLowerCase()} workspace</span>
          </button>
        </nav>

        <div className="account-panel">
          <span>{user.name}</span>
          <small>{user.email}</small>
          <button className="ghost-button" type="button" onClick={logout}>
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <main className="main-view">
        <header className="dashboard-topbar">
          <Link className="site-brand" to="/">
            <span className="brand-mark">SS</span>
            <strong>SkillSignal</strong>
          </Link>
          <nav className="site-nav" aria-label="Dashboard navigation">
            <Link to="/">Home</Link>
            <Link to="/#search">Search skills</Link>
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
