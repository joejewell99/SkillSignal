import React from 'react';
import PublicHeader from './PublicHeader.jsx';

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="main-view">
        {children}
      </main>
    </div>
  );
}
