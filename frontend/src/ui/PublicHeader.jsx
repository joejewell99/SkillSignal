import React from 'react';
import { Link } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function PublicHeader() {
  const { user } = useAuth();

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
        <Link className="account-link" to={user ? '/dashboard' : '/login'}>
          <UserCircle size={18} />
          <span>{user ? 'Dashboard' : 'Sign in'}</span>
        </Link>
      </nav>
    </header>
  );
}
