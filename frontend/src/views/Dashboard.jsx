import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';

const roleConfig = {
  DEVELOPER: {
    title: 'Developer proof profile',
    description: 'Turn projects into evidence-backed skills and readiness signals.',
    endpoint: '/api/developer/profile',
  },
  EMPLOYER: {
    title: 'Employer candidate search',
    description: 'Search for candidates by problems they have proven they can solve.',
    endpoint: '/api/employer/search?problem=authentication',
  },
  ADMIN: {
    title: 'Admin moderation',
    description: 'Review evidence, contact requests, and platform quality signals.',
    endpoint: '/api/admin/moderation',
  },
};

export default function Dashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const config = roleConfig[user.role] ?? roleConfig.DEVELOPER;

  useEffect(() => {
    setError('');
    apiRequest(config.endpoint, { token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [config.endpoint, token]);

  return (
    <section className="dashboard">
      <header className="page-header">
        <div>
          <p className="eyebrow">{user.role}</p>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
      </header>

      <section className="work-grid">
        <article className="workspace-panel">
          <h2>Authenticated API response</h2>
          {error && <p className="error">{error}</p>}
          <pre>{data ? JSON.stringify(data, null, 2) : 'Loading...'}</pre>
        </article>

        <article className="workspace-panel">
          <h2>MVP build order</h2>
          <ol>
            <li>Developer profile and project CRUD</li>
            <li>Skills linked to project evidence</li>
            <li>Problem tags and employer search</li>
            <li>Saved candidates and contact requests</li>
            <li>Readiness scoring and AI profile suggestions</li>
          </ol>
        </article>
      </section>
    </section>
  );
}
