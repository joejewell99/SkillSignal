import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  ImagePlus,
  MessageSquareText,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';

const defaultDeveloperProfile = {
  title: 'Junior full-stack developer',
  summary: '',
  photo: '',
  isDisplayed: false,
  skills: ['React', 'Spring Boot', 'PostgreSQL'],
  projects: [],
  posts: [],
};

const defaultEmployerProfile = {
  title: 'Hiring team',
  summary: '',
  photo: '',
  isDisplayed: false,
  focus: ['React', 'APIs', 'Junior developer'],
  posts: [],
};

const lipEmployerProfile = {
  title: 'Product founder hiring junior and early-career developers',
  summary:
    'I am building a small product team focused on practical web applications, internal dashboards, and customer-facing tools. I am looking for developers who can show real project evidence, communicate their decisions clearly, and contribute to reliable React and API-driven features. Strong candidates should be comfortable learning quickly, asking good questions, and turning rough product ideas into polished user experiences.',
  photo: '',
  isDisplayed: false,
  focus: ['React', 'REST APIs', 'Dashboards', 'Authentication flows', 'Junior developer', 'Project evidence'],
  posts: [
    {
      id: 'lip-feed-react-dashboard',
      body: 'Looking for a junior React developer who can help build clean dashboard screens, connect to REST APIs, and explain their component decisions clearly.',
      createdAt: '2026-05-26T09:20:00.000Z',
    },
    {
      id: 'lip-feed-project-proof',
      body: 'Especially interested in developers with project proof: GitHub links, screenshots, and short write-ups about what they personally built.',
      createdAt: '2026-05-25T15:45:00.000Z',
    },
    {
      id: 'lip-feed-api-focus',
      body: 'Current priority is finding someone comfortable with forms, authentication flows, API error states, and turning rough product ideas into usable interfaces.',
      createdAt: '2026-05-24T11:10:00.000Z',
    },
    {
      id: 'lip-feed-growth-mindset',
      body: 'A strong fit would be someone early in their career who can talk through tradeoffs, respond well to feedback, and keep improving a feature after the first version works.',
      createdAt: '2026-05-23T13:30:00.000Z',
    },
  ],
};

const emptyProject = {
  name: '',
  description: '',
  githubUrl: '',
  liveUrl: '',
  skills: '',
  images: [],
  featured: false,
};

function normalizeProjects(projects = []) {
  return projects
    .map((project) => ({
      ...project,
      id: project.id ?? crypto.randomUUID(),
      skills: project.skills ?? [],
      images: project.images ?? [],
      featured: Boolean(project.featured),
    }))
    .sort((first, second) => Number(Boolean(second.featured)) - Number(Boolean(first.featured)));
}

function readStoredDeveloperProfile(storageKey) {
  const storedProfile = localStorage.getItem(storageKey);
  if (!storedProfile) {
    return defaultDeveloperProfile;
  }
  try {
    const parsedProfile = JSON.parse(storedProfile);
    return {
      ...defaultDeveloperProfile,
      ...parsedProfile,
      isDisplayed: parsedProfile.isDisplayed ?? parsedProfile.isPublished ?? false,
      projects: normalizeProjects(parsedProfile.projects ?? []),
      posts: parsedProfile.posts ?? [],
    };
  } catch {
    return defaultDeveloperProfile;
  }
}

function readStoredEmployerProfile(storageKey, user) {
  const storedProfile = localStorage.getItem(storageKey);
  if (!storedProfile) {
    return isLipEmployer(user) ? lipEmployerProfile : defaultEmployerProfile;
  }
  try {
    const parsedProfile = JSON.parse(storedProfile);
    const seededProfile = isLipEmployer(user) ? lipEmployerProfile : defaultEmployerProfile;
    const hasCustomTitle = parsedProfile.title && parsedProfile.title !== defaultEmployerProfile.title;
    const hasCustomFocus = (parsedProfile.focus ?? []).some((item) => !defaultEmployerProfile.focus.includes(item));
    return {
      ...defaultEmployerProfile,
      ...seededProfile,
      ...parsedProfile,
      title: hasCustomTitle ? parsedProfile.title : seededProfile.title,
      summary: parsedProfile.summary || seededProfile.summary,
      isDisplayed: parsedProfile.isDisplayed ?? parsedProfile.isPublished ?? parsedProfile.displayed ?? false,
      focus: hasCustomFocus ? parsedProfile.focus : seededProfile.focus,
      posts: (parsedProfile.posts ?? []).length > 0 ? parsedProfile.posts : seededProfile.posts,
      name: user.name,
    };
  } catch {
    return isLipEmployer(user) ? lipEmployerProfile : defaultEmployerProfile;
  }
}

function isLipEmployer(user) {
  const searchableUser = `${user?.name ?? ''} ${user?.email ?? ''}`.toLowerCase();
  return searchableUser.includes('lip');
}

function formatPostDate(dateValue) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateValue));
}

function readImage(file, onLoad) {
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoad(reader.result);
  reader.readAsDataURL(file);
}

function toProfilePayload(profile, displayed = profile.isDisplayed) {
  return {
    title: profile.title,
    summary: profile.summary,
    image: profile.photo,
    skills: profile.skills,
    projects: profile.projects.map((project) => ({
      name: project.name,
      description: project.description,
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl,
      skills: project.skills ?? [],
      images: project.images ?? [],
      featured: Boolean(project.featured),
    })),
    posts: (profile.posts ?? []).map((post) => ({
      id: post.id,
      body: post.body,
      createdAt: post.createdAt,
    })),
    displayed,
  };
}

function toEmployerProfilePayload(profile, displayed = profile.isDisplayed) {
  return {
    title: profile.title,
    summary: profile.summary,
    image: profile.photo,
    skills: profile.focus,
    posts: (profile.posts ?? []).map((post) => ({
      id: post.id,
      body: post.body,
      createdAt: post.createdAt,
    })),
    displayed,
  };
}

const roleConfig = {
  DEVELOPER: {
    title: 'Developer profile workspace',
    description: 'Advertise your skills with project proof so employers can find and trust your work.',
    endpoint: '/api/developer/profile',
    icon: Code2,
    actions: [
      'Add projects as your source of truth',
      'Attach skills to real evidence',
      'Show readiness for junior developer roles',
    ],
  },
  EMPLOYER: {
    title: 'Employer hiring workspace',
    description: 'Search for developers by skills or technical problems, then save candidates you want to contact.',
    endpoint: '/api/employer/search?problem=authentication',
    icon: BriefcaseBusiness,
    actions: [
      'Search public profiles by skill',
      'Review proof-backed match explanations',
      'Save candidates and request contact',
    ],
  },
  ADMIN: {
    title: 'Admin moderation',
    description: 'Keep SkillSignal trustworthy by reviewing profile evidence, contact requests, and platform quality.',
    endpoint: '/api/admin/moderation',
    icon: ShieldCheck,
    actions: [
      'Review suspicious project evidence',
      'Moderate contact requests',
      'Protect quality and trust across the marketplace',
    ],
  },
};

export default function Dashboard() {
  const { user, token } = useAuth();
  if (user.role === 'DEVELOPER') {
    return <DeveloperDashboard user={user} token={token} />;
  }
  if (user.role === 'EMPLOYER') {
    return <EmployerDashboard user={user} token={token} />;
  }
  return <RoleDashboard user={user} token={token} />;
}

function RoleDashboard({ user, token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const config = roleConfig[user.role] ?? roleConfig.DEVELOPER;
  const Icon = config.icon;

  const apiPreview = useMemo(() => {
    if (!data) {
      return 'Loading secure role data...';
    }
    return JSON.stringify(data, null, 2);
  }, [data]);

  useEffect(() => {
    setError('');
    apiRequest(config.endpoint, { token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [config.endpoint, token]);

  return (
    <section className="dashboard">
      <header className="page-header">
        <div>
          <p className="eyebrow">{user.role}</p>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <Icon className="page-icon" size={44} />
      </header>

      <section className="dashboard-cards">
        <article className="workspace-panel">
          <h2>What this dashboard is for</h2>
          <ul className="feature-list">
            {config.actions.map((action) => (
              <li key={action}>
                <CheckCircle2 size={18} />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="workspace-panel">
          <h2>Quick actions</h2>
          {user.role === 'EMPLOYER' && (
            <div className="quick-search">
              <label htmlFor="dashboard-search">Find candidates by skill</label>
              <div className="search-box">
                <Search size={18} />
                <input
                  id="dashboard-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Python, SQL, Spring Boot"
                />
              </div>
              <Link className="primary-button" to="/#search">
                Search public profiles
              </Link>
            </div>
          )}
          {user.role === 'DEVELOPER' && (
            <div className="action-stack">
              <button className="primary-button" type="button">
                <Plus size={17} />
                <span>Create profile</span>
              </button>
              <p className="subtle">Next build step: save projects, skills, screenshots, GitHub links, and deployment links.</p>
            </div>
          )}
          {user.role === 'ADMIN' && (
            <div className="action-stack">
              <p className="info-message">
                Admin is for trust and safety: checking evidence quality, reviewing reports, and making sure employers see reliable developer proof.
              </p>
              <Link className="primary-button" to="/">
                View public marketplace
              </Link>
            </div>
          )}
        </article>

        <article className="workspace-panel wide-panel">
          <h2>Secure backend response</h2>
          {error && <p className="error">{error}</p>}
          <pre>{apiPreview}</pre>
        </article>
      </section>
    </section>
  );
}

function EmployerDashboard({ user, token }) {
  const storageKey = `skillsignal.employer-profile.${user.email}`;
  const [data, setData] = useState(null);
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState('');
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
        const backendPosts = profileData.posts ?? [];
        const shouldSyncStoredPosts = storedProfile.posts.length > 0 && backendPosts.length === 0;
        const nextProfile = {
          ...storedProfile,
          isDisplayed: profileData.displayed,
          title: storedProfile.title || profileData.title,
          summary: storedProfile.summary || profileData.summary,
          photo: storedProfile.photo || profileData.image,
          focus: storedProfile.focus.length > 0 ? storedProfile.focus : profileData.skills,
          posts: shouldSyncStoredPosts ? storedProfile.posts : backendPosts,
        };
        setProfile((current) => ({
          ...current,
          ...nextProfile,
        }));
        if (shouldSyncStoredPosts) {
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
      posts: profileData.posts ?? [],
    }));
    return profileData;
  }

  async function updateEmployerDisplayStatus(displayed) {
    const nextProfile = { ...profile, isDisplayed: displayed };
    setProfile(nextProfile);
    try {
      setError('');
      const profileData = await apiRequest('/api/employer/profile/visibility', {
        token,
        method: 'PATCH',
        body: JSON.stringify({ displayed }),
      });
      setBackendData(profileData);
      setProfile((current) => ({
        ...current,
        isDisplayed: profileData.displayed,
      }));
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

function DeveloperDashboard({ user, token }) {
  const storageKey = `skillsignal.developer-profile.${user.email}`;
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [postInput, setPostInput] = useState('');
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
