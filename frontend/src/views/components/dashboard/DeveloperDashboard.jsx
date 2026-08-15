import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  Globe,
  ImagePlus,
  Linkedin,
  Mail,
  MessageSquareText,
  Pencil,
  Plus,
  Send,
  Star,
  Trash2,
  UserRound,
} from 'lucide-react';
import { apiRequest } from '../../../api/client.js';
import ContactLinks from '../profile/ContactLinks.jsx';
import {
  emptyProject,
  formatPostDate,
  normalizeProjects,
  readStoredDeveloperProfile,
  toProfilePayload,
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

function sortThreads(threads) {
  return [...threads].sort((first, second) => {
    if (Boolean(first.favorited) !== Boolean(second.favorited)) {
      return Number(Boolean(second.favorited)) - Number(Boolean(first.favorited));
    }
    return new Date(second.updatedAt ?? 0).getTime() - new Date(first.updatedAt ?? 0).getTime();
  });
}

function isWithinLastDays(value, days) {
  if (!value) {
    return false;
  }
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return false;
  }
  const diffMs = Date.now() - timestamp.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}

export default function DeveloperDashboard({ user, token }) {
  const navigate = useNavigate();
  const storageKey = `skillsignal.developer-profile.${user.email}`;
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [connectionFeed, setConnectionFeed] = useState([]);
  const [chatThreads, setChatThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState('');
  const [threadReplyDraft, setThreadReplyDraft] = useState('');
  const [messageFilter, setMessageFilter] = useState('all');
  const [messageStatus, setMessageStatus] = useState('');
  const [isComposingPost, setIsComposingPost] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [profileSaveStatus, setProfileSaveStatus] = useState('');
  const [projectSaveStatus, setProjectSaveStatus] = useState('');
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [feedWindow, setFeedWindow] = useState('recent');
  const [profile, setProfile] = useState(() => readStoredDeveloperProfile(storageKey));

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ ...profile, name: user.name, email: user.email }));
  }, [profile, storageKey, user.email, user.name]);

  useEffect(() => {
    apiRequest('/api/developer/profile', { token })
      .then((profileData) => {
        setBackendData(profileData);
        const storedProfile = readStoredDeveloperProfile(storageKey);
        const backendProjects = normalizeProjects(profileData.projects);
        const backendPosts = profileData.posts ?? [];
        const shouldSyncStoredProjects = storedProfile.projects.length > 0 && backendProjects.length === 0;
        const shouldSyncStoredPosts = storedProfile.posts.length > 0 && backendPosts.length === 0;
        const nextProfile = {
          ...storedProfile,
          isDisplayed: profileData.displayed,
          title: profileData.title || storedProfile.title,
          summary: profileData.summary || storedProfile.summary,
          photo: profileData.image || storedProfile.photo,
          skills: profileData.skills?.length > 0 ? profileData.skills : storedProfile.skills,
          contactLinks: {
            ...(storedProfile.contactLinks ?? {}),
            ...(profileData.contactLinks ?? {}),
          },
          preferences: {
            ...(storedProfile.preferences ?? {}),
            ...(profileData.preferences ?? {}),
          },
          projects: backendProjects.length > 0 ? backendProjects : storedProfile.projects,
          posts: backendPosts.length > 0 ? backendPosts : storedProfile.posts,
        };
        setProfile((current) => ({
          ...current,
          ...nextProfile,
        }));
        if (shouldSyncStoredProjects || shouldSyncStoredPosts) {
          apiRequest('/api/developer/profile', {
            token,
            method: 'PATCH',
            body: JSON.stringify(toProfilePayload(nextProfile, profileData.displayed)),
          })
            .then(setBackendData)
            .catch((err) => setError(err.message));
        }
      })
      .catch((err) => setError(err.message));
  }, [storageKey, token]);

  useEffect(() => {
    refreshConnections();
  }, [token]);

  useEffect(() => {
    refreshMessages();
  }, [token]);

  useEffect(() => {
    const filteredThreads = chatThreads.filter((thread) => {
      if (messageFilter === 'requests') {
        return thread.requestReceived && !isThreadAcceptedForUser(thread);
      }
      if (messageFilter === 'favorites') {
        return Boolean(thread.favorited);
      }
      return true;
    });

    setActiveThreadId((current) => {
      if (filteredThreads.some((thread) => String(thread.id) === String(current))) {
        return current;
      }
      return String(filteredThreads[0]?.id ?? '');
    });
  }, [chatThreads, messageFilter]);

  async function refreshConnections() {
    try {
      const [acceptedConnections, requests, feed] = await Promise.all([
        apiRequest('/api/developer/connections', { token }),
        apiRequest('/api/developer/connections/requests', { token }),
        apiRequest('/api/developer/feed', { token }),
      ]);
      setConnections(acceptedConnections);
      setConnectionRequests(requests);
      setConnectionFeed(feed);
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshMessages(preferredThreadId = null) {
    try {
      const inboxThreads = sortThreads(await apiRequest('/api/developer/messages', { token }));
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
      const updatedThread = await apiRequest(`/api/developer/messages/${thread.id}/favorite`, {
        token,
        method: 'PATCH',
      });
      setChatThreads((current) => sortThreads(current.map((item) => (item.id === updatedThread.id ? updatedThread : item))));
      setActiveThreadId(String(updatedThread.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeConnection(connectionId) {
    setError('');
    const previousConnections = connections;
    const nextConnections = connections.filter((connection) => connection.id !== connectionId);
    const removedConnection = connections.find((connection) => connection.id === connectionId);
    const otherProfileId = removedConnection
      ? String(removedConnection.requesterProfileId) === String(backendData?.id)
        ? removedConnection.receiverProfileId
        : removedConnection.requesterProfileId
      : null;

    setConnections(nextConnections);
    if (otherProfileId !== null) {
      setConnectionFeed((current) => current.filter((post) => String(post.authorProfileId) !== String(otherProfileId)));
    }
    try {
      await apiRequest(`/api/developer/connections/${connectionId}`, {
        token,
        method: 'DELETE',
      });
      await refreshConnections();
    } catch (err) {
      setConnections(previousConnections);
      await refreshConnections();
      setError(err.message);
    }
  }

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateContactLink(field, value) {
    setProfile((current) => ({
      ...current,
      contactLinks: {
        ...(current.contactLinks ?? {}),
        [field]: value,
      },
    }));
  }

  function updatePreference(field, value) {
    setProfile((current) => ({
      ...current,
      preferences: {
        ...(current.preferences ?? {}),
        [field]: value,
      },
    }));
  }

  function toggleWorkType(workType) {
    setProfile((current) => {
      const currentTypes = current.preferences?.workTypes ?? [];
      const nextTypes = currentTypes.includes(workType)
        ? currentTypes.filter((item) => item !== workType)
        : [...currentTypes, workType];
      return {
        ...current,
        preferences: {
          ...(current.preferences ?? {}),
          workTypes: nextTypes,
        },
      };
    });
  }

  function readImage(file, onLoad) {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result);
    reader.readAsDataURL(file);
  }

  function handlePhotoChange(event) {
    readImage(event.target.files?.[0], (result) => updateProfile('photo', result));
    event.target.value = '';
  }

  function addSkill(event) {
    event.preventDefault();
    const nextSkill = skillInput.trim();
    if (!nextSkill || profile.skills.some((skill) => skill.toLowerCase() === nextSkill.toLowerCase())) {
      return;
    }
    updateProfile('skills', [...profile.skills, nextSkill]);
    setSkillInput('');
  }

  function removeSkill(skillToRemove) {
    updateProfile(
      'skills',
      profile.skills.filter((skill) => skill !== skillToRemove)
    );
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
      await saveDeveloperProfile(nextProfile);
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
      await saveDeveloperProfile(nextProfile);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
  }

  function updateProjectField(field, value) {
    setProjectForm((current) => ({ ...current, [field]: value }));
  }

  function handleProjectImages(event) {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    files.forEach((file) => {
      readImage(file, (result) => {
        setProjectForm((current) => ({
          ...current,
          images: [...current.images, result].slice(0, 4),
        }));
      });
    });
    event.target.value = '';
  }

  function sortProjects(projects) {
    return [...projects].sort((first, second) => Number(Boolean(second.featured)) - Number(Boolean(first.featured)));
  }

  function resetProjectForm() {
    setProjectForm(emptyProject);
    setEditingProjectId(null);
    setIsAddingProject(false);
  }

  function startEditingProject(project) {
    setProjectForm({
      name: project.name ?? '',
      description: project.description ?? '',
      githubUrl: project.githubUrl ?? '',
      liveUrl: project.liveUrl ?? '',
      skills: (project.skills ?? []).join(', '),
      images: project.images ?? [],
      featured: Boolean(project.featured),
    });
    setEditingProjectId(project.id);
    setIsAddingProject(true);
  }

  async function saveDeveloperProfile(nextProfile, displayed = nextProfile.isDisplayed) {
    setError('');
    const profileData = await apiRequest('/api/developer/profile', {
      token,
      method: 'PATCH',
      body: JSON.stringify(toProfilePayload(nextProfile, displayed)),
    });
    setBackendData(profileData);
    setProfile((current) => ({
      ...current,
      isDisplayed: profileData.displayed,
      projects: normalizeProjects(profileData.projects),
      posts: profileData.posts ?? [],
    }));
    return profileData;
  }

  async function saveProject(event) {
    event.preventDefault();
    const name = projectForm.name.trim();
    const description = projectForm.description.trim();
    if (!name || !description) {
      return;
    }
    const project = {
      ...projectForm,
      id: crypto.randomUUID(),
      name,
      description,
      githubUrl: projectForm.githubUrl.trim(),
      liveUrl: projectForm.liveUrl.trim(),
      featured: Boolean(projectForm.featured),
      skills: projectForm.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    };
    const nextProjects = editingProjectId
      ? profile.projects.map((existingProject) => (existingProject.id === editingProjectId ? { ...project, id: editingProjectId } : existingProject))
      : [project, ...profile.projects];
    const nextProfile = { ...profile, projects: sortProjects(nextProjects) };
    setProfile(nextProfile);
    resetProjectForm();
    try {
      await saveDeveloperProfile(nextProfile);
      setProjectSaveStatus(editingProjectId ? 'Saved' : 'Added');
      window.setTimeout(() => setProjectSaveStatus(''), 1800);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
  }

  async function removeProject(projectId) {
    const nextProfile = {
      ...profile,
      projects: profile.projects.filter((project) => project.id !== projectId),
    };
    setProfile(nextProfile);
    try {
      await saveDeveloperProfile(nextProfile);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
  }

  async function toggleFeaturedProject(projectId) {
    const nextProfile = {
      ...profile,
      projects: sortProjects(
        profile.projects.map((project) => (
          project.id === projectId ? { ...project, featured: !project.featured } : project
        ))
      ),
    };
    setProfile(nextProfile);
    try {
      await saveDeveloperProfile(nextProfile);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
  }

  async function updateDisplayStatus(displayed) {
    const nextProfile = { ...profile, isDisplayed: displayed };
    setProfile(nextProfile);
    try {
      await saveDeveloperProfile(nextProfile, displayed);
    } catch (err) {
      setProfile(profile);
      setError(err.message);
    }
  }

  async function saveContactLinks() {
    try {
      await saveDeveloperProfile(profile);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveDeveloperPreferences() {
    try {
      await saveDeveloperProfile(profile);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveProfileDetails() {
    try {
      await saveDeveloperProfile(profile);
      setProfileSaveStatus('Saved');
      window.setTimeout(() => setProfileSaveStatus(''), 1800);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleProfileFieldKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    event.preventDefault();
    saveProfileDetails();
  }

  async function acceptConnection(connectionId) {
    setError('');
    try {
      await apiRequest(`/api/developer/connections/${connectionId}/accept`, {
        token,
        method: 'PATCH',
      });
      await refreshConnections();
    } catch (err) {
      setError(err.message);
    }
  }

  async function declineConnection(connectionId) {
    setError('');
    try {
      await apiRequest(`/api/developer/connections/${connectionId}/decline`, {
        token,
        method: 'PATCH',
      });
      await refreshConnections();
    } catch (err) {
      setError(err.message);
    }
  }

  async function dismissMessageRequest(threadId) {
    setError('');
    setMessageStatus('');
    try {
      await apiRequest(`/api/developer/messages/${threadId}`, {
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
      const updatedThread = await apiRequest(`/api/developer/messages/${thread.id}/accept`, {
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
      const updatedThread = await apiRequest(`/api/developer/messages/${thread.id}/reply`, {
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
      setMessageStatus(`Message sent to ${getOtherParticipant(updatedThread)?.name ?? 'developer'}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  const completionItems = [
    { label: 'Photo', complete: Boolean(profile.photo) },
    { label: 'Skills', complete: profile.skills.length >= 3 },
    { label: 'Projects', complete: profile.projects.length > 0 },
  ];
  const completion = Math.round((completionItems.filter((item) => item.complete).length / completionItems.length) * 100);
  const proofQuality = backendData?.proofQuality;
  const posts = profile.posts ?? [];
  const visibleOwnPosts = feedWindow === 'recent'
    ? posts.filter((post) => isWithinLastDays(post.createdAt, 7))
    : posts;
  const visibleConnectionFeed = feedWindow === 'recent'
    ? connectionFeed.filter((post) => isWithinLastDays(post.createdAt, 7))
    : connectionFeed;
  const qualityChecklist = [
    { label: 'Add a clear profile photo', complete: Boolean(profile.photo) },
    { label: 'Add at least 3 core skills', complete: profile.skills.length >= 3 },
    {
      label: 'Set availability and work focus',
      complete: Boolean(profile.preferences?.availability) && (profile.preferences?.workTypes ?? []).length > 0,
    },
    {
      label: 'Add professional contact links',
      complete: Object.values(profile.contactLinks ?? {}).some(Boolean),
    },
    { label: 'Publish your strongest project', complete: profile.projects.length > 0 },
    {
      label: 'Include a GitHub or live link',
      complete: profile.projects.some((project) => project.githubUrl || project.liveUrl),
    },
    {
      label: 'Use screenshots to show the result',
      complete: profile.projects.some((project) => (project.images ?? []).length > 0),
    },
    {
      label: 'Explain what you personally built',
      complete: profile.projects.some((project) => (project.description ?? '').trim().length >= 80),
    },
  ];
  const dashboardTabs = [
    { id: 'profile', label: 'My Profile', count: null },
    { id: 'projects', label: 'Projects', count: profile.projects.length },
    { id: 'inbox', label: 'Messages', count: chatThreads.length },
    { id: 'connections', label: 'Connections', count: connectionRequests.length + connections.length },
    { id: 'feed', label: 'Updates', count: posts.length + connectionFeed.length },
  ];
  const connectedProfileIds = new Set(
    connections.map((connection) => (
      String(
        String(connection.requesterProfileId) === String(backendData?.id)
          ? connection.receiverProfileId
          : connection.requesterProfileId,
      )
    )),
  );
  const filteredChatThreads = chatThreads.filter((thread) => {
    const partnerProfileId = String(getOtherParticipant(thread)?.profileId ?? '');
    if (messageFilter === 'requests') {
      return thread.requestReceived && !isThreadAcceptedForUser(thread);
    }
    if (messageFilter === 'favorites') {
      return Boolean(thread.favorited);
    }
    if (messageFilter === 'connections') {
      return connectedProfileIds.has(partnerProfileId);
    }
    return true;
  });
  const requestThreadCount = chatThreads.filter((thread) => thread.requestReceived && !isThreadAcceptedForUser(thread)).length;
  const favoriteThreadCount = chatThreads.filter((thread) => Boolean(thread.favorited)).length;
  const connectedThreadCount = chatThreads.filter((thread) => (
    connectedProfileIds.has(String(getOtherParticipant(thread)?.profileId ?? ''))
  )).length;
  const activeThread = filteredChatThreads.find((thread) => String(thread.id) === String(activeThreadId)) ?? null;
  const activeThreadPartner = activeThread ? getOtherParticipant(activeThread) : null;
  const canReplyToActiveThread = activeThread
    ? isThreadAcceptedForUser(activeThread)
    : false;

  return (
    <section className="dashboard developer-dashboard">
      <header className="developer-header">
        <div className="developer-identity">
          <div className="photo-frame">
            {profile.photo ? <img src={profile.photo} alt={`${user.name} profile`} /> : <UserRound size={56} />}
            <label className="photo-upload" htmlFor="developer-photo">
              <Camera size={17} />
              <span>Upload photo</span>
            </label>
            <input id="developer-photo" type="file" accept="image/*" onChange={handlePhotoChange} />
          </div>
          <div>
            <p className="eyebrow">Developer dashboard</p>
            <h1>{user.name}</h1>
            <label className="inline-field" htmlFor="developer-title">
              <span>Professional title</span>
              <input
                id="developer-title"
                value={profile.title}
                onChange={(event) => updateProfile('title', event.target.value)}
                onKeyDown={handleProfileFieldKeyDown}
                placeholder="Junior frontend developer"
              />
            </label>
          </div>
        </div>
        <div className="employer-header-side developer-header-side">
          <label className="compact-visibility-toggle" htmlFor="developer-profile-publication">
            <span>Toggle visibility</span>
            <input
              id="developer-profile-publication"
              type="checkbox"
              checked={profile.isDisplayed}
              onChange={(event) => updateDisplayStatus(event.target.checked)}
            />
          </label>
          <div className="profile-readiness" aria-label="Profile readiness">
            <strong>{proofQuality?.score ?? completion}%</strong>
            <span>{proofQuality?.label ?? 'profile ready'}</span>
            <div className="readiness-bar">
              <span style={{ width: `${proofQuality?.score ?? completion}%` }} />
            </div>
          </div>
        </div>
      </header>

      <nav className="employer-dashboard-tabs" aria-label="Developer dashboard sections">
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

      <section className="employer-workspace developer-workspace">
        {activeSection === 'profile' && (
          <div className="employer-profile-grid">
            <div className="employer-profile-editor-column">
              <section className="workspace-panel profile-editor">
                <h2>Profile summary</h2>
                <label htmlFor="developer-summary">
                  Summary
                  <textarea
                    id="developer-summary"
                    value={profile.summary}
                    onChange={(event) => updateProfile('summary', event.target.value)}
                    placeholder="Describe the kind of developer you are, what you build, and what roles you are looking for."
                  />
                </label>
              </section>

              <section className="workspace-panel">
                <div className="panel-heading-row">
                  <div>
                    <h2>Main skills</h2>
                    <p className="subtle">{profile.skills.length} added</p>
                  </div>
                </div>
                <form className="skill-entry" onSubmit={addSkill}>
                  <input
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    placeholder="React, Java, AWS"
                  />
                  <button className="primary-button icon-button" type="submit" aria-label="Add skill">
                    <Plus size={18} />
                  </button>
                </form>
                <div className="editable-skill-list">
                  {profile.skills.map((skill) => (
                    <button className="remove-chip-button" key={skill} type="button" onClick={() => removeSkill(skill)}>
                      <span>{skill}</span>
                      <Trash2 size={14} />
                    </button>
                  ))}
                </div>
              </section>

              <section className="workspace-panel developer-preferences-editor">
                <div className="panel-heading-row">
                  <div>
                    <h2>Looking for</h2>
                    <p className="subtle">These details appear on your full View profile page, not on the searchable profile card.</p>
                  </div>
                </div>
                <div className="two-column-fields">
                  <label htmlFor="developer-availability">
                    Availability
                    <select
                      id="developer-availability"
                      value={profile.preferences?.availability ?? ''}
                      onChange={(event) => updatePreference('availability', event.target.value)}
                      onKeyDown={handleProfileFieldKeyDown}
                    >
                      <option value="">Choose availability</option>
                      <option value="Open to junior roles">Open to junior roles</option>
                      <option value="Open to freelance projects">Open to freelance projects</option>
                      <option value="Open to internships">Open to internships</option>
                      <option value="Open to collaborations">Open to collaborations</option>
                      <option value="Not currently looking">Not currently looking</option>
                    </select>
                  </label>
                  <label htmlFor="developer-remote-preference">
                    Work preference
                    <input
                      id="developer-remote-preference"
                      value={profile.preferences?.remotePreference ?? ''}
                      onChange={(event) => updatePreference('remotePreference', event.target.value)}
                      onKeyDown={handleProfileFieldKeyDown}
                      placeholder="Remote, hybrid, London, UK only"
                    />
                  </label>
                </div>
                <div className="work-type-picker" aria-label="Preferred work types">
                  {['Frontend', 'Backend', 'Full-stack', 'APIs', 'Dashboards', 'Internal tools'].map((workType) => (
                    <button
                      key={workType}
                      className={(profile.preferences?.workTypes ?? []).includes(workType) ? 'active' : ''}
                      type="button"
                      onClick={() => toggleWorkType(workType)}
                    >
                      {workType}
                    </button>
                  ))}
                </div>
              </section>

              <section className="workspace-panel contact-links-editor">
                <div className="panel-heading-row">
                  <div>
                    <h2>Contact links</h2>
                    <p className="subtle">Add the professional places employers should use to learn more or contact you.</p>
                  </div>
                </div>
                <div className="contact-link-fields">
                  <label htmlFor="developer-linkedin">
                    <span><Linkedin size={17} /> LinkedIn</span>
                    <input
                      id="developer-linkedin"
                      type="url"
                      value={profile.contactLinks?.linkedinUrl ?? ''}
                      onChange={(event) => updateContactLink('linkedinUrl', event.target.value)}
                      onKeyDown={handleProfileFieldKeyDown}
                      placeholder="https://linkedin.com/in/your-name"
                    />
                  </label>
                  <label htmlFor="developer-github-contact">
                    <span><Github size={17} /> GitHub</span>
                    <input
                      id="developer-github-contact"
                      type="url"
                      value={profile.contactLinks?.githubUrl ?? ''}
                      onChange={(event) => updateContactLink('githubUrl', event.target.value)}
                      onKeyDown={handleProfileFieldKeyDown}
                      placeholder="https://github.com/your-username"
                    />
                  </label>
                  <label htmlFor="developer-contact-email">
                    <span><Mail size={17} /> Email</span>
                    <input
                      id="developer-contact-email"
                      type="email"
                      value={profile.contactLinks?.email ?? ''}
                      onChange={(event) => updateContactLink('email', event.target.value)}
                      onKeyDown={handleProfileFieldKeyDown}
                      placeholder="you@example.com"
                    />
                  </label>
                  <label htmlFor="developer-website">
                    <span><Globe size={17} /> Website</span>
                    <input
                      id="developer-website"
                      type="url"
                      value={profile.contactLinks?.websiteUrl ?? ''}
                      onChange={(event) => updateContactLink('websiteUrl', event.target.value)}
                      onKeyDown={handleProfileFieldKeyDown}
                      placeholder="https://your-portfolio.dev"
                    />
                  </label>
                </div>
              </section>

              <section className="workspace-panel">
                <div className="panel-heading-row quality-heading">
                  <div>
                    <h2>Profile quality</h2>
                    <p className="subtle">Use this as a quick QA check before employers review your work.</p>
                  </div>
                  <Link className="secondary-button" to="/profiles/me">
                    <ExternalLink size={16} />
                    <span>View profile</span>
                  </Link>
                </div>
                <ul className="feature-list quality-checklist">
                  {qualityChecklist.map((item) => (
                    <li key={item.label}>
                      <CheckCircle2 size={18} className={item.complete ? 'complete' : ''} />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="info-message">
                  {profile.isDisplayed
                    ? 'Your profile is currently visible to employers.'
                    : 'Your profile is currently hidden from public developer profiles.'}
                </p>
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
                  <span className="profile-type developer">Developer</span>
                  <h3>{user.name}</h3>
                  <p>{profile.title}</p>
                </div>
                <div className="skill-list">
                  {profile.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <div className="proof-text">
                  <p>{profile.summary || 'Add a summary so employers understand the kind of work you can take on.'}</p>
                </div>
                <Link className="secondary-button profile-view-link" to="/profiles/me">
                  <ExternalLink size={16} />
                  <span>View profile</span>
                </Link>
              </section>
              <div className="profile-preview-actions">
                <p className="info-message preview-note">This mirrors your searchable profile card.</p>
                <button className={`primary-button profile-view-link ${profileSaveStatus ? 'success-button' : ''}`} type="button" onClick={saveProfileDetails}>
                  <CheckCircle2 size={17} />
                  <span>{profileSaveStatus || 'Save profile'}</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {activeSection === 'projects' && (
          <section className="project-showcase">
            <div className="section-heading">
              <div>
                <h2>Project portfolio</h2>
                <span>{profile.projects.length} projects</span>
              </div>
              <button className="primary-button project-add-button" type="button" onClick={() => {
                if (isAddingProject) {
                  resetProjectForm();
                  return;
                }
                setIsAddingProject(true);
              }} aria-label="Add project">
                <Plus size={18} />
                <span>{isAddingProject ? 'Cancel' : 'Project'}</span>
              </button>
            </div>
            <section className="portfolio-guidance-box">
              <Code2 size={24} />
              <div>
                <h3>Show what you can build</h3>
                <p>
                  Add your most valuable, interesting, and well-documented projects here. Treat each one like proof:
                  explain the problem, show the finished result, include screenshots, link the code, and make it easy
                  for employers to understand what you personally built.
                </p>
              </div>
            </section>
            {isAddingProject && (
              <section className="workspace-panel project-builder">
                <form className="project-form" onSubmit={saveProject}>
                  <div className="two-column-fields">
                    <label htmlFor="project-name">
                      Project name
                      <input
                        id="project-name"
                        value={projectForm.name}
                        onChange={(event) => updateProjectField('name', event.target.value)}
                        placeholder="Portfolio API, task tracker, booking app"
                      />
                    </label>
                    <label htmlFor="project-skills">
                      Skills used
                      <input
                        id="project-skills"
                        value={projectForm.skills}
                        onChange={(event) => updateProjectField('skills', event.target.value)}
                        placeholder="React, Spring Boot, PostgreSQL"
                      />
                    </label>
                  </div>
                  <label htmlFor="project-description">
                    Description
                    <textarea
                      id="project-description"
                      value={projectForm.description}
                      onChange={(event) => updateProjectField('description', event.target.value)}
                      placeholder="What did you build, what problem did it solve, and what technical decisions did you make?"
                    />
                  </label>
                  <div className="two-column-fields">
                    <label htmlFor="project-github">
                      GitHub link
                      <input
                        id="project-github"
                        type="url"
                        value={projectForm.githubUrl}
                        onChange={(event) => updateProjectField('githubUrl', event.target.value)}
                        placeholder="https://github.com/you/project"
                      />
                    </label>
                    <label htmlFor="project-live">
                      Live link
                      <input
                        id="project-live"
                        type="url"
                        value={projectForm.liveUrl}
                        onChange={(event) => updateProjectField('liveUrl', event.target.value)}
                        placeholder="https://project-demo.com"
                      />
                    </label>
                  </div>
                  <label className="featured-project-toggle" htmlFor="project-featured">
                    <input
                      id="project-featured"
                      type="checkbox"
                      checked={projectForm.featured}
                      onChange={(event) => updateProjectField('featured', event.target.checked)}
                    />
                    <span>
                      <Star size={16} />
                      Feature this project
                    </span>
                  </label>
                  <label className="screenshot-upload" htmlFor="project-images">
                    <ImagePlus size={18} />
                    <span>Upload project screenshots</span>
                    <input id="project-images" type="file" accept="image/*" multiple onChange={handleProjectImages} />
                  </label>
                  {projectForm.images.length > 0 && (
                    <div className="screenshot-strip">
                      {projectForm.images.map((image, index) => (
                        <img key={`${image}-${index}`} src={image} alt={`Project upload ${index + 1}`} />
                      ))}
                    </div>
                  )}
                  <button className={`primary-button ${projectSaveStatus ? 'success-button' : ''}`} type="submit">
                    {editingProjectId ? <CheckCircle2 size={17} /> : <Plus size={17} />}
                    <span>{projectSaveStatus || (editingProjectId ? 'Save project' : 'Add project')}</span>
                  </button>
                </form>
              </section>
            )}
            {profile.projects.length === 0 ? (
              <div className="empty-state">
                <Code2 size={28} />
                <p>Your projects will appear here with screenshots, descriptions, GitHub links, and the skills they prove.</p>
              </div>
            ) : (
              <div className="project-grid">
                {profile.projects.map((project) => (
                  <article className="project-card" key={project.id}>
                    {project.images.length > 0 && (
                      <div className="project-images">
                        {project.images.slice(0, 3).map((image, index) => (
                          <img key={`${project.id}-${index}`} src={image} alt={`${project.name} screenshot ${index + 1}`} />
                        ))}
                      </div>
                    )}
                    <div className="project-card-body">
                      <div className="panel-heading-row">
                        <div className="project-title-stack">
                          <h3>{project.name}</h3>
                          {project.featured && <span className="featured-badge">Featured</span>}
                        </div>
                        <div className="project-actions">
                          <button
                            className="delete-button"
                            type="button"
                            onClick={() => startEditingProject(project)}
                            aria-label={`Edit ${project.name}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className={`delete-button ${project.featured ? 'active-feature' : ''}`}
                            type="button"
                            onClick={() => toggleFeaturedProject(project.id)}
                            aria-label={`${project.featured ? 'Unfeature' : 'Feature'} ${project.name}`}
                          >
                            <Star size={16} />
                          </button>
                          <button className="delete-button destructive-button" type="button" onClick={() => removeProject(project.id)} aria-label={`Remove ${project.name}`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p>{project.description}</p>
                      <div className="skill-list">
                        {project.skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                      <div className="project-links">
                        {project.githubUrl && (
                          <a href={project.githubUrl} target="_blank" rel="noreferrer">
                            <Github size={16} />
                            <span>Code</span>
                          </a>
                        )}
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noreferrer">
                            <ExternalLink size={16} />
                            <span>Live</span>
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

        {activeSection === 'inbox' && (
          <section className="workspace-panel connection-panel">
            <div className="panel-heading-row">
              <div>
                <h2>Messages</h2>
                <p className="subtle">Private conversation threads, message requests, and direct replies in one place.</p>
              </div>
              <div className="inbox-meta-pill">
                <MessageSquareText size={16} />
                <span>{chatThreads.length} thread{chatThreads.length === 1 ? '' : 's'}</span>
              </div>
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
                className={messageFilter === 'connections' ? 'active' : ''}
                type="button"
                onClick={() => setMessageFilter('connections')}
              >
                <span>Connections</span>
                <strong>{connectedThreadCount}</strong>
              </button>
            </div>
              {filteredChatThreads.length === 0 ? (
                <div className="empty-state">
                  <MessageSquareText size={28} />
                  <h3>
                    {messageFilter === 'requests'
                      ? 'No message requests'
                      : messageFilter === 'favorites'
                        ? 'No favorite messages'
                        : messageFilter === 'connections'
                          ? 'No connection messages'
                        : 'No messages yet'}
                  </h3>
                  <p>
                    {messageFilter === 'requests'
                      ? 'New private conversation requests will appear here so you can review them before replying.'
                      : messageFilter === 'favorites'
                        ? 'Star the conversations you want to keep close and they will appear in this filtered view.'
                        : messageFilter === 'connections'
                          ? 'When people you are already connected with message you, their threads will appear in this filtered view.'
                        : 'When someone reaches out, a private thread will appear here so you can accept the request and chat directly.'}
                  </p>
                  <Link className="secondary-button" to="/profiles?type=DEVELOPER">
                    <ExternalLink size={16} />
                    <span>Browse developers</span>
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
                                          {partner?.name ?? 'Developer'}
                                        </button>
                                      </strong>
                                  ) : (
                                    <strong>{partner?.name ?? 'Developer'}</strong>
                                  )}
                                </div>
                                <p className="message-card-title">{partner?.title ?? 'Developer'}</p>
                              </div>
                              </div>
                              <div className="message-card-actions">
                                <span className="message-state-badge">
                                  {thread.requestReceived && !isThreadAcceptedForUser(thread) ? 'Request' : 'Chat'}
                                </span>
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
                        </div>

                        <div className="chat-message-list">
                          {(activeThread.messages ?? []).map((message) => {
                            const isOwnMessage = String(message.senderUserId) === String(user.userId);
                            const senderLabel = isOwnMessage ? 'Me' : (message.senderName ?? activeThreadPartner.name ?? 'Developer');
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

        {activeSection === 'connections' && (
          <section className="workspace-panel connection-panel">
            <div className="panel-heading-row">
              <div>
                <h2>Connections</h2>
                <p className="subtle">Manage connection requests and the developers whose connected updates you can see.</p>
              </div>
              <div className="inbox-meta-pill">
                <UserRound size={16} />
                <span>{connectionRequests.length} request{connectionRequests.length === 1 ? '' : 's'} · {connections.length} connection{connections.length === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div className="connection-summary-row">
              <div className="connection-summary-pill">
                <span>Requests</span>
                <strong>{connectionRequests.length}</strong>
              </div>
              <div className="connection-summary-pill">
                <span>Connections</span>
                <strong>{connections.length}</strong>
              </div>
            </div>
            
              <div className="connection-management-stack">
                <section className="connection-subsection">
                  <div className="connection-subsection-heading">
                    <div>
                      <h3>Incoming requests</h3>
                      <p className="compact-empty-copy">Requests to connect and follow your updates.</p>
                    </div>
                    <strong>{connectionRequests.length}</strong>
                  </div>
                  {connectionRequests.length === 0 ? (
                    <div className="empty-state compact-empty-state">
                      <UserRound size={24} />
                      <p>No pending requests right now.</p>
                    </div>
                  ) : (
                    <div className="connection-request-list">
                      {connectionRequests.map((request) => (
                        <article className="connection-request-card" key={request.id}>
                          {request.requesterImage ? (
                            <img src={request.requesterImage} alt={request.requesterName} />
                          ) : (
                            <div className="profile-placeholder">{request.requesterName?.[0] ?? 'D'}</div>
                          )}
                          <div>
                            <h3>{request.requesterName}</h3>
                            <p>{request.requesterTitle}</p>
                            <small className="compact-empty-copy">Wants to connect and follow your updates.</small>
                          </div>
                          <div className="connection-actions">
                            <button className="primary-button" type="button" onClick={() => acceptConnection(request.id)}>
                              <CheckCircle2 size={17} />
                              <span>Accept</span>
                            </button>
                            <button className="secondary-button" type="button" onClick={() => declineConnection(request.id)}>
                              Decline
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="connection-subsection">
                  <div className="connection-subsection-heading">
                    <div>
                      <h3>Your connections</h3>
                      <p className="compact-empty-copy">Developers who can currently see your connected activity feed and whose updates you can see.</p>
                    </div>
                    <strong>{connections.length}</strong>
                  </div>
                  {connections.length === 0 ? (
                    <div className="empty-state compact-empty-state">
                      <UserRound size={24} />
                      <p>No active connections yet.</p>
                    </div>
                  ) : (
                    <div className="connection-request-list">
                      {connections.map((connection) => {
                        const isRequester = String(connection.requesterProfileId) === String(backendData?.id);
                        const otherDeveloper = isRequester
                          ? {
                              profileId: connection.receiverProfileId,
                              name: connection.receiverName,
                              title: connection.receiverTitle,
                              image: connection.receiverImage,
                            }
                          : {
                              profileId: connection.requesterProfileId,
                              name: connection.requesterName,
                              title: connection.requesterTitle,
                              image: connection.requesterImage,
                            };

                        return (
                          <article className="connection-request-card connected-developer-card" key={connection.id}>
                            {otherDeveloper.image ? (
                              <img src={otherDeveloper.image} alt={otherDeveloper.name} />
                            ) : (
                              <div className="profile-placeholder">{otherDeveloper.name?.[0] ?? 'D'}</div>
                            )}
                            <div>
                              <h3>{otherDeveloper.name}</h3>
                              <p>{otherDeveloper.title}</p>
                              <small className="compact-empty-copy">Connected. Removing this also removes both sides from each other’s connected feed.</small>
                            </div>
                            <div className="connection-actions">
                              <Link className="secondary-button" to={`/profiles/${otherDeveloper.profileId}`}>
                                <ExternalLink size={16} />
                                <span>Profile</span>
                              </Link>
                              <button className="secondary-button destructive-outline-button" type="button" onClick={() => removeConnection(connection.id)}>
                                Remove connection
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            {messageStatus && <p className="connection-toast inbox-toast">{messageStatus}</p>}
          </section>
        )}

        {activeSection === 'feed' && (
          <div className="developer-feed-grid">
            <section className="workspace-panel candidate-panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Your updates</h2>
                  <p className="subtle">
                    {feedWindow === 'recent'
                      ? 'Recent updates from the last 7 days, with older posts still available when you want the full history.'
                      : 'Your full posting history, including older updates and portfolio progress notes.'}
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
                    placeholder="Working on my new React project, currently in development..."
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
                        ? 'Post project progress, learning notes, goals, and what you are building next.'
                        : 'No posts from the last 7 days yet. Switch to all time to browse your older updates.'}
                    </p>
                  </article>
                ) : (
                  visibleOwnPosts.map((post) => (
                    <article className="feed-post" key={post.id}>
                      <div className="feed-post-header">
                        <div className="feed-author">
                          {profile.photo ? <img src={profile.photo} alt={`${user.name} avatar`} /> : <div className="profile-placeholder">{user.name?.[0] ?? 'D'}</div>}
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
                  <h2>Developer activity</h2>
                  <p className="subtle">
                    {feedWindow === 'recent'
                      ? 'Recent updates from connected developers, so the feed stays readable when people post often.'
                      : 'Every connected developer update in one place when you want the longer history.'}
                  </p>
                </div>
                <MessageSquareText size={20} />
              </div>
              {visibleConnectionFeed.length === 0 ? (
                <div className="empty-state">
                  <MessageSquareText size={28} />
                  <h3>{connectionFeed.length === 0 ? 'No connection updates yet' : 'No recent connection updates'}</h3>
                  <p>
                    {connectionFeed.length === 0
                      ? 'Connect with developers from AI Match or public profiles, then their project updates will appear here.'
                      : 'Nothing new from the last 7 days. Switch to all time if you want to browse older connected activity.'}
                  </p>
                  <Link className="secondary-button" to="/match">
                    <ExternalLink size={16} />
                    <span>Find developers</span>
                  </Link>
                </div>
              ) : (
                <div className="feed-list connection-feed-list">
                  {visibleConnectionFeed.map((post) => (
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
