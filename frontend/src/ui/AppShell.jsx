import React from 'react';
import { BriefcaseBusiness, Code2, LogOut, ShieldCheck } from 'lucide-react';
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
          <div className="brand-mark">PS</div>
          <div>
            <strong>SkillSignal</strong>
            <span>Proof-based hiring</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
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
      <main className="main-view">{children}</main>
    </div>
  );
}
