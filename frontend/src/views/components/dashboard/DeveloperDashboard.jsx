import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  ImagePlus,
  MessageSquareText,
  Plus,
  Send,
  Star,
  Trash2,
  UserRound,
} from 'lucide-react';
import { apiRequest } from '../../../api/client.js';
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
  const [projectForm, setProjectForm] = useState(emptyProject);
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
          title: storedProfile.title || profileData.title,
          summary: storedProfile.summary || profileData.summary,
          photo: storedProfile.photo || profileData.image,
          skills: storedProfile.skills.length > 0 ? storedProfile.skills : profileData.skills,
          projects: shouldSyncStoredProjects ? storedProfile.projects : backendProjects,
          posts: shouldSyncStoredPosts ? storedProfile.posts : backendPosts,
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

  async function addProject(event) {
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
    const nextProfile = { ...profile, projects: sortProjects([project, ...profile.projects]) };
    setProfile(nextProfile);
    setProjectForm(emptyProject);
    setIsAddingProject(false);
    try {
      await saveDeveloperProfile(nextProfile);
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
  const posts = profile.posts ?? [];

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
                placeholder="Junior frontend developer"
              />
            </label>
          </div>
        </div>
        <div className="profile-readiness" aria-label="Profile readiness">
          <strong>{completion}%</strong>
          <span>profile ready</span>
          <div className="readiness-bar">
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
      </header>

      <section className="developer-layout">
        <div className="developer-main">
          <section className="feed-toolbar">
            <div className="panel-heading-row">
              <div>
                <p className="eyebrow">Feed</p>
                <h2>Activity</h2>
              </div>
              <button className="primary-button" type="button" onClick={() => setIsComposingPost((current) => !current)}>
                <Plus size={18} />
                <span>Post</span>
              </button>
            </div>
          </section>

          {isComposingPost && (
            <section className="workspace-panel feed-composer">
              <form className="post-form" onSubmit={addPost}>
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
            </section>
          )}

          <section className="feed-list">
            {posts.length === 0 ? (
              <article className="workspace-panel empty-feed">
                <MessageSquareText size={28} />
                <p>Post project progress, learning notes, goals, and what you are building next.</p>
              </article>
            ) : (
              posts.map((post) => (
                <article className="workspace-panel feed-post" key={post.id}>
                  <div className="feed-post-header">
                    <div className="feed-author">
                      {profile.photo ? <img src={profile.photo} alt={`${user.name} avatar`} /> : <div className="profile-placeholder">{user.name?.[0] ?? 'D'}</div>}
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

          <section className="workspace-panel connection-panel">
            <div className="panel-heading-row">
              <div>
                <p className="eyebrow">Connections</p>
                <h2>Requests</h2>
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

          <section className="workspace-panel connection-panel">
            <div className="panel-heading-row">
              <div>
                <p className="eyebrow">Connection feed</p>
                <h2>Developer activity</h2>
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

          <section className="project-showcase">
            <div className="section-heading">
              <div>
                <h2>Project portfolio</h2>
                <span>{profile.projects.length} projects</span>
              </div>
              <button className="primary-button project-add-button" type="button" onClick={() => setIsAddingProject((current) => !current)} aria-label="Add project">
                <Plus size={18} />
                <span>Project</span>
              </button>
            </div>
            {isAddingProject && (
              <section className="workspace-panel project-builder">
                <form className="project-form" onSubmit={addProject}>
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
                  <button className="primary-button" type="submit">
                    <Plus size={17} />
                    <span>Add project</span>
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
                            className={`delete-button ${project.featured ? 'active-feature' : ''}`}
                            type="button"
                            onClick={() => toggleFeaturedProject(project.id)}
                            aria-label={`${project.featured ? 'Unfeature' : 'Feature'} ${project.name}`}
                          >
                            <Star size={16} />
                          </button>
                          <button className="delete-button" type="button" onClick={() => removeProject(project.id)} aria-label={`Remove ${project.name}`}>
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
        </div>

        <aside className="developer-preview">
          <section className="workspace-panel">
            <h2>Profile preview</h2>
            <div className="preview-card">
              {profile.photo ? <img src={profile.photo} alt={`${user.name} preview`} /> : <div className="profile-placeholder">{user.name?.[0] ?? 'D'}</div>}
              <div>
                <h3>{user.name}</h3>
                <p>{profile.title}</p>
              </div>
              <p>{profile.summary || 'Add a summary so employers understand the kind of work you can take on.'}</p>
              <div className="skill-list">
                {profile.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          </section>

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
              <h2>Main skills</h2>
              <span>{profile.skills.length} added</span>
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
                <button key={skill} type="button" onClick={() => removeSkill(skill)}>
                  <span>{skill}</span>
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
                    ? 'Your profile is visible in the public developer profiles.'
                    : 'Your profile is hidden from public developer profiles.'}
                </p>
              </div>
              <label className="visibility-toggle" htmlFor="profile-publication">
                <input
                  id="profile-publication"
                  type="checkbox"
                  checked={profile.isDisplayed}
                  onChange={(event) => updateDisplayStatus(event.target.checked)}
                />
                <span>{profile.isDisplayed ? 'Displayed' : 'Hidden'}</span>
              </label>
              <Link className="secondary-button" to="/profiles">
                View profiles
              </Link>
            </div>
          </section>

          <section className="workspace-panel">
            <h2>Checklist</h2>
            <ul className="feature-list">
              {completionItems.map((item) => (
                <li key={item.label}>
                  <CheckCircle2 size={18} className={item.complete ? 'complete' : ''} />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
            {error && <p className="error">{error}</p>}
            {backendData && (
              <p className="info-message">
                Database profile is {backendData.displayed ? 'displayed publicly' : 'hidden from public profiles'}.
              </p>
            )}
          </section>
        </aside>
      </section>
    </section>
  );
}
