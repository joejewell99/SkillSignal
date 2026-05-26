import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BriefcaseBusiness, Camera, CheckCircle2, ExternalLink, MessageSquareText, Plus, Search, Send, Trash2 } from 'lucide-react';
import { apiRequest } from '../../../api/client.js';
import {
  formatPostDate,
  normalizeProjects,
  readImage,
  readStoredEmployerProfile,
  toEmployerProfilePayload,
} from './profileData.js';
export default function EmployerDashboard({ user, token }) {
  const storageKey = `skillsignal.employer-profile.${user.email}`;
  const [data, setData] = useState(null);
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState('');
  const [proofSignals, setProofSignals] = useState([]);
  const [savedCandidates, setSavedCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [focusInput, setFocusInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [isComposingPost, setIsComposingPost] = useState(false);
  const [profile, setProfile] = useState(() => readStoredEmployerProfile(storageKey, user));

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ ...profile, name: user.name, email: user.email }));
  }, [profile, storageKey, user.email, user.name]);

  useEffect(() => {
    apiRequest('/api/employer/profile', { token })
      .then((profileData) => {
        setBackendData(profileData);
        const storedProfile = readStoredEmployerProfile(storageKey, user);
        const backendProjects = normalizeProjects(profileData.projects);
        const backendPosts = profileData.posts ?? [];
        const shouldSyncStoredProjects = storedProfile.projects.length > 0 && backendProjects.length === 0;
        const shouldSyncStoredPosts = storedProfile.posts.length > 0 && backendPosts.length === 0;
        const nextProfile = {
          ...storedProfile,
          isDisplayed: profileData.displayed,
          title: storedProfile.title || profileData.title,
          summary: storedProfile.summary || profileData.summary,
          photo: storedProfile.photo || profileData.image,
          focus: storedProfile.focus.length > 0 ? storedProfile.focus : profileData.skills,
          projects: shouldSyncStoredProjects ? storedProfile.projects : backendProjects,
          posts: shouldSyncStoredPosts ? storedProfile.posts : backendPosts,
        };
        setProfile((current) => ({
          ...current,
          ...nextProfile,
        }));
        if (shouldSyncStoredProjects || shouldSyncStoredPosts) {
          apiRequest('/api/employer/profile', {
            token,
            method: 'PATCH',
            body: JSON.stringify(toEmployerProfilePayload(nextProfile, profileData.displayed)),
          })
            .then(setBackendData)
            .catch((err) => setError(err.message));
        }
      })
      .catch((err) => setError(err.message));
  }, [storageKey, token, user.email, user.name]);

  useEffect(() => {
    setError('');
    apiRequest('/api/employer/search?problem=authentication', { token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    apiRequest('/api/employer/proof-signals', { token })
      .then(setProofSignals)
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    apiRequest('/api/employer/saved-candidates', { token })
      .then(setSavedCandidates)
      .catch((err) => setError(err.message));
  }, [token]);

  function updateEmployerProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveEmployerProfile(nextProfile, displayed = nextProfile.isDisplayed) {
    setError('');
    const profileData = await apiRequest('/api/employer/profile', {
      token,
      method: 'PATCH',
      body: JSON.stringify(toEmployerProfilePayload(nextProfile, displayed)),
    });
    setBackendData(profileData);
    setProfile((current) => ({
      ...current,
      isDisplayed: profileData.displayed,
      projects: normalizeProjects(profileData.projects ?? current.projects ?? []),
      posts: profileData.posts ?? [],
    }));
    return profileData;
  }

  async function updateEmployerDisplayStatus(displayed) {
    const nextProfile = { ...profile, isDisplayed: displayed };
    setProfile(nextProfile);
    try {
      await saveEmployerProfile(nextProfile, displayed);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
  }

  async function addPost(event) {
    event.preventDefault();
    const body = postInput.trim();
    if (!body) {
      return;
    }
    const nextProfile = {
      ...profile,
      posts: [
        {
          id: crypto.randomUUID(),
          body,
          createdAt: new Date().toISOString(),
        },
        ...(profile.posts ?? []),
      ],
    };
    setProfile(nextProfile);
    setPostInput('');
    setIsComposingPost(false);
    try {
      await saveEmployerProfile(nextProfile);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
  }

  async function removePost(postId) {
    const nextProfile = {
      ...profile,
      posts: (profile.posts ?? []).filter((post) => post.id !== postId),
    };
    setProfile(nextProfile);
    try {
      await saveEmployerProfile(nextProfile);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
  }

  function handleEmployerPhotoChange(event) {
    readImage(event.target.files?.[0], (result) => updateEmployerProfile('photo', result));
    event.target.value = '';
  }

  function addFocus(event) {
    event.preventDefault();
    const nextFocus = focusInput.trim();
    if (!nextFocus || profile.focus.some((item) => item.toLowerCase() === nextFocus.toLowerCase())) {
      return;
    }
    updateEmployerProfile('focus', [...profile.focus, nextFocus]);
    setFocusInput('');
  }

  function removeFocus(focusToRemove) {
    updateEmployerProfile(
      'focus',
      profile.focus.filter((item) => item !== focusToRemove)
    );
  }

  async function removeSavedCandidate(candidateId) {
    setError('');
    try {
      await apiRequest(`/api/employer/saved-candidates/${candidateId}`, {
        token,
        method: 'DELETE',
      });
      setSavedCandidates((current) => current.filter((candidate) => candidate.id !== candidateId));
    } catch (err) {
      setError(err.message);
    }
  }

  const candidates = data?.matches ?? data?.candidates ?? [];
  const posts = profile.posts ?? [];

  return (
    <section className="dashboard employer-dashboard">
      <header className="developer-header">
        <div className="developer-identity">
          <div className="photo-frame">
            {profile.photo ? <img src={profile.photo} alt={`${user.name} profile`} /> : <BriefcaseBusiness size={56} />}
            <label className="photo-upload" htmlFor="employer-photo">
              <Camera size={17} />
              <span>Upload photo</span>
            </label>
            <input id="employer-photo" type="file" accept="image/*" onChange={handleEmployerPhotoChange} />
          </div>
          <div>
            <p className="eyebrow">Employer dashboard</p>
            <h1>{user.name}</h1>
            <label className="inline-field" htmlFor="employer-title">
              <span>Company or hiring title</span>
              <input
                id="employer-title"
                value={profile.title}
                onChange={(event) => updateEmployerProfile('title', event.target.value)}
                placeholder="Hiring manager, founder, engineering lead"
              />
            </label>
          </div>
        </div>
      </header>

      <section className="developer-layout">
        <div className="developer-main">
          <section className="feed-toolbar">
            <div className="panel-heading-row">
              <div>
                <p className="eyebrow">Hiring feed</p>
                <h2>Activity</h2>
              </div>
              <button className="primary-button" type="button" onClick={() => setIsComposingPost((current) => !current)}>
                <Plus size={18} />
                <span>Post need</span>
              </button>
            </div>
          </section>

          {isComposingPost && (
            <section className="workspace-panel feed-composer">
              <form className="post-form" onSubmit={addPost}>
                <textarea
                  value={postInput}
                  onChange={(event) => setPostInput(event.target.value)}
                  placeholder="Looking for a junior React developer with API experience for a dashboard project..."
                />
                <div className="composer-actions">
                  <button className="secondary-button" type="button" onClick={() => setIsComposingPost(false)}>
                    Cancel
                  </button>
                  <button className="primary-button" type="submit">
                    <Send size={17} />
                    <span>Post</span>
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="feed-list">
            {posts.length === 0 ? (
              <article className="workspace-panel empty-feed">
                <MessageSquareText size={28} />
                <p>Post hiring needs, project context, role requirements, or the kind of developer you want to speak with.</p>
              </article>
            ) : (
              posts.map((post) => (
                <article className="workspace-panel feed-post" key={post.id}>
                  <div className="feed-post-header">
                    <div className="feed-author">
                      {profile.photo ? <img src={profile.photo} alt={`${user.name} avatar`} /> : <div className="profile-placeholder">{user.name?.[0] ?? 'E'}</div>}
                      <div>
                        <strong>{user.name}</strong>
                        <span>{formatPostDate(post.createdAt)}</span>
                      </div>
                    </div>
                    <button className="delete-button" type="button" onClick={() => removePost(post.id)} aria-label="Remove post">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p>{post.body}</p>
                </article>
              ))
            )}
          </section>

          <section className="workspace-panel candidate-panel">
            <div className="panel-heading-row">
              <div>
                <h2>Saved candidates</h2>
                <p className="subtle">Developers you may want to contact or review later.</p>
              </div>
              <Link className="secondary-button" to="/profiles?type=DEVELOPER">
                <Bookmark size={16} />
                <span>Find candidates</span>
              </Link>
            </div>
            {savedCandidates.length === 0 ? (
              <p className="info-message">Save developers from their profile pages to build your shortlist.</p>
            ) : (
              <div className="candidate-list">
                {savedCandidates.map((candidate) => (
                  <article className="candidate-card proof-signal-card" key={candidate.id}>
                    {candidate.developerImage ? (
                      <img src={candidate.developerImage} alt={candidate.developerName} />
                    ) : (
                      <div className="profile-placeholder">{candidate.developerName?.[0] ?? 'D'}</div>
                    )}
                    <div>
                      <div className="panel-heading-row">
                        <div>
                          <h3>{candidate.developerName}</h3>
                          <p>{candidate.developerTitle}</p>
                        </div>
                        <button
                          className="delete-button"
                          type="button"
                          onClick={() => removeSavedCandidate(candidate.id)}
                          aria-label={`Remove ${candidate.developerName} from saved candidates`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="skill-list">
                        {(candidate.skills ?? []).slice(0, 5).map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                      <div className="project-links">
                        <Link to={`/profiles/${candidate.developerProfileId}`}>
                          <ExternalLink size={16} />
                          <span>View profile</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="workspace-panel candidate-panel">
            <div className="panel-heading-row">
              <div>
                <h2>Proof inbox</h2>
                <p className="subtle">Developers who sent project evidence for your hiring needs.</p>
              </div>
              <Link className="secondary-button" to="/profiles?type=DEVELOPER">
                <Search size={16} />
                <span>Find more</span>
              </Link>
            </div>
            {proofSignals.length === 0 ? (
              <p className="info-message">When developers send proof from your employer profile, it will appear here.</p>
            ) : (
              <div className="candidate-list proof-signal-list">
                {proofSignals.map((signal) => (
                  <article className="candidate-card proof-signal-card" key={signal.id}>
                    {signal.developerImage ? (
                      <img src={signal.developerImage} alt={signal.developerName} />
                    ) : (
                      <div className="profile-placeholder">{signal.developerName?.[0] ?? 'D'}</div>
                    )}
                    <div>
                      <div className="panel-heading-row">
                        <div>
                          <h3>{signal.developerName}</h3>
                          <p>{signal.developerTitle}</p>
                        </div>
                        <span className="profile-type developer">Proof</span>
                      </div>
                      <strong>{signal.projectName}</strong>
                      <p>{signal.note}</p>
                      <div className="project-links">
                        <Link to={`/profiles/${signal.developerProfileId}`}>
                          <ExternalLink size={16} />
                          <span>Profile</span>
                        </Link>
                        {signal.projectUrl && (
                          <a href={signal.projectUrl} target="_blank" rel="noreferrer">
                            <ExternalLink size={16} />
                            <span>Proof link</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="workspace-panel candidate-panel">
            <div className="panel-heading-row">
              <div>
                <h2>Recommended developers</h2>
                <p className="subtle">Starting point based on an authentication/dashboard hiring need.</p>
              </div>
              <Link className="secondary-button" to="/profiles">
                <Search size={16} />
                <span>Browse</span>
              </Link>
            </div>
            {error && <p className="error">{error}</p>}
            {candidates.length === 0 ? (
              <p className="info-message">Use the search panel to find developers by skill, stack, or project evidence.</p>
            ) : (
              <div className="candidate-list">
                {candidates.slice(0, 3).map((candidate, index) => {
                  const profile = candidate.profile ?? candidate;
                  return (
                    <article className="candidate-card" key={profile.id ?? profile.name ?? index}>
                      {profile.image ? <img src={profile.image} alt={profile.name} /> : <div className="profile-placeholder">{profile.name?.[0] ?? 'D'}</div>}
                      <div>
                        <h3>{profile.name}</h3>
                        <p>{profile.title}</p>
                        <div className="skill-list">
                          {(profile.skills ?? []).slice(0, 4).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="developer-preview">
          <section className="workspace-panel">
            <h2>Profile preview</h2>
            <div className="preview-card">
              {profile.photo ? <img src={profile.photo} alt={`${user.name} preview`} /> : <div className="profile-placeholder">{user.name?.[0] ?? 'E'}</div>}
              <div>
                <h3>{user.name}</h3>
                <p>{profile.title}</p>
              </div>
              <p>{profile.summary || 'Add a summary so developers understand what you are hiring for.'}</p>
              <div className="skill-list">
                {profile.focus.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="workspace-panel profile-editor">
            <h2>Profile summary</h2>
            <label htmlFor="employer-summary">
              Summary
              <textarea
                id="employer-summary"
                value={profile.summary}
                onChange={(event) => updateEmployerProfile('summary', event.target.value)}
                placeholder="Describe your company, the kind of work available, and what developers should know before reaching out."
              />
            </label>
          </section>

          <section className="workspace-panel">
            <div className="panel-heading-row">
              <h2>Hiring focus</h2>
              <span>{profile.focus.length} added</span>
            </div>
            <form className="skill-entry" onSubmit={addFocus}>
              <input
                value={focusInput}
                onChange={(event) => setFocusInput(event.target.value)}
                placeholder="React, dashboards, APIs"
              />
              <button className="primary-button icon-button" type="submit" aria-label="Add hiring focus">
                <Plus size={18} />
              </button>
            </form>
            <div className="editable-skill-list">
              {profile.focus.map((item) => (
                <button key={item} type="button" onClick={() => removeFocus(item)}>
                  <span>{item}</span>
                  <Trash2 size={14} />
                </button>
              ))}
            </div>
          </section>

          <section className="workspace-panel">
            <div className="publication-panel">
              <div>
                <h2>Profile visibility</h2>
                <p className="subtle">
                  {profile.isDisplayed
                    ? 'Your employer profile is visible in the public profiles.'
                    : 'Your employer profile is hidden from public profiles.'}
                </p>
              </div>
              <label className="visibility-toggle" htmlFor="employer-profile-publication">
                <input
                  id="employer-profile-publication"
                  type="checkbox"
                  checked={profile.isDisplayed}
                  onChange={(event) => updateEmployerDisplayStatus(event.target.checked)}
                />
                <span>{profile.isDisplayed ? 'Displayed' : 'Hidden'}</span>
              </label>
              <Link className="secondary-button" to="/profiles">
                View profiles
              </Link>
              {backendData && (
                <p className="info-message">
                  Database profile is {backendData.displayed ? 'displayed publicly' : 'hidden from public profiles'}.
                </p>
              )}
            </div>
          </section>

          <section className="workspace-panel">
            <h2>Hiring search</h2>
            <div className="quick-search">
              <label htmlFor="employer-dashboard-search">Find developers by skill</label>
              <div className="search-box">
                <Search size={18} />
                <input
                  id="employer-dashboard-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="React, Spring Boot, PostgreSQL"
                />
              </div>
              <Link className="primary-button" to={`/profiles?query=${encodeURIComponent(search)}`}>
                Search profiles
              </Link>
            </div>
          </section>

          <section className="workspace-panel">
            <h2>Hiring brief</h2>
            <ul className="feature-list">
              <li>
                <CheckCircle2 size={18} />
                <span>Post what kind of developer you need</span>
              </li>
              <li>
                <CheckCircle2 size={18} />
                <span>Review project proof before contacting</span>
              </li>
              <li>
                <CheckCircle2 size={18} />
                <span>Shortlist developers by skill evidence</span>
              </li>
            </ul>
          </section>
        </aside>
      </section>
    </section>
  );
}
