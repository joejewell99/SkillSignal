import React from 'react';
import PublicHeader from './PublicHeader.jsx';
import AuthStars from './AuthStars.jsx';

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <div className="dashboard-backdrop" aria-hidden="true"><AuthStars /></div>
      <PublicHeader />
      <main className="main-view">
        {children}
      </main>
    </div>
  );
}
