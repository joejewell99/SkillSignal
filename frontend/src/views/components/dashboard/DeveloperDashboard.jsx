import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
export default function DeveloperDashboard({ user, token }) {
  const storageKey = `skillsignal.developer-profile.${user.email}`;
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [connectionFeed, setConnectionFeed] = useState([]);
  const [isComposingPost, setIsComposingPost] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [profileSaveStatus, setProfileSaveStatus] = useState('');
  const [projectSaveStatus, setProjectSaveStatus] = useState('');
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
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

  async function refreshConnections() {
    try {
      const [requests, feed] = await Promise.all([
        apiRequest('/api/developer/connections/requests', { token }),
        apiRequest('/api/developer/feed', { token }),
      ]);
      setConnectionRequests(requests);
      setConnectionFeed(feed);
    } catch (err) {
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

  const completionItems = [
    { label: 'Photo', complete: Boolean(profile.photo) },
    { label: 'Skills', complete: profile.skills.length >= 3 },
    { label: 'Projects', complete: profile.projects.length > 0 },
  ];
  const completion = Math.round((completionItems.filter((item) => item.complete).length / completionItems.length) * 100);
  const proofQuality = backendData?.proofQuality;
  const posts = profile.posts ?? [];
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
    { id: 'profile', label: 'Profile', count: null },
    { id: 'projects', label: 'Projects', count: profile.projects.length },
    { id: 'inbox', label: 'Inbox', count: connectionRequests.length },
    { id: 'feed', label: 'Updates', count: posts.length + connectionFeed.length },
  ];

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
                <h2>Inbox</h2>
                <p className="subtle">Incoming connection requests from developers who want to share work and stay in touch.</p>
              </div>
              <Link className="secondary-button" to="/profiles?type=DEVELOPER">
                <UserRound size={16} />
                <span>Find developers</span>
              </Link>
            </div>
            {connectionRequests.length === 0 ? (
              <p className="info-message">Connection requests from other developers will appear here.</p>
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
                      <Link to={`/profiles/${request.requesterProfileId}`}>View profile</Link>
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
        )}

        {activeSection === 'feed' && (
          <div className="developer-feed-grid">
            <section className="workspace-panel candidate-panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Your updates</h2>
                  <p className="subtle">Share project progress, learning notes, and what you are building next.</p>
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
                {posts.length === 0 ? (
                  <article className="empty-feed">
                    <MessageSquareText size={28} />
                    <p>Post project progress, learning notes, goals, and what you are building next.</p>
                  </article>
                ) : (
                  posts.map((post) => (
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
                  <p className="subtle">Updates from developers you are connected with.</p>
                </div>
                <MessageSquareText size={20} />
              </div>
              {connectionFeed.length === 0 ? (
                <p className="info-message">After you connect with developers, their project updates will show here.</p>
              ) : (
                <div className="feed-list connection-feed-list">
                  {connectionFeed.map((post) => (
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
