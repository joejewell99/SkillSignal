import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserCircle } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';

const developers = [
  {
    name: 'Maya Patel',
    role: 'Junior Backend Developer',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    skills: ['Python', 'SQL', 'Spring Boot', 'REST APIs'],
    proof: 'Built an API dashboard with PostgreSQL reporting and JWT auth.',
  },
  {
    name: 'Daniel Okafor',
    role: 'Full-stack Developer',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    skills: ['React', 'Spring Boot', 'PostgreSQL', 'Docker'],
    proof: 'Shipped protected React routes backed by Spring Security endpoints.',
  },
  {
    name: 'Sofia Nguyen',
    role: 'Data-focused Developer',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    skills: ['Python', 'SQL', 'Dashboards', 'APIs'],
    proof: 'Created analytics screens that turn API data into employer-ready proof.',
  },
  {
    name: 'Ethan Brooks',
    role: 'Junior Rails Developer',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
    skills: ['Ruby', 'SQL', 'Authentication', 'Deployment'],
    proof: 'Deployed a Ruby app with user accounts, database models, and admin tools.',
  },
];

const opportunities = [
  {
    company: 'Northstar Analytics',
    need: 'Junior developer for SQL dashboards and Python API work',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=80',
    skills: ['Python', 'SQL', 'APIs'],
  },
  {
    company: 'BrightLayer Software',
    need: 'React developer who can build protected routes and admin screens',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
    skills: ['React', 'Authentication', 'Dashboards'],
  },
  {
    company: 'Harbour Cloud',
    need: 'Spring Boot project help with JWT authentication and PostgreSQL',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
    skills: ['Spring Boot', 'PostgreSQL', 'JWT'],
  },
  {
    company: 'RailsDesk',
    need: 'Ruby developer for account flows, database models, and deployment',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&q=80',
    skills: ['Ruby', 'SQL', 'Deployment'],
  },
];

const popularSkills = ['Python', 'Ruby', 'SQL', 'Spring Boot', 'React', 'APIs'];
const profileFilters = [
  { label: 'All', value: 'ALL' },
  { label: 'Developers', value: 'DEVELOPER' },
  { label: 'Employers', value: 'EMPLOYER' },
];

function includesSearch(values, search) {
  return values.join(' ').toLowerCase().includes(search);
}

const profiles = [
  ...developers.map((developer) => ({
    type: 'DEVELOPER',
    name: developer.name,
    title: developer.role,
    image: developer.photo,
    skills: developer.skills,
    summary: developer.proof,
  })),
  ...opportunities.map((opportunity) => ({
    type: 'EMPLOYER',
    name: opportunity.company,
    title: 'Hiring need',
    image: opportunity.image,
    skills: opportunity.skills,
    summary: opportunity.need,
  })),
];

export default function Home() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [filter, setFilter] = useState('ALL');

  const filteredProfiles = useMemo(() => {
    const search = query.trim().toLowerCase();
    const nameSearch = nameQuery.trim().toLowerCase();

    return profiles.filter((profile) =>
      (filter === 'ALL' || profile.type === filter) &&
      (!search || includesSearch([profile.name, profile.title, profile.summary, ...profile.skills], search)) &&
      (!nameSearch || profile.name.toLowerCase().includes(nameSearch))
    );
  }, [filter, nameQuery, query]);

  const nameSuggestions = useMemo(() => {
    const search = nameQuery.trim().toLowerCase();
    if (!search) {
      return [];
    }

    return profiles
      .filter((profile) =>
        (filter === 'ALL' || profile.type === filter) &&
        profile.name.toLowerCase().includes(search)
      )
      .slice(0, 5);
  }, [filter, nameQuery]);

  return (
    <main className="public-page">
      <header className="site-header">
        <Link className="site-brand" to="/">
          <span className="brand-mark">SS</span>
          <strong>SkillSignal</strong>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <Link className="account-link" to={user ? '/dashboard' : '/login'}>
            <UserCircle size={18} />
            <span>Account</span>
          </Link>
        </nav>
      </header>

      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Proof-based hiring</p>
          <h1>Build a meaningful profile and get your projects noticed.</h1>
          <p>
            Search skills, project proof, and employer needs in one place. Developers show what they can build, and employers find people by the work they need done.
          </p>
        </div>

        <div className="search-panel universal-search">
          <label htmlFor="marketplace-search">Search SkillSignal</label>
          <div className="search-box">
            <Search size={20} />
            <input
              id="marketplace-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Python, SQL, Spring Boot, React, dashboards"
            />
          </div>
          <div className="skill-chips" aria-label="Popular skill searches">
            {popularSkills.map((skill) => (
              <button key={skill} type="button" onClick={() => setQuery(skill)}>
                {skill}
              </button>
            ))}
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to="/register">Create account</Link>
            <Link className="secondary-button" to="/login">Sign in</Link>
          </div>
        </div>
      </section>

      <section className="results-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Profiles</p>
            <h2>{filteredProfiles.length} profiles found</h2>
          </div>
          <div className="segmented-control" aria-label="Filter profiles">
            {profileFilters.map((option) => (
              <button
                className={filter === option.value ? 'active' : ''}
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="name-search-panel">
          <label htmlFor="name-search">Search by name</label>
          <div className="search-box">
            <Search size={20} />
            <input
              id="name-search"
              value={nameQuery}
              onChange={(event) => setNameQuery(event.target.value)}
              placeholder="Start typing a name, e.g. Ma, Daniel, North"
            />
          </div>
          {nameSuggestions.length > 0 && (
            <div className="name-suggestions" aria-label="Name suggestions">
              {nameSuggestions.map((profile) => (
                <button key={`${profile.type}-${profile.name}`} type="button" onClick={() => setNameQuery(profile.name)}>
                  <span>{profile.name}</span>
                  <small>{profile.type === 'DEVELOPER' ? 'Developer' : 'Employer'}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="profile-grid">
          {filteredProfiles.map((profile) => (
            <article className="profile-card" key={`${profile.type}-${profile.name}`}>
              {profile.image ? (
                <img src={profile.image} alt={profile.name} />
              ) : (
                <div className="profile-placeholder">{profile.name.slice(0, 2).toUpperCase()}</div>
              )}
              <div className="profile-card-heading">
                <span className={`profile-type ${profile.type.toLowerCase()}`}>
                  {profile.type === 'DEVELOPER' ? 'Developer' : 'Employer'}
                </span>
                <h3>{profile.name}</h3>
                <p>{profile.title}</p>
              </div>
              <div className="skill-list">
                {profile.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <p className="proof-text">{profile.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
