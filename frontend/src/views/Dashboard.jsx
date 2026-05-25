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
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';

const defaultDeveloperProfile = {
  title: 'Junior full-stack developer',
  summary: '',
  photo: '',
  skills: ['React', 'Spring Boot', 'PostgreSQL'],
  projects: [],
};

const emptyProject = {
  name: '',
  description: '',
  githubUrl: '',
  liveUrl: '',
  skills: '',
  images: [],
};

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
  return user.role === 'DEVELOPER' ? <DeveloperDashboard user={user} token={token} /> : <RoleDashboard user={user} token={token} />;
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

function DeveloperDashboard({ user, token }) {
  const storageKey = `skillsignal.developer-profile.${user.email}`;
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [profile, setProfile] = useState(() => {
    const storedProfile = localStorage.getItem(storageKey);
    if (!storedProfile) {
      return defaultDeveloperProfile;
    }
    try {
      return { ...defaultDeveloperProfile, ...JSON.parse(storedProfile) };
    } catch {
      return defaultDeveloperProfile;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(profile));
  }, [profile, storageKey]);

  useEffect(() => {
    apiRequest('/api/developer/profile', { token })
      .then(setBackendData)
      .catch((err) => setError(err.message));
  }, [token]);

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

  function addProject(event) {
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
      skills: projectForm.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    };
    updateProfile('projects', [project, ...profile.projects]);
    setProjectForm(emptyProject);
  }

  function removeProject(projectId) {
    updateProfile(
      'projects',
      profile.projects.filter((project) => project.id !== projectId)
    );
  }

  const completionItems = [
    { label: 'Photo', complete: Boolean(profile.photo) },
    { label: 'Skills', complete: profile.skills.length >= 3 },
    { label: 'Projects', complete: profile.projects.length > 0 },
  ];
  const completion = Math.round((completionItems.filter((item) => item.complete).length / completionItems.length) * 100);

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
          <section className="workspace-panel profile-editor">
            <h2>Profile employers see</h2>
            <label htmlFor="developer-summary">
              Short professional summary
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

          <section className="workspace-panel project-builder">
            <h2>Add project proof</h2>
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
        </div>

        <aside className="developer-preview">
          <section className="workspace-panel">
            <h2>Employer preview</h2>
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
            {backendData && <p className="info-message">{backendData.message}</p>}
          </section>
        </aside>
      </section>

      <section className="project-showcase">
        <div className="section-heading">
          <h2>Project portfolio</h2>
          <span>{profile.projects.length} projects</span>
        </div>
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
                    <h3>{project.name}</h3>
                    <button className="delete-button" type="button" onClick={() => removeProject(project.id)} aria-label={`Remove ${project.name}`}>
                      <Trash2 size={16} />
                    </button>
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
    </section>
  );
}
