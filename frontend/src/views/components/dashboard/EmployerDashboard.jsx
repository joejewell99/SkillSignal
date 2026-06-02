import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BriefcaseBusiness, Camera, CheckCircle2, ExternalLink, Pencil, Plus, Search, Send, Trash2 } from 'lucide-react';
import { apiRequest } from '../../../api/client.js';
import {
  emptyProject,
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
  const [focusInput, setFocusInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [isComposingPost, setIsComposingPost] = useState(false);
  const [isAddingNeed, setIsAddingNeed] = useState(false);
  const [needForm, setNeedForm] = useState(emptyProject);
  const [editingNeedId, setEditingNeedId] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
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
        const shouldSyncProfileBasics = nextProfile.summary && nextProfile.summary !== profileData.summary;
        setProfile((current) => ({
          ...current,
          ...nextProfile,
        }));
        if (shouldSyncProfileBasics || shouldSyncStoredProjects || shouldSyncStoredPosts) {
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

  function updateNeedField(field, value) {
    setNeedForm((current) => ({ ...current, [field]: value }));
  }

  function sortNeeds(needs) {
    return [...needs].sort((first, second) => Number(Boolean(second.featured)) - Number(Boolean(first.featured)));
  }

  function resetNeedForm() {
    setNeedForm(emptyProject);
    setEditingNeedId(null);
    setIsAddingNeed(false);
  }

  function startEditingNeed(need) {
    setNeedForm({
      name: need.name ?? '',
      description: need.description ?? '',
      githubUrl: '',
      liveUrl: '',
      skills: (need.skills ?? []).join(', '),
      images: [],
      featured: Boolean(need.featured),
    });
    setEditingNeedId(need.id);
    setIsAddingNeed(true);
  }

  async function saveHiringNeed(event) {
    event.preventDefault();
    const name = needForm.name.trim();
    const description = needForm.description.trim();
    if (!name || !description) {
      return;
    }
    const need = {
      ...needForm,
      id: crypto.randomUUID(),
      name,
      description,
      githubUrl: '',
      liveUrl: '',
      images: [],
      skills: needForm.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      featured: Boolean(needForm.featured),
    };
    const nextProjects = editingNeedId
      ? profile.projects.map((existingNeed) => (existingNeed.id === editingNeedId ? need : existingNeed))
      : [need, ...profile.projects];
    const nextProfile = { ...profile, projects: sortNeeds(nextProjects) };
    setProfile(nextProfile);
    resetNeedForm();
    try {
      await saveEmployerProfile(nextProfile);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
  }

  async function removeHiringNeed(needId) {
    const nextProfile = {
      ...profile,
      projects: profile.projects.filter((need) => need.id !== needId),
    };
    setProfile(nextProfile);
    try {
      await saveEmployerProfile(nextProfile);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
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
  const dashboardTabs = [
    { id: 'profile', label: 'Profile', count: null },
    { id: 'needs', label: 'Looking For', count: profile.projects.length },
    { id: 'proof', label: 'Inbox', count: proofSignals.length },
    { id: 'saved', label: 'Saved', count: savedCandidates.length },
    { id: 'matches', label: 'Matches', count: candidates.length },
  ];

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
        <div className="employer-header-side">
          <label className="compact-visibility-toggle" htmlFor="employer-profile-publication">
            <span>Toggle visibility</span>
            <input
              id="employer-profile-publication"
              type="checkbox"
              checked={profile.isDisplayed}
              onChange={(event) => updateEmployerDisplayStatus(event.target.checked)}
            />
          </label>
        </div>
      </header>

      <nav className="employer-dashboard-tabs" aria-label="Employer dashboard sections">
        {dashboardTabs.map((tab) => (
          <button
            key={tab.id}
            className={activeSection === tab.id ? 'active' : ''}
            type="button"
            onClick={() => setActiveSection(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.count !== null && <strong>{tab.count}</strong>}
          </button>
        ))}
      </nav>

      <section className="employer-workspace">
        {activeSection === 'needs' && (
          <>

          <section className="workspace-panel candidate-panel employer-needs-editor">
            <div className="panel-heading-row">
              <div>
                <h2>Looking for</h2>
                <p className="subtle">Publish the problems a developer can prove they can solve.</p>
              </div>
              <button className="primary-button" type="button" onClick={() => {
                if (isAddingNeed) {
                  resetNeedForm();
                  return;
                }
                setIsAddingNeed(true);
              }}>
                <Plus size={18} />
                <span>{isAddingNeed ? 'Cancel' : 'Requirement'}</span>
              </button>
            </div>
            {isAddingNeed && (
              <form className="project-form need-form" onSubmit={saveHiringNeed}>
                <div className="two-column-fields">
                  <label htmlFor="need-name">
                    Requirement title
                    <input
                      id="need-name"
                      value={needForm.name}
                      onChange={(event) => updateNeedField('name', event.target.value)}
                      placeholder="React dashboard polish"
                    />
                  </label>
                  <label htmlFor="need-skills">
                    Skills wanted
                    <input
                      id="need-skills"
                      value={needForm.skills}
                      onChange={(event) => updateNeedField('skills', event.target.value)}
                      placeholder="React, APIs, PostgreSQL"
                    />
                  </label>
                </div>
                <label htmlFor="need-description">
                  Problem to solve
                  <textarea
                    id="need-description"
                    value={needForm.description}
                    onChange={(event) => updateNeedField('description', event.target.value)}
                    placeholder="Describe the real workflow, bug, feature, or product problem you want a developer to help with."
                  />
                </label>
                <label className="featured-project-toggle" htmlFor="need-featured">
                  <input
                    id="need-featured"
                    type="checkbox"
                    checked={needForm.featured}
                    onChange={(event) => updateNeedField('featured', event.target.checked)}
                  />
                  <span>Feature this requirement</span>
                </label>
                <button className="primary-button" type="submit">
                  {editingNeedId ? <CheckCircle2 size={17} /> : <Plus size={17} />}
                  <span>{editingNeedId ? 'Save requirement' : 'Add requirement'}</span>
                </button>
              </form>
            )}
            {profile.projects.length === 0 ? (
              <div className="empty-state">
                <BriefcaseBusiness size={28} />
                <h3>No hiring needs yet</h3>
                <p>Add one clear requirement so developers know what proof, stack, or project experience to show you.</p>
                <button className="secondary-button" type="button" onClick={() => setIsAddingNeed(true)}>
                  <Plus size={16} />
                  <span>Add requirement</span>
                </button>
              </div>
            ) : (
              <div className="candidate-list employer-need-editor-list">
                {profile.projects.map((need) => (
                  <article className="candidate-card proof-signal-card" key={need.id ?? need.name}>
                    <BriefcaseBusiness size={28} />
                    <div>
                      <div className="panel-heading-row">
                        <div>
                          <h3>{need.name}</h3>
                          <p>{need.description}</p>
                        </div>
                        <div className="requirement-actions">
                          <button
                            className="delete-button"
                            type="button"
                            onClick={() => startEditingNeed(need)}
                            aria-label={`Edit ${need.name}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="delete-button destructive-button"
                            type="button"
                            onClick={() => removeHiringNeed(need.id)}
                            aria-label={`Remove ${need.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="skill-list">
                        {(need.skills ?? []).map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          </>
        )}

        {activeSection === 'saved' && (
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
              <div className="empty-state">
                <Bookmark size={28} />
                <h3>No saved candidates</h3>
                <p>Save developers from profile pages when you want to compare or review them later.</p>
                <Link className="secondary-button" to="/match">
                  <Search size={16} />
                  <span>Find developers</span>
                </Link>
              </div>
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
                          className="delete-button destructive-button"
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
        )}

        {activeSection === 'proof' && (
          <section className="workspace-panel candidate-panel">
            <div className="panel-heading-row">
              <div>
                <h2>Inbox</h2>
                <p className="subtle">Incoming proof of work from developers interested in what you are looking for.</p>
              </div>
              <Link className="secondary-button" to="/profiles?type=DEVELOPER">
                <Search size={16} />
                <span>Find more</span>
              </Link>
            </div>
            {proofSignals.length === 0 ? (
              <div className="empty-state">
                <Send size={28} />
                <h3>No proof sent yet</h3>
                <p>When developers send project proof from your employer profile, it will appear here for review.</p>
                <Link className="secondary-button" to="/profiles?type=DEVELOPER">
                  <Search size={16} />
                  <span>Browse developers</span>
                </Link>
              </div>
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
        )}

        {activeSection === 'matches' && (
          <section className="workspace-panel candidate-panel">
            <div className="panel-heading-row">
              <div>
                <h2>Recommended developers</h2>
                <p className="subtle">Starting point based on an authentication/dashboard requirement.</p>
              </div>
              <Link className="secondary-button" to="/profiles">
                <Search size={16} />
                <span>Find candidates</span>
              </Link>
            </div>
            {error && <p className="error">{error}</p>}
            {candidates.length === 0 ? (
              <div className="empty-state">
                <Search size={28} />
                <h3>No recommended developers</h3>
                <p>Use AI Match to search by skill, stack, work type, or project evidence.</p>
                <Link className="secondary-button" to="/match">
                  <Search size={16} />
                  <span>Open AI Match</span>
                </Link>
              </div>
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
        )}

        {activeSection === 'profile' && (
          <div className="employer-profile-grid">
            <div className="employer-profile-editor-column">
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
                  <button className="remove-chip-button" key={item} type="button" onClick={() => removeFocus(item)}>
                    <span>{item}</span>
                    <Trash2 size={14} />
                  </button>
                  ))}
                </div>
              </section>

              <section className="workspace-panel">
                <div className="panel-heading-row">
                  <div>
                    <h2>Hiring feed</h2>
                    <p className="subtle">Optional updates for developers browsing your profile.</p>
                  </div>
                  <button className="primary-button" type="button" onClick={() => setIsComposingPost((current) => !current)}>
                    <Plus size={18} />
                    <span>Post</span>
                  </button>
                </div>
                {isComposingPost && (
                  <form className="post-form compact-post-form" onSubmit={addPost}>
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
                )}
                <div className="feed-list compact-feed-list">
                  {posts.length === 0 ? (
                    <article className="empty-feed">
                      <Send size={28} />
                      <p>Post a short hiring update when you want developers to see what you are actively looking for.</p>
                    </article>
                  ) : (
                    posts.map((post) => (
                      <article className="feed-post" key={post.id}>
                        <div className="feed-post-header">
                          <div className="feed-author">
                            {profile.photo ? <img src={profile.photo} alt={`${user.name} avatar`} /> : <div className="profile-placeholder">{user.name?.[0] ?? 'E'}</div>}
                            <div>
                              <strong>{user.name}</strong>
                              <span>{formatPostDate(post.createdAt)}</span>
                            </div>
                          </div>
                          <button className="delete-button destructive-button" type="button" onClick={() => removePost(post.id)} aria-label="Remove post">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p>{post.body}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="workspace-panel">
                <h2>Hiring brief</h2>
                <ul className="feature-list">
                  <li>
                    <CheckCircle2 size={18} />
                    <span>Post what kind of developer you are looking for</span>
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
            </div>

            <aside className="employer-profile-preview-column">
              <section className="profile-card employer-dashboard-preview-card">
                {profile.photo ? (
                  <img src={profile.photo} alt={`${user.name} preview`} />
                ) : (
                  <div className="profile-placeholder">{user.name.slice(0, 2).toUpperCase()}</div>
                )}
                <div className="profile-card-heading">
                  <span className="profile-type employer">Employer</span>
                  <h3>{user.name}</h3>
                  <p>{profile.title}</p>
                </div>
                <div className="skill-list">
                  {profile.focus.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div className="proof-text">
                  <p>{profile.summary || 'Add a summary so developers understand what you are hiring for.'}</p>
                </div>
                <Link className="secondary-button profile-view-link" to={backendData?.id ? `/profiles/${backendData.id}` : '/profiles'}>
                  <ExternalLink size={16} />
                  <span>View profile</span>
                </Link>
              </section>
            </aside>
          </div>
        )}
      </section>
    </section>
  );
}
