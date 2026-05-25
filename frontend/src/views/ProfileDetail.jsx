import React, { useEffect, useState } from 'react';
import { ExternalLink, Github, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';
import PublicHeader from '../ui/PublicHeader.jsx';

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

function readStoredDeveloperProfile(user) {
  if (!user?.email) {
    return null;
  }

  try {
    const storedProfile = JSON.parse(localStorage.getItem(`skillsignal.developer-profile.${user.email}`));
    if (!storedProfile) {
      return null;
    }
    return {
      name: user.name,
      title: storedProfile.title,
      summary: storedProfile.summary,
      image: storedProfile.photo,
      skills: storedProfile.skills ?? [],
      projects: normalizeProjects(storedProfile.projects ?? []),
    };
  } catch {
    return null;
  }
}

export default function ProfileDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const projects = normalizeProjects(profile?.projects ?? []);
  const skills = profile?.skills ?? [];

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError('');
      setProfile(null);

      try {
        let publicProfile = null;
        let ownProfile = null;

        try {
          publicProfile = await apiRequest(`/api/profiles/${id}`);
        } catch (publicError) {
          if (!token || user?.role !== 'DEVELOPER') {
            throw publicError;
          }
        }

        if (token && user?.role === 'DEVELOPER') {
          try {
            ownProfile = await apiRequest('/api/developer/profile', { token });
          } catch (ownProfileError) {
            if (!publicProfile) {
              throw ownProfileError;
            }
          }
        }

        const isOwnProfile = ownProfile && String(ownProfile.id) === String(id);
        const storedProfile = isOwnProfile ? readStoredDeveloperProfile(user) : null;
        const shouldUseStoredProjects = storedProfile?.projects?.length > 0 && (ownProfile?.projects ?? []).length === 0;
        const nextProfile = isOwnProfile
          ? {
              ...ownProfile,
              title: ownProfile.title || storedProfile?.title,
              summary: ownProfile.summary || storedProfile?.summary,
              image: ownProfile.image || storedProfile?.image,
              skills: ownProfile.skills?.length > 0 ? ownProfile.skills : storedProfile?.skills ?? [],
              projects: normalizeProjects(shouldUseStoredProjects ? storedProfile.projects : ownProfile.projects ?? []),
            }
          : publicProfile ? { ...publicProfile, projects: normalizeProjects(publicProfile.projects ?? []) } : null;

        if (!nextProfile) {
          throw new Error('Profile not found.');
        }

        if (isMounted) {
          setProfile(nextProfile);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [id, token, user?.role]);

  return (
    <main className="public-page">
      <PublicHeader />

      {isLoading && (
        <section className="profile-detail-shell">
          <p className="info-message">Loading profile...</p>
        </section>
      )}

      {error && (
        <section className="profile-detail-shell">
          <p className="error">{error}</p>
          <Link className="secondary-button" to="/profiles">Back to profiles</Link>
        </section>
      )}

      {profile && (
        <section className="profile-detail-shell">
          <header className="profile-detail-header">
            {profile.image ? (
              <img src={profile.image} alt={profile.name} />
            ) : (
              <div className="profile-placeholder">{profile.name.slice(0, 2).toUpperCase()}</div>
            )}
            <div>
              <p className="eyebrow">Developer profile</p>
              <h1>{profile.name}</h1>
              <p>{profile.title}</p>
              <div className="skill-list">
                {skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          </header>

          <section className="profile-detail-grid">
            <article className="workspace-panel">
              <h2>About</h2>
              <p className="subtle">{profile.summary}</p>
            </article>

            <article className="workspace-panel">
              <h2>Project proof</h2>
              {projects.length === 0 ? (
                <p className="subtle">This developer has not published project proof yet.</p>
              ) : (
                <div className="public-project-list">
                  {projects.map((project, projectIndex) => (
                    <article className="public-project-card" key={project.name}>
                      {(project.images ?? []).length > 0 && (
                        <div className="project-images">
                          {(project.images ?? []).slice(0, 3).map((image, index) => (
                            <img key={`${project.name}-${projectIndex}-${index}`} src={image} alt={`${project.name} screenshot ${index + 1}`} />
                          ))}
                        </div>
                      )}
                      <div className="project-card-body">
                        <div className="project-title-stack">
                          <h3>{project.name}</h3>
                          {project.featured && (
                            <span className="featured-badge">
                              <Star size={14} />
                              Featured
                            </span>
                          )}
                        </div>
                        <p>{project.description}</p>
                        <div className="skill-list">
                          {(project.skills ?? []).map((skill) => (
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
            </article>
          </section>
        </section>
      )}
    </main>
  );
}
