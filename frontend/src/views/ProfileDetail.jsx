import React, { useEffect, useState } from 'react';
import { ExternalLink, Github, MessageSquareText, Star } from 'lucide-react';
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
      posts: storedProfile.posts ?? [],
    };
  } catch {
    return null;
  }
}

function formatPostDate(dateValue) {
  if (!dateValue) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateValue));
}

function idealJuniorDevFor(need) {
  const needName = (need.name ?? '').toLowerCase();
  const skills = (need.skills ?? []).join(' ').toLowerCase();

  if (needName.includes('customer retention dashboard')) {
    return 'Someone who can ask what each metric means, check the SQL behind the numbers, and turn retention data into a dashboard account managers can act on.';
  }
  if (needName.includes('csv import quality check')) {
    return 'Someone patient with messy data, careful about validation rules, and able to make upload problems clear without blaming the user.';
  }
  if (needName.includes('admin access control')) {
    return 'Someone who understands that permissions affect real users, can test role edge cases, and writes React screens that make access changes feel obvious.';
  }
  if (needName.includes('operations dashboard')) {
    return 'Someone with a good eye for small UI improvements, reusable components, and dashboard states that help busy managers scan work quickly.';
  }
  if (needName.includes('jwt authentication')) {
    return 'Someone careful with security flow, comfortable tracing login errors, and willing to document how protected endpoints should behave.';
  }
  if (needName.includes('postgresql audit trail')) {
    return 'Someone who can model simple history data, think through pagination, and keep backend responses predictable for admin screens.';
  }
  if (needName.includes('customer account request')) {
    return 'Someone who can follow a multi-step account workflow, keep status changes understandable, and avoid overcomplicating the Rails models.';
  }
  if (needName.includes('deployment health checklist')) {
    return 'Someone who likes practical polish: environment checks, simple documentation, and small health signals that make deployments less stressful.';
  }

  if (skills.includes('react')) {
    return 'Someone who learns fast, communicates UI decisions clearly, and can turn rough workflow notes into tidy, reusable React screens.';
  }
  if (skills.includes('spring') || skills.includes('jwt')) {
    return 'Someone who is careful with backend flow, asks good questions about edge cases, and can document protected API behavior clearly.';
  }
  if (skills.includes('ruby') || skills.includes('rails')) {
    return 'Someone who can understand existing Rails patterns quickly, keep database changes simple, and explain account-flow tradeoffs.';
  }
  if (skills.includes('sql') || skills.includes('python')) {
    return 'Someone who can work patiently through messy data, validate assumptions, and present findings in a way non-technical users understand.';
  }

  return 'Someone curious, reliable, quick to learn, and comfortable showing progress through small, well-explained improvements.';
}

export default function ProfileDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const projects = normalizeProjects(profile?.projects ?? []);
  const skills = profile?.skills ?? [];
  const posts = profile?.posts ?? [];
  const isEmployerProfile = profile?.type === 'EMPLOYER';

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
        const shouldUseStoredPosts = storedProfile?.posts?.length > 0 && (ownProfile?.posts ?? []).length === 0;
        const nextProfile = isOwnProfile
          ? {
              ...ownProfile,
              title: ownProfile.title || storedProfile?.title,
              summary: ownProfile.summary || storedProfile?.summary,
              image: ownProfile.image || storedProfile?.image,
              skills: ownProfile.skills?.length > 0 ? ownProfile.skills : storedProfile?.skills ?? [],
              projects: normalizeProjects(shouldUseStoredProjects ? storedProfile.projects : ownProfile.projects ?? []),
              posts: shouldUseStoredPosts ? storedProfile.posts : ownProfile.posts ?? [],
            }
          : publicProfile ? { ...publicProfile, projects: normalizeProjects(publicProfile.projects ?? []), posts: publicProfile.posts ?? [] } : null;

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
              <p className="eyebrow">{isEmployerProfile ? 'Employer profile' : 'Developer profile'}</p>
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
            <div className="profile-detail-main">
              <article className="workspace-panel">
                <h2>About</h2>
                <p className="subtle">{profile.summary}</p>
              </article>

              <article className="workspace-panel">
                <h2>{isEmployerProfile ? 'Hiring needs' : 'Project proof'}</h2>
                {projects.length === 0 ? (
                  <p className="subtle">
                    {isEmployerProfile
                      ? 'This employer has not published detailed hiring needs yet.'
                      : 'This developer has not published project proof yet.'}
                  </p>
                ) : (
                  isEmployerProfile ? (
                    <div className="hiring-need-list">
                      {projects.map((project) => (
                        <article className="hiring-need-card" key={project.name}>
                          <div>
                            <span className="profile-type employer">Hiring need</span>
                            <h3>{project.name}</h3>
                            <p>{project.description}</p>
                          </div>
                          <div className="hiring-need-meta">
                            <div>
                              <h4>Required skills</h4>
                              <div className="skill-list">
                                {(project.skills ?? []).map((skill) => (
                                  <span key={skill}>{skill}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4>Ideal junior dev</h4>
                              <p>{idealJuniorDevFor(project)}</p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
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
                  )
                )}
              </article>
            </div>

            <aside className="profile-feed-panel">
              <div className="panel-heading-row">
                <h2>Feed</h2>
                <MessageSquareText size={20} />
              </div>
              {posts.length === 0 ? (
                <p className="subtle">
                  {isEmployerProfile
                    ? 'This employer has not posted hiring updates yet.'
                    : 'This developer has not posted feed updates yet.'}
                </p>
              ) : (
                <div className="public-feed-list">
                  {posts.map((post) => (
                    <article className="public-feed-post" key={post.id ?? post.createdAt}>
                      <div className="feed-author">
                        {profile.image ? <img src={profile.image} alt={`${profile.name} avatar`} /> : <div className="profile-placeholder">{profile.name?.[0] ?? 'D'}</div>}
                        <div>
                          <strong>{profile.name}</strong>
                          <span>{formatPostDate(post.createdAt)}</span>
                        </div>
                      </div>
                      <p>{post.body}</p>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </section>
        </section>
      )}
    </main>
  );
}
