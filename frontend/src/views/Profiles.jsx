import React, { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, Code2, ExternalLink, Search, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicFooter from '../ui/PublicFooter.jsx';
import PublicHeader from '../ui/PublicHeader.jsx';
import { apiRequest } from '../api/client.js';

const popularSkills = ['Python', 'Ruby', 'SQL', 'Spring Boot', 'React', 'APIs'];
const profileFilters = [
  { label: 'All', value: 'ALL', icon: UsersRound },
  { label: 'Developers', value: 'DEVELOPER', icon: Code2 },
  { label: 'Employers', value: 'EMPLOYER', icon: Building2 },
];
const summaryCharacterLimit = 180;
const profilesPerPage = 6;

function summaryPreview(summary = '') {
  const trimmedSummary = summary.trim();
  if (trimmedSummary.length <= summaryCharacterLimit) {
    return trimmedSummary;
  }
  return `${trimmedSummary.slice(0, summaryCharacterLimit).trimEnd()}...`;
}

function formatMetric(value, isLoading = false) {
  if (isLoading) {
    return 'Loading';
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? new Intl.NumberFormat('en').format(numericValue) : '0';
}

function DirectoryPagination({ pageData, isLoadingProfiles, setPage }) {
  if (pageData.totalPages <= 1) {
    return null;
  }

  return (
    <nav className="directory-pagination" aria-label="Profile directory pages">
      <button
        aria-label="Previous profile page"
        className="directory-page-arrow"
        disabled={!pageData.hasPrevious || isLoadingProfiles}
        onClick={() => setPage((current) => Math.max(0, current - 1))}
        type="button"
      >
        <ChevronLeft size={19} />
      </button>
      <span>Page {pageData.page + 1} of {pageData.totalPages}</span>
      <button
        aria-label="Next profile page"
        className="directory-page-arrow"
        disabled={!pageData.hasNext || isLoadingProfiles}
        onClick={() => setPage((current) => current + 1)}
        type="button"
      >
        <ChevronRight size={19} />
      </button>
    </nav>
  );
}

export default function Profiles() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [profiles, setProfiles] = useState([]);
  const [pageData, setPageData] = useState({ page: 0, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false });
  const [page, setPage] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    setIsLoadingMetrics(true);
    apiRequest('/api/profiles/metrics')
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setIsLoadingMetrics(false));
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams();
    if (query.trim()) {
      searchParams.set('query', query.trim());
    }
    if (filter !== 'ALL') {
      searchParams.set('type', filter);
    }
    searchParams.set('page', page.toString());
    searchParams.set('size', profilesPerPage.toString());

    setIsLoadingProfiles(true);
    setProfileError('');

    apiRequest(`/api/profiles/page?${searchParams.toString()}`)
      .then((response) => {
        setProfiles(response.profiles);
        setPageData(response);
      })
      .catch((err) => {
        setProfiles([]);
        setPageData({ page: 0, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false });
        setProfileError(err.message);
      })
      .finally(() => setIsLoadingProfiles(false));
  }, [filter, page, query]);

  const nameSuggestions = useMemo(() => (
    query.trim() ? profiles.slice(0, 5) : []
  ), [query, profiles]);

  return (
    <main className="public-page profiles-discovery">
      <div className="profiles-discovery-stage">
      <PublicHeader />

      <section className="profiles-hero directory-intro profiles-discovery-hero">
          <div className="directory-hero-copy">
            <p className="eyebrow">Browse profiles</p>
            <h1>Search for developer and employer profiles.</h1>
            <p>
              Search developers and employers by name, technical stack, or project proof.
            </p>
        </div>
        <div className="directory-hero-metrics" aria-label="Profile directory metrics">
          <div>
            <strong>{formatMetric(metrics?.totalAccounts, isLoadingMetrics)}</strong>
            <span>accounts</span>
          </div>
          <div>
            <strong>{formatMetric(metrics?.publicProfiles, isLoadingMetrics)}</strong>
            <span>public profiles</span>
          </div>
          <div>
            <strong>{formatMetric(metrics?.developerProfiles, isLoadingMetrics)}</strong>
            <span>developers</span>
          </div>
          <div>
            <strong>{formatMetric(metrics?.employerProfiles, isLoadingMetrics)}</strong>
            <span>employers</span>
          </div>
        </div>
      </section>

      <section className="directory-results-shell">
        <section className="results-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Directory</p>
            <h2>{isLoadingProfiles ? 'Searching profiles...' : `${pageData.totalElements} profiles found`}</h2>
          </div>
          <div className="segmented-control" aria-label="Filter profiles">
            {profileFilters.map((option) => (
              <button
                aria-pressed={filter === option.value}
                className={`directory-filter-${option.value.toLowerCase()} ${filter === option.value ? 'active' : ''}`}
                key={option.value}
                type="button"
                onClick={() => {
                  setFilter(option.value);
                  setPage(0);
                }}
              >
                <option.icon size={15} aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="directory-inline-search">
          <label className="sr-only" htmlFor="marketplace-search">Search people and project proof</label>
          <div className="search-box directory-primary-search">
            <Search size={21} />
            <input
              id="marketplace-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Search names, skills, work, or proof"
            />
          </div>
          {query.trim() && (
            <div className="directory-search-refinements">
              <div className="skill-chips" aria-label="Suggested search refinements">
                {popularSkills.map((skill) => (
                  <button className="directory-skill-chip" key={skill} type="button" onClick={() => { setQuery(skill); setPage(0); }}>
                    {skill}
                  </button>
                ))}
              </div>
              {nameSuggestions.length > 0 && (
                <div className="directory-name-suggestions" aria-label="Matching profiles">
                  {nameSuggestions.map((profile) => (
                    <Link key={`${profile.type}-${profile.id ?? profile.name}`} to={`/profiles/${profile.id}`}>
                      <span>{profile.name}</span>
                      <small>{profile.type === 'DEVELOPER' ? 'Developer' : 'Employer'}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {profileError && <p className="error">{profileError}</p>}

        <div className="profile-grid" key={`${filter}-${page}-${query}`}>
          {profiles.map((profile) => {
            const profileKey = `${profile.type}-${profile.id ?? profile.name}`;
            return (
              <article
                className={`profile-card profile-card-${profile.type.toLowerCase()}`}
                key={profileKey}
              >
                <div className="profile-card-top">
                  <div className="profile-avatar-wrap">
                    {profile.image ? <img src={profile.image} alt={profile.name} /> : <div className="profile-placeholder">{profile.name.slice(0, 2).toUpperCase()}</div>}
                    <span className={`presence-dot profile-presence ${profile.presence?.toLowerCase().replaceAll('_', '-') ?? 'offline'}`} title={profile.presence?.replaceAll('_', ' ') ?? 'Offline'} />
                  </div>
                  <div className="profile-card-heading">
                    <div className="profile-badges">
                      <span className={`profile-type ${profile.type.toLowerCase()}`}>
                        {profile.type === 'DEVELOPER' ? 'Developer' : 'Employer'}
                      </span>
                    </div>
                    <h3>{profile.name}</h3>
                    <p>{profile.title}</p>
                  </div>
                </div>
                <div className="skill-list">
                  {profile.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <div className="proof-text">
                  <p>{summaryPreview(profile.summary)}</p>
                </div>
                <Link className="secondary-button profile-view-link" to={`/profiles/${profile.id}`}>
                  <ExternalLink size={16} />
                  <span>View profile</span>
                </Link>
              </article>
            );
          })}
        </div>
        <DirectoryPagination isLoadingProfiles={isLoadingProfiles} pageData={pageData} setPage={setPage} />
        </section>
      </section>
      </div>
      <div className="profiles-discovery-footer">
      <PublicFooter />
      </div>
    </main>
  );
}
