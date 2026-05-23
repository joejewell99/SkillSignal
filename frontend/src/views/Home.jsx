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

const popularSkills = ['Python', 'Ruby', 'SQL', 'Spring Boot', 'React', 'APIs'];

export default function Home() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const filteredDevelopers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return developers;
    }

    return developers.filter((developer) =>
      [...developer.skills, developer.role, developer.proof]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }, [query]);

  return (
    <main className="public-page">
      <header className="site-header">
        <Link className="site-brand" to="/">
          <span className="brand-mark">SS</span>
          <strong>SkillSignal</strong>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#developers">Developers</a>
          <a href="#search">Search</a>
          {user ? (
            <Link className="account-link" to="/dashboard">
              <UserCircle size={18} />
              <span>Account</span>
            </Link>
          ) : (
            <Link className="account-link" to="/login">
              <UserCircle size={18} />
              <span>Account</span>
            </Link>
          )}
        </nav>
      </header>

      <section className="search-hero" id="search">
        <div className="hero-copy">
          <p className="eyebrow">Proof-based hiring</p>
          <h1>Find junior developers by proven skills.</h1>
          <p>
            Search for skills or technical problems and see developers whose project evidence matches what employers need.
          </p>
        </div>

        <div className="search-panel">
          <label htmlFor="candidate-search">Search by skill</label>
          <div className="search-box">
            <Search size={20} />
            <input
              id="candidate-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Python, Ruby, SQL, Spring Boot"
            />
          </div>
          <div className="skill-chips" aria-label="Popular skill searches">
            {popularSkills.map((skill) => (
              <button key={skill} type="button" onClick={() => setQuery(skill)}>
                {skill}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="results-section" id="developers">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Candidate profiles</p>
            <h2>{filteredDevelopers.length} developers found</h2>
          </div>
          <Link className="primary-button" to="/register">Advertise your profile</Link>
        </div>

        <div className="developer-grid">
          {filteredDevelopers.map((developer) => (
            <article className="developer-card" key={developer.name}>
              <img src={developer.photo} alt={developer.name} />
              <div>
                <h3>{developer.name}</h3>
                <p>{developer.role}</p>
              </div>
              <div className="skill-list">
                {developer.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <p className="proof-text">{developer.proof}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
