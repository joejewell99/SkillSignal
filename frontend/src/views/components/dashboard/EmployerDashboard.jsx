import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, BriefcaseBusiness, Camera, CheckCircle2, ExternalLink, MessageSquareText, Pencil, Plus, Search, Send, Star, Trash2 } from 'lucide-react';
import { apiRequest } from '../../../api/client.js';
import {
  emptyProject,
  formatPostDate,
  normalizeProjects,
  readImage,
  readStoredEmployerProfile,
  toEmployerProfilePayload,
} from './profileData.js';

function getOtherParticipant(thread) {
  return thread.partner ?? null;
}

function isThreadAcceptedForUser(thread) {
  return Boolean(thread.accepted);
}

function formatThreadTimestamp(value) {
  if (!value) {
    return 'Now';
  }
  const timestamp = new Date(value);
  const diffMs = Date.now() - timestamp.getTime();

  if (Number.isNaN(timestamp.getTime()) || diffMs < 0) {
    return 'Now';
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'Now';
  }
  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)}m ago`;
  }
  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}h ago`;
  }
  return `${Math.floor(diffMs / day)}d ago`;
}

function formatThreadPreview(value) {
  const preview = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!preview) {
    return 'No messages yet.';
  }
  return preview.length > 72 ? `${preview.slice(0, 69)}...` : preview;
}

function formatChatTime(value) {
  if (!value) {
    return '';
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function isWithinLastDays(value, days) {
  if (!value) {
    return false;
  }
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return false;
  }
  return Date.now() - timestamp.getTime() <= days * 24 * 60 * 60 * 1000;
}

function sortThreads(threads) {
  return [...threads].sort((first, second) => {
    if (Boolean(first.favorited) !== Boolean(second.favorited)) {
      return Number(Boolean(second.favorited)) - Number(Boolean(first.favorited));
    }
    return new Date(second.updatedAt ?? 0).getTime() - new Date(first.updatedAt ?? 0).getTime();
  });
}

const CANDIDATE_STAGE_OPTIONS = ['New', 'Considering', 'Strong fit'];

export default function EmployerDashboard({ user, token }) {
  const navigate = useNavigate();
  const storageKey = `skillsignal.employer-profile.${user.email}`;
  const [data, setData] = useState(null);
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState('');
  const [savedCandidates, setSavedCandidates] = useState([]);
  const [candidateFeed, setCandidateFeed] = useState([]);
  const [chatThreads, setChatThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState('');
  const [threadReplyDraft, setThreadReplyDraft] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [messageFilter, setMessageFilter] = useState('all');
  const [focusInput, setFocusInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [isComposingPost, setIsComposingPost] = useState(false);
  const [isAddingNeed, setIsAddingNeed] = useState(false);
  const [needForm, setNeedForm] = useState(emptyProject);
  const [editingNeedId, setEditingNeedId] = useState(null);
  const [feedWindow, setFeedWindow] = useState('recent');
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
    apiRequest('/api/employer/saved-candidates', { token })
      .then(setSavedCandidates)
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    async function loadCandidateFeed() {
      if (savedCandidates.length === 0) {
        if (isMounted) {
          setCandidateFeed([]);
        }
        return;
      }

      try {
        const candidateProfiles = await Promise.all(
          savedCandidates.map((candidate) => apiRequest(`/api/profiles/${candidate.developerProfileId}`).catch(() => null))
        );
        if (!isMounted) {
          return;
        }
        const nextFeed = candidateProfiles
          .filter(Boolean)
          .flatMap((candidateProfile) => (candidateProfile.posts ?? []).map((post) => ({
            authorProfileId: candidateProfile.id,
            authorName: candidateProfile.name,
            authorImage: candidateProfile.image,
            postId: post.id,
            createdAt: post.createdAt,
            body: post.body,
          })))
          .sort((first, second) => new Date(second.createdAt ?? 0).getTime() - new Date(first.createdAt ?? 0).getTime());
        setCandidateFeed(nextFeed);
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      }
    }

    loadCandidateFeed();

    return () => {
      isMounted = false;
    };
  }, [savedCandidates]);

  useEffect(() => {
    refreshMessages();
  }, [token]);

  useEffect(() => {
    const savedCandidateProfileIds = new Set(savedCandidates.map((candidate) => String(candidate.developerProfileId)));
    const filteredThreads = chatThreads.filter((thread) => {
      const partnerProfileId = String(getOtherParticipant(thread)?.profileId ?? '');
      if (messageFilter === 'requests') {
        return thread.requestReceived && !isThreadAcceptedForUser(thread);
      }
      if (messageFilter === 'favorites') {
        return Boolean(thread.favorited);
      }
      if (messageFilter === 'saved') {
        return savedCandidateProfileIds.has(partnerProfileId);
      }
      return true;
    });

    setActiveThreadId((current) => {
      if (filteredThreads.some((thread) => String(thread.id) === String(current))) {
        return current;
      }
      return String(filteredThreads[0]?.id ?? '');
    });
  }, [chatThreads, messageFilter, savedCandidates]);

  async function refreshMessages(preferredThreadId = null) {
    try {
      const inboxThreads = sortThreads(await apiRequest('/api/employer/messages', { token }));
      setChatThreads(inboxThreads);
      setActiveThreadId((current) => {
        if (preferredThreadId && inboxThreads.some((thread) => String(thread.id) === String(preferredThreadId))) {
          return String(preferredThreadId);
        }
        return current && inboxThreads.some((thread) => String(thread.id) === String(current))
          ? current
          : String(inboxThreads[0]?.id ?? '');
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleFavorite(thread) {
    setError('');
    try {
      const updatedThread = await apiRequest(`/api/employer/messages/${thread.id}/favorite`, {
        token,
        method: 'PATCH',
      });
      setChatThreads((current) => sortThreads(current.map((item) => (item.id === updatedThread.id ? updatedThread : item))));
      setActiveThreadId(String(updatedThread.id));
    } catch (err) {
      setError(err.message);
    }
  }

  function updateEmployerProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function stageKeyForProfile(profileId) {
    return String(profileId ?? '');
  }

  function stageForProfile(profileId) {
    return profile.candidateStages?.[stageKeyForProfile(profileId)] ?? 'New';
  }

  function updateCandidateStage(profileId, stage) {
    const key = stageKeyForProfile(profileId);
    setProfile((current) => ({
      ...current,
      candidateStages: {
        ...(current.candidateStages ?? {}),
        [key]: stage,
      },
    }));
  }

  function cycleCandidateStage(profileId) {
    const currentStage = stageForProfile(profileId);
    const currentIndex = CANDIDATE_STAGE_OPTIONS.indexOf(currentStage);
    const nextStage = CANDIDATE_STAGE_OPTIONS[(currentIndex + 1) % CANDIDATE_STAGE_OPTIONS.length];
    updateCandidateStage(profileId, nextStage);
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

  async function dismissMessageRequest(threadId) {
    setError('');
    setMessageStatus('');
    try {
      await apiRequest(`/api/employer/messages/${threadId}`, {
        token,
        method: 'DELETE',
      });
      await refreshMessages();
      setActiveThreadId((current) => (String(current) === String(threadId) ? '' : current));
    } catch (err) {
      setError(err.message);
    }
  }

  async function acceptMessageRequest(thread) {
    setError('');
    try {
      const updatedThread = await apiRequest(`/api/employer/messages/${thread.id}/accept`, {
        token,
        method: 'PATCH',
      });
      setChatThreads((current) => current.map((item) => (item.id === updatedThread.id ? updatedThread : item)));
      setActiveThreadId(String(updatedThread.id));
      setMessageStatus(`Accepted ${getOtherParticipant(updatedThread)?.name ?? 'this'} message request.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendReply(thread) {
    const nextReply = threadReplyDraft.trim();
    if (!nextReply) {
      return;
    }
    setError('');
    try {
      const updatedThread = await apiRequest(`/api/employer/messages/${thread.id}/reply`, {
        token,
        method: 'POST',
        body: JSON.stringify({ body: nextReply }),
      });
      setChatThreads((current) => {
        const nextThreads = current.map((item) => (item.id === updatedThread.id ? updatedThread : item));
        return [...nextThreads].sort((first, second) => new Date(second.updatedAt ?? 0).getTime() - new Date(first.updatedAt ?? 0).getTime());
      });
      setThreadReplyDraft('');
      setActiveThreadId(String(updatedThread.id));
      setMessageStatus(`Message sent to ${getOtherParticipant(updatedThread)?.name ?? 'user'}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  const posts = profile.posts ?? [];
  const visibleOwnPosts = feedWindow === 'recent'
    ? posts.filter((post) => isWithinLastDays(post.createdAt, 7))
    : posts;
  const visibleCandidateFeed = feedWindow === 'recent'
    ? candidateFeed.filter((post) => isWithinLastDays(post.createdAt, 7))
    : candidateFeed;
  const dashboardTabs = [
    { id: 'profile', label: 'My Profile', count: null },
    { id: 'needs', label: 'Needs', count: profile.projects.length },
    { id: 'proof', label: 'Messages', count: chatThreads.length },
    { id: 'saved', label: 'Saved Candidates', count: savedCandidates.length },
    { id: 'feed', label: 'Updates', count: posts.length + candidateFeed.length },
  ];
  const savedCandidateProfileIds = new Set(savedCandidates.map((candidate) => String(candidate.developerProfileId)));
  const filteredChatThreads = chatThreads.filter((thread) => {
    const partnerProfileId = String(getOtherParticipant(thread)?.profileId ?? '');
    if (messageFilter === 'requests') {
      return thread.requestReceived && !isThreadAcceptedForUser(thread);
    }
    if (messageFilter === 'favorites') {
      return Boolean(thread.favorited);
    }
    if (messageFilter === 'saved') {
      return savedCandidateProfileIds.has(partnerProfileId);
    }
    return true;
  });
  const requestThreadCount = chatThreads.filter((thread) => thread.requestReceived && !isThreadAcceptedForUser(thread)).length;
  const favoriteThreadCount = chatThreads.filter((thread) => Boolean(thread.favorited)).length;
  const savedThreadCount = chatThreads.filter((thread) => (
    savedCandidateProfileIds.has(String(getOtherParticipant(thread)?.profileId ?? ''))
  )).length;
  const activeThread = filteredChatThreads.find((thread) => String(thread.id) === String(activeThreadId)) ?? null;
  const activeThreadPartner = activeThread ? getOtherParticipant(activeThread) : null;
  const canReplyToActiveThread = activeThread
    ? isThreadAcceptedForUser(activeThread)
    : false;

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
                <h2>Needs</h2>
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
                  <article className="candidate-card proof-signal-card saved-candidate-card" key={candidate.id}>
                    {candidate.developerImage ? (
                      <img src={candidate.developerImage} alt={candidate.developerName} />
                    ) : (
                      <div className="profile-placeholder">{candidate.developerName?.[0] ?? 'D'}</div>
                    )}
                    <div className="saved-candidate-card-copy">
                      <div className="saved-candidate-card-main">
                        <div className="saved-candidate-title-stack">
                          <div className="saved-candidate-name-row">
                          <h3>{candidate.developerName}</h3>
                          <button
                            className={`candidate-stage-button ${stageForProfile(candidate.developerProfileId).toLowerCase().replace(' ', '-')}`}
                            type="button"
                            onClick={() => cycleCandidateStage(candidate.developerProfileId)}
                            aria-label={`Candidate label: ${stageForProfile(candidate.developerProfileId)}. Click to change.`}
                          >
                            {stageForProfile(candidate.developerProfileId)}
                          </button>
                          </div>
                          <p>{candidate.developerTitle}</p>
                        </div>
                        <div className="skill-list">
                          {(candidate.skills ?? []).slice(0, 5).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                      </div>
                      <div className="saved-candidate-side-actions">
                        <Link className="saved-candidate-view-link" to={`/profiles/${candidate.developerProfileId}`}>
                          <ExternalLink size={16} />
                          <span>View profile</span>
                        </Link>
                        <button
                          className="delete-button destructive-button"
                          type="button"
                          onClick={() => removeSavedCandidate(candidate.id)}
                          aria-label={`Remove ${candidate.developerName} from saved candidates`}
                        >
                          <Trash2 size={16} />
                        </button>
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
                <h2>Messages</h2>
                <p className="subtle">Direct conversations, message requests, and follow-up chats with developers you are considering.</p>
              </div>
              <Link className="secondary-button" to="/profiles?type=DEVELOPER">
                <Search size={16} />
                <span>Find more</span>
              </Link>
            </div>
            <div className="inbox-switcher employer-message-filters" role="tablist" aria-label="Message filters">
              <button
                className={messageFilter === 'all' ? 'active' : ''}
                type="button"
                onClick={() => setMessageFilter('all')}
              >
                <span>All messages</span>
                <strong>{chatThreads.length}</strong>
              </button>
              <button
                className={messageFilter === 'requests' ? 'active' : ''}
                type="button"
                onClick={() => setMessageFilter('requests')}
              >
                <span>Requests</span>
                <strong>{requestThreadCount}</strong>
              </button>
              <button
                className={messageFilter === 'favorites' ? 'active' : ''}
                type="button"
                onClick={() => setMessageFilter('favorites')}
              >
                <span>Favorites</span>
                <strong>{favoriteThreadCount}</strong>
              </button>
              <button
                className={messageFilter === 'saved' ? 'active' : ''}
                type="button"
                onClick={() => setMessageFilter('saved')}
              >
                <span>Saved candidates</span>
                <strong>{savedThreadCount}</strong>
              </button>
            </div>
            {filteredChatThreads.length === 0 ? (
              <div className="empty-state">
                <Send size={28} />
                <h3>
                  {messageFilter === 'requests'
                    ? 'No message requests'
                    : messageFilter === 'favorites'
                      ? 'No favorite messages'
                    : messageFilter === 'saved'
                      ? 'No saved candidate messages'
                      : 'No messages yet'}
                </h3>
                <p>
                  {messageFilter === 'requests'
                    ? 'New developer outreach will appear here first so you can review it before replying.'
                    : messageFilter === 'favorites'
                      ? 'Star the conversations you want to prioritize and they will appear together in this filtered view.'
                    : messageFilter === 'saved'
                      ? 'When saved candidates message you, their threads will be easy to revisit from this filtered view.'
                      : 'When developers reach out about your hiring needs, their private conversation threads will appear here.'}
                </p>
                <Link className="secondary-button" to="/profiles?type=DEVELOPER">
                  <Search size={16} />
                  <span>{messageFilter === 'saved' ? 'Find developers' : 'Browse developers'}</span>
                </Link>
              </div>
            ) : (
              <div className="message-layout">
                <div className="message-thread-list">
                  {filteredChatThreads.map((thread) => {
                    const partner = getOtherParticipant(thread);
                    const lastMessage = thread.messages?.at(-1);
                    const isActive = String(activeThreadId) === String(thread.id);
                    return (
                      <article className={`message-thread-card ${isActive ? 'active' : ''}`} key={thread.id}>
                        <button
                          className="message-thread-card-main"
                          type="button"
                          onClick={() => setActiveThreadId(String(thread.id))}
                        >
                          <div className="message-card-top">
                            <div className="message-card-identity">
                              {partner?.image ? (
                                <img src={partner.image} alt={partner.name} />
                              ) : (
                                <div className="profile-placeholder">{partner?.name?.[0] ?? 'D'}</div>
                              )}
                              <div className="message-card-copy">
                                <div className="message-list-topline">
                                  {partner?.profileId ? (
                                    <strong>
                                      <button
                                        className="message-name-link"
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          navigate(`/profiles/${partner.profileId}`);
                                        }}
                                      >
                                        {partner?.name ?? 'User'}
                                      </button>
                                    </strong>
                                  ) : (
                                    <strong>{partner?.name ?? 'User'}</strong>
                                  )}
                                </div>
                                <p className="message-card-title">{partner?.title ?? 'Developer'}</p>
                              </div>
                            </div>
                            <div className="message-card-actions">
                              <button
                                className={`candidate-stage-button candidate-stage-button-compact ${stageForProfile(partner?.profileId).toLowerCase().replace(' ', '-')}`}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  cycleCandidateStage(partner?.profileId);
                                }}
                                aria-label={`Candidate label: ${stageForProfile(partner?.profileId)}. Click to change.`}
                              >
                                {stageForProfile(partner?.profileId)}
                              </button>
                              <button
                                className={`message-favorite-button ${thread.favorited ? 'active' : ''}`}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleFavorite(thread);
                                }}
                                aria-label={thread.favorited ? `Remove ${partner?.name ?? 'conversation'} from favorites` : `Favorite ${partner?.name ?? 'conversation'}`}
                              >
                                <Star size={16} fill={thread.favorited ? 'currentColor' : 'none'} />
                              </button>
                            </div>
                          </div>
                          <div className="message-card-body">
                            <p>{formatThreadPreview(thread.preview || lastMessage?.body || 'No messages yet.')}</p>
                          </div>
                          <div className="message-thread-card-footer">
                            <span className="compact-empty-copy">{thread.requestReceived && !isThreadAcceptedForUser(thread) ? '' : 'Private chat'}</span>
                            <span className="message-last-update">Last update: {formatThreadTimestamp(thread.updatedAt)}</span>
                          </div>
                        </button>
                        {thread.requestReceived && !isThreadAcceptedForUser(thread) && (
                          <div className="message-request-actions">
                            <button className="primary-button" type="button" onClick={() => acceptMessageRequest(thread)}>
                              <CheckCircle2 size={16} />
                              <span>Accept</span>
                            </button>
                            <button className="secondary-button" type="button" onClick={() => dismissMessageRequest(thread.id)}>
                              Decline
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                <div className="message-thread-panel">
                  {activeThread && activeThreadPartner ? (
                    <>
                      <div className="message-thread-panel-header">
                        <div className="message-thread-panel-title">
                          <h3>{activeThreadPartner.name}</h3>
                          <p className="subtle">{activeThreadPartner.title}</p>
                        </div>
                        <button
                          className={`candidate-stage-button candidate-stage-control-inline ${stageForProfile(activeThreadPartner.profileId).toLowerCase().replace(' ', '-')}`}
                          type="button"
                          onClick={() => cycleCandidateStage(activeThreadPartner.profileId)}
                          aria-label={`Candidate label: ${stageForProfile(activeThreadPartner.profileId)}. Click to change.`}
                        >
                          {stageForProfile(activeThreadPartner.profileId)}
                        </button>
                      </div>

                      <div className="chat-message-list">
                        {(activeThread.messages ?? []).map((message) => {
                          const isOwnMessage = String(message.senderUserId) === String(user.userId);
                          const senderLabel = isOwnMessage ? 'Me' : (message.senderName ?? activeThreadPartner.name ?? 'User');
                          return (
                            <article className={`chat-bubble ${isOwnMessage ? 'own' : ''}`} key={message.id}>
                              <div className="chat-message-meta">
                                <strong>{senderLabel}</strong>
                                <span>{formatChatTime(message.createdAt)}</span>
                              </div>
                              <p>{message.body}</p>
                            </article>
                          );
                        })}
                      </div>

                      {activeThread.requestReceived && !isThreadAcceptedForUser(activeThread) && (
                        <p className="chat-panel-note">This is a message request. Accept it from the left to unlock replies.</p>
                      )}

                      <form
                        className="chat-reply-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          sendReply(activeThread);
                        }}
                      >
                        <input
                          className="chat-reply-input"
                          type="text"
                          value={threadReplyDraft}
                          onChange={(event) => setThreadReplyDraft(event.target.value)}
                          placeholder={canReplyToActiveThread ? `Message ${activeThreadPartner.name}...` : 'Accept this message request before replying.'}
                          disabled={!canReplyToActiveThread}
                        />
                        <button className="primary-button chat-send-button" type="submit" disabled={!canReplyToActiveThread || !threadReplyDraft.trim()}>
                          <Send size={16} />
                          <span>Send</span>
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
            )}
            {messageStatus && <p className="connection-toast inbox-toast">{messageStatus}</p>}
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

        {activeSection === 'feed' && (
          <div className="developer-feed-grid">
            <section className="workspace-panel candidate-panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Your updates</h2>
                  <p className="subtle">
                    {feedWindow === 'recent'
                      ? 'Recent hiring updates from the last 7 days, with older posts still available when you want the full history.'
                      : 'Your full hiring update history, including older posts developers can still find on your public profile.'}
                  </p>
                </div>
                <div className="feed-panel-actions">
                  <div className="feed-window-toggle" role="tablist" aria-label="Feed range">
                    <button
                      className={feedWindow === 'recent' ? 'active' : ''}
                      type="button"
                      onClick={() => setFeedWindow('recent')}
                    >
                      This week
                    </button>
                    <button
                      className={feedWindow === 'all' ? 'active' : ''}
                      type="button"
                      onClick={() => setFeedWindow('all')}
                    >
                      All time
                    </button>
                  </div>
                  <button className="primary-button" type="button" onClick={() => setIsComposingPost((current) => !current)}>
                    <Plus size={18} />
                    <span>Post</span>
                  </button>
                </div>
              </div>

              {isComposingPost && (
                <form className="post-form compact-post-form" onSubmit={addPost}>
                  <textarea
                    value={postInput}
                    onChange={(event) => setPostInput(event.target.value)}
                    placeholder="We are looking for a junior React developer who can improve dashboard UX and explain their implementation clearly."
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
                {visibleOwnPosts.length === 0 ? (
                  <article className="empty-feed">
                    <MessageSquareText size={28} />
                    <p>
                      {posts.length === 0
                        ? 'Post short hiring updates so developers can see what you are actively hiring for and what kind of work is live right now.'
                        : 'No posts from the last 7 days yet. Switch to all time to browse your older hiring updates.'}
                    </p>
                  </article>
                ) : (
                  visibleOwnPosts.map((post) => (
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

            <section className="workspace-panel connection-panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Saved candidate updates</h2>
                  <p className="subtle">
                    {feedWindow === 'recent'
                      ? 'Recent posts from developers you already saved, so you can spot new work without scanning endless history.'
                      : 'Every saved candidate update in one place when you want the longer history.'}
                  </p>
                </div>
                <MessageSquareText size={20} />
              </div>
              {visibleCandidateFeed.length === 0 ? (
                <div className="empty-state">
                  <MessageSquareText size={28} />
                  <h3>{candidateFeed.length === 0 ? 'No saved candidate updates yet' : 'No recent saved candidate updates'}</h3>
                  <p>
                    {candidateFeed.length === 0
                      ? 'Save developers whose work looks promising, then their profile updates will appear here.'
                      : 'Nothing new from the last 7 days. Switch to all time if you want to browse older saved candidate activity.'}
                  </p>
                  <Link className="secondary-button" to="/profiles?type=DEVELOPER">
                    <ExternalLink size={16} />
                    <span>Find developers</span>
                  </Link>
                </div>
              ) : (
                <div className="feed-list connection-feed-list">
                  {visibleCandidateFeed.map((post) => (
                    <article className="feed-post" key={`${post.authorProfileId}-${post.postId ?? post.createdAt}`}>
                      <div className="feed-post-header">
                        <div className="feed-author">
                          {post.authorImage ? (
                            <img src={post.authorImage} alt={`${post.authorName} avatar`} />
                          ) : (
                            <div className="profile-placeholder">{post.authorName?.[0] ?? 'D'}</div>
                          )}
                          <div>
                            <strong>{post.authorName}</strong>
                            <span>{formatPostDate(post.createdAt)}</span>
                          </div>
                        </div>
                        <Link className="secondary-button" to={`/profiles/${post.authorProfileId}`}>Profile</Link>
                      </div>
                      <p>{post.body}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </section>
  );
}
