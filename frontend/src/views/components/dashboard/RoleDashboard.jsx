import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, CheckCircle2, Code2, Plus, Search, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../../api/client.js';
const roleConfig = {
  DEVELOPER: {
    title: 'Developer profile workspace',
    description: 'Advertise your skills with project proof so employers can find and trust your work.',
    endpoint: '/api/developer/profile',
    icon: Code2,
    actions: [
      'Add projects as your source of truth',
      'Attach skills to real evidence',
      'Show readiness for junior developer roles',
    ],
  },
  EMPLOYER: {
    title: 'Employer hiring workspace',
    description: 'Search for developers by skills or technical problems, then save candidates you want to contact.',
    endpoint: '/api/employer/search?problem=authentication',
    icon: BriefcaseBusiness,
    actions: [
      'Search public profiles by skill',
      'Review proof-backed match explanations',
      'Save candidates and request contact',
    ],
  },
  ADMIN: {
    title: 'Admin moderation',
    description: 'Keep SkillSignal trustworthy by reviewing profile evidence, contact requests, and platform quality.',
    endpoint: '/api/admin/moderation',
    icon: ShieldCheck,
    actions: [
      'Review suspicious project evidence',
      'Moderate contact requests',
      'Protect quality and trust across the marketplace',
    ],
  },
};
export default function RoleDashboard({ user, token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const config = roleConfig[user.role] ?? roleConfig.DEVELOPER;
  const Icon = config.icon;

  const apiPreview = useMemo(() => {
    if (!data) {
      return 'Loading secure role data...';
    }
    return JSON.stringify(data, null, 2);
  }, [data]);

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
        <Icon className="page-icon" size={44} />
      </header>

      <section className="dashboard-cards">
        <article className="workspace-panel">
          <h2>What this dashboard is for</h2>
          <ul className="feature-list">
            {config.actions.map((action) => (
              <li key={action}>
                <CheckCircle2 size={18} />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="workspace-panel">
          <h2>Quick actions</h2>
          {user.role === 'EMPLOYER' && (
            <div className="quick-search">
              <label htmlFor="dashboard-search">Find candidates by skill</label>
              <div className="search-box">
                <Search size={18} />
                <input
                  id="dashboard-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Python, SQL, Spring Boot"
                />
              </div>
              <Link className="primary-button" to="/#search">
                Search public profiles
              </Link>
            </div>
          )}
          {user.role === 'DEVELOPER' && (
            <div className="action-stack">
              <button className="primary-button" type="button">
                <Plus size={17} />
                <span>Create profile</span>
              </button>
              <p className="subtle">Next build step: save projects, skills, screenshots, GitHub links, and deployment links.</p>
            </div>
          )}
          {user.role === 'ADMIN' && (
            <div className="action-stack">
              <p className="info-message">
                Admin is for trust and safety: checking evidence quality, reviewing reports, and making sure employers see reliable developer proof.
              </p>
              <Link className="primary-button" to="/">
                View public marketplace
              </Link>
            </div>
          )}
        </article>

        <article className="workspace-panel wide-panel">
          <h2>Secure backend response</h2>
          {error && <p className="error">{error}</p>}
          <pre>{apiPreview}</pre>
        </article>
      </section>
    </section>
  );
}
