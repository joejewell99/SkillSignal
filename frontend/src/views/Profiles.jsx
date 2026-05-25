import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicHeader from '../ui/PublicHeader.jsx';
import { apiRequest } from '../api/client.js';

const popularSkills = ['Python', 'Ruby', 'SQL', 'Spring Boot', 'React', 'APIs'];
const profileFilters = [
  { label: 'All', value: 'ALL' },
  { label: 'Developers', value: 'DEVELOPER' },
  { label: 'Employers', value: 'EMPLOYER' },
];

export default function Profiles() {
  const [query, setQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [profiles, setProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams();
    if (query.trim()) {
      searchParams.set('query', query.trim());
    }
    if (nameQuery.trim()) {
      searchParams.set('name', nameQuery.trim());
    }
    if (filter !== 'ALL') {
      searchParams.set('type', filter);
    }

    setIsLoadingProfiles(true);
    setProfileError('');

    apiRequest(`/api/profiles?${searchParams.toString()}`)
      .then(setProfiles)
      .catch((err) => {
        setProfiles([]);
        setProfileError(err.message);
      })
      .finally(() => setIsLoadingProfiles(false));
  }, [filter, nameQuery, query]);

  const nameSuggestions = useMemo(() => (
    nameQuery.trim() ? profiles.slice(0, 5) : []
  ), [nameQuery, profiles]);

  return (
    <main className="public-page">
      <PublicHeader />

      <section className="profiles-hero">
        <div>
          <p className="eyebrow">Profiles</p>
          <h1>Browse the current SkillSignal marketplace.</h1>
          <p>
            Search developers and employer needs by skills, names, project evidence, and technical focus.
          </p>
        </div>
        <div className="directory-metrics" aria-label="Profile directory metrics">
          <div>
            <strong>22</strong>
            <span>seed profiles</span>
          </div>
          <div>
            <strong>AI</strong>
            <span>match ready</span>
          </div>
          <div>
            <strong>Proof</strong>
            <span>first ranking</span>
          </div>
        </div>
      </section>

      <section className="search-strip">
        <div className="search-panel universal-search">
          <label htmlFor="marketplace-search">Search profiles by keyword</label>
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
        </div>
      </section>

      <section className="results-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Directory</p>
            <h2>{isLoadingProfiles ? 'Searching profiles...' : `${profiles.length} profiles found`}</h2>
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

        {profileError && <p className="error">{profileError}</p>}

        <div className="profile-grid">
          {profiles.map((profile) => (
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
              {profile.type === 'DEVELOPER' && (
                <Link className="secondary-button profile-view-link" to={`/profiles/${profile.id}`}>
                  <ExternalLink size={16} />
                  <span>View profile</span>
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
