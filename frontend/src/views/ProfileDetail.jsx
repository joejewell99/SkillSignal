import React, { useEffect, useState } from 'react';
import { Bookmark, ExternalLink, Github, MessageSquareText, Send, Star, UserPlus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';
import PublicHeader from '../ui/PublicHeader.jsx';
import ContactLinks from './components/profile/ContactLinks.jsx';
import EmployerNeedsList from './components/profile/EmployerNeedsList.jsx';

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
      contactLinks: storedProfile.contactLinks ?? {},
      preferences: storedProfile.preferences ?? {},
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
  if (needName.includes('cloud cost insights')) {
    return 'Someone who can make complex cloud usage feel understandable, cares about chart clarity, and can explain technical spending patterns without overwhelming users.';
  }
  if (needName.includes('api documentation sandbox')) {
    return 'Someone who enjoys developer experience work, tests API examples carefully, and can turn confusing auth or permission errors into useful guidance.';
  }
  if (needName.includes('support triage tool')) {
    return 'Someone who can organize messy support signals, think through workflow states, and build internal tools that help engineers spot repeated product issues.';
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

function developerPreferenceChips(profile) {
  if (profile?.type !== 'DEVELOPER') {
    return [];
  }

  const preferences = profile.preferences ?? {};
  return [
    preferences.availability || 'Open to junior roles',
    preferences.remotePreference || 'Remote or hybrid',
    ...(preferences.workTypes ?? []),
  ].filter(Boolean);
}

function candidateSignalLabel(proofQuality) {
  const score = proofQuality?.score ?? 0;
  if (score >= 75) {
    return 'Strong candidate';
  }
  if (score >= 45) {
    return 'Promising candidate';
  }
  return 'Early-stage candidate';
}

export default function ProfileDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [developerProofProjects, setDeveloperProofProjects] = useState([]);
  const [proofProjectName, setProofProjectName] = useState('');
  const [proofProjectUrl, setProofProjectUrl] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [proofStatus, setProofStatus] = useState('');
  const [isSendingProof, setIsSendingProof] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [connectionId, setConnectionId] = useState(null);
  const [connectionDirection, setConnectionDirection] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [isConnectionMessageLeaving, setIsConnectionMessageLeaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [savedCandidateId, setSavedCandidateId] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaveMessageLeaving, setIsSaveMessageLeaving] = useState(false);
  const [isSavingCandidate, setIsSavingCandidate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const projects = normalizeProjects(profile?.projects ?? []);
  const needs = profile?.needs ?? [];
  const skills = profile?.skills ?? [];
  const posts = profile?.posts ?? [];
  const isEmployerProfile = profile?.type === 'EMPLOYER';
  const isDeveloperProfile = profile?.type === 'DEVELOPER';
  const preferenceChips = developerPreferenceChips(profile);
  const canSendProof = Boolean(token && user?.role === 'DEVELOPER' && isEmployerProfile);
  const shouldShowDeveloperConnection = Boolean(token && user?.role === 'DEVELOPER' && isDeveloperProfile && !connectionStatus.includes('SELF'));
  const canRequestConnection = Boolean(shouldShowDeveloperConnection && profile?.acceptsConnections);
  const canSaveCandidate = Boolean(token && user?.role === 'EMPLOYER' && isDeveloperProfile);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError('');
      setProfile(null);

      try {
        const isOwnPreviewRoute = id === 'me';
        let publicProfile = null;
        let ownProfile = null;
        let connectionActivity = [];
        let savedCandidates = [];

        if (!isOwnPreviewRoute) {
          try {
            publicProfile = await apiRequest(`/api/profiles/${id}`);
          } catch (publicError) {
            if (!token || !['DEVELOPER', 'EMPLOYER'].includes(user?.role)) {
              throw publicError;
            }
          }
        }

        if (token && user?.role === 'DEVELOPER') {
          try {
            ownProfile = await apiRequest('/api/developer/profile', { token });
            if (isMounted) {
              setDeveloperProofProjects(normalizeProjects(ownProfile.projects ?? []));
            }
            connectionActivity = await apiRequest('/api/developer/connections/activity', { token }).catch(() => []);
          } catch (ownProfileError) {
            if (!publicProfile) {
              throw ownProfileError;
            }
          }
        }

        if (token && user?.role === 'EMPLOYER') {
          try {
            ownProfile = await apiRequest('/api/employer/profile', { token });
          } catch (ownProfileError) {
            if (!publicProfile) {
              throw ownProfileError;
            }
          }
        }

        if (token && user?.role === 'EMPLOYER') {
          savedCandidates = await apiRequest('/api/employer/saved-candidates', { token }).catch(() => []);
        }

        const isOwnProfile = Boolean(ownProfile && (isOwnPreviewRoute || String(ownProfile.id) === String(id)));
        const storedProfile = isOwnProfile && user?.role === 'DEVELOPER' ? readStoredDeveloperProfile(user) : null;
        const nextProfile = isOwnProfile
          ? {
              ...ownProfile,
              title: storedProfile?.title || ownProfile.title,
              summary: storedProfile?.summary || ownProfile.summary,
              image: storedProfile?.image || ownProfile.image,
              skills: storedProfile?.skills?.length > 0 ? storedProfile.skills : ownProfile.skills ?? [],
              contactLinks: storedProfile?.contactLinks ?? ownProfile.contactLinks ?? {},
              preferences: storedProfile?.preferences ?? ownProfile.preferences ?? {},
              projects: normalizeProjects(storedProfile?.projects ?? ownProfile.projects ?? []),
              posts: storedProfile?.posts ?? ownProfile.posts ?? [],
            }
          : publicProfile ? { ...publicProfile, projects: normalizeProjects(publicProfile.projects ?? []), posts: publicProfile.posts ?? [] } : null;

        if (!nextProfile) {
          throw new Error('Profile not found.');
        }

        if (isMounted) {
          setProfile(nextProfile);
          if (user?.role === 'DEVELOPER' && nextProfile.type === 'DEVELOPER') {
            if (ownProfile && String(ownProfile.id) === String(nextProfile.id)) {
              setConnectionStatus('SELF');
            } else {
              const connection = connectionActivity.find((item) => (
                String(item.requesterProfileId) === String(nextProfile.id)
                || String(item.receiverProfileId) === String(nextProfile.id)
              ));
              setConnectionStatus(connection?.status ?? '');
              setConnectionId(connection?.id ?? null);
              setConnectionDirection(connection
                ? String(connection.receiverProfileId) === String(ownProfile?.id) ? 'INCOMING' : 'OUTGOING'
                : '');
            }
          } else {
            setConnectionStatus('');
            setConnectionId(null);
            setConnectionDirection('');
          }
          if (user?.role === 'EMPLOYER' && nextProfile.type === 'DEVELOPER') {
            const savedCandidate = savedCandidates.find((candidate) => String(candidate.developerProfileId) === String(nextProfile.id));
            setSavedCandidateId(savedCandidate?.id ?? null);
          } else {
            setSavedCandidateId(null);
          }
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

  async function requestConnection() {
    setConnectionMessage('');
    setIsConnectionMessageLeaving(false);
    setIsConnecting(true);

    try {
      const connection = await apiRequest('/api/developer/connections', {
        token,
        method: 'POST',
        body: JSON.stringify({ receiverProfileId: profile.id }),
      });
      setConnectionStatus(connection.status);
      setConnectionMessage(connection.status === 'ACCEPTED' ? 'Connected' : 'Request sent');
      window.setTimeout(() => setIsConnectionMessageLeaving(true), 1200);
      window.setTimeout(() => setConnectionMessage(''), 1800);
    } catch (err) {
      setConnectionMessage(err.message);
    } finally {
      setIsConnecting(false);
    }
  }

  async function cancelConnection() {
    if (!connectionId) {
      return;
    }

    setConnectionMessage('');
    setIsConnectionMessageLeaving(false);
    setIsConnecting(true);

    try {
      await apiRequest(`/api/developer/connections/${connectionId}`, {
        token,
        method: 'DELETE',
      });
      setConnectionStatus('');
      setConnectionId(null);
      setConnectionMessage('Retracted');
      window.setTimeout(() => setIsConnectionMessageLeaving(true), 1200);
      window.setTimeout(() => setConnectionMessage(''), 1800);
    } catch (err) {
      setConnectionMessage(err.message);
    } finally {
      setIsConnecting(false);
    }
  }

  async function acceptConnection() {
    if (!connectionId) {
      return;
    }

    setConnectionMessage('');
    setIsConnectionMessageLeaving(false);
    setIsConnecting(true);

    try {
      await apiRequest(`/api/developer/connections/${connectionId}/accept`, {
        token,
        method: 'PATCH',
      });
      setConnectionStatus('ACCEPTED');
      setConnectionDirection('');
      setConnectionMessage('Connected');
      window.setTimeout(() => setIsConnectionMessageLeaving(true), 1200);
      window.setTimeout(() => setConnectionMessage(''), 1800);
    } catch (err) {
      setConnectionMessage(err.message);
    } finally {
      setIsConnecting(false);
    }
  }

  function handleConnectionButtonClick() {
    if (connectionStatus === 'PENDING' && connectionDirection === 'INCOMING') {
      acceptConnection();
      return;
    }
    if (connectionStatus === 'PENDING' && connectionDirection === 'OUTGOING') {
      cancelConnection();
      return;
    }
    requestConnection();
  }

  async function toggleSavedCandidate() {
    setSaveMessage('');
    setIsSaveMessageLeaving(false);
    setIsSavingCandidate(true);

    try {
      if (savedCandidateId) {
        await apiRequest(`/api/employer/saved-candidates/${savedCandidateId}`, {
          token,
          method: 'DELETE',
        });
        setSavedCandidateId(null);
        setSaveMessage('Removed');
      } else {
        const savedCandidate = await apiRequest('/api/employer/saved-candidates', {
          token,
          method: 'POST',
          body: JSON.stringify({ developerProfileId: profile.id }),
        });
        setSavedCandidateId(savedCandidate.id);
        setSaveMessage('Saved candidate');
      }
      window.setTimeout(() => setIsSaveMessageLeaving(true), 1200);
      window.setTimeout(() => setSaveMessage(''), 1800);
    } catch (err) {
      setSaveMessage(err.message);
    } finally {
      setIsSavingCandidate(false);
    }
  }

  function handleProofProjectChange(event) {
    const selectedName = event.target.value;
    const selectedProject = developerProofProjects.find((project) => project.name === selectedName);
    setProofProjectName(selectedName);
    setProofProjectUrl(selectedProject?.liveUrl || selectedProject?.githubUrl || '');
  }

  async function sendProof(event) {
    event.preventDefault();
    setProofStatus('');
    setIsSendingProof(true);

    try {
      await apiRequest('/api/developer/proof-signals', {
        token,
        method: 'POST',
        body: JSON.stringify({
          employerProfileId: profile.id,
          projectName: proofProjectName,
          projectUrl: proofProjectUrl,
          note: proofNote,
        }),
      });
      setProofStatus('Proof sent. This employer can now review your project signal.');
      setProofNote('');
    } catch (err) {
      setProofStatus(err.message);
    } finally {
      setIsSendingProof(false);
    }
  }

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
            <div className="profile-detail-copy">
              <p className="eyebrow">{isEmployerProfile ? 'Employer profile' : 'Developer profile'}</p>
              <h1>{profile.name}</h1>
              <p>{profile.title}</p>
              {isDeveloperProfile && (
                <span className={`candidate-signal-badge ${candidateSignalLabel(profile.proofQuality).toLowerCase().replaceAll(' ', '-')}`}>
                  {candidateSignalLabel(profile.proofQuality)}
                </span>
              )}
              <div className="skill-list">
                {skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              {isDeveloperProfile && <ContactLinks contactLinks={profile.contactLinks} className="profile-detail-contact-links" />}
              {preferenceChips.length > 0 && (
                <div className="profile-preference-row" aria-label="Developer preferences">
                  {preferenceChips.map((preference) => (
                    <span key={preference}>{preference}</span>
                  ))}
                </div>
              )}
              {shouldShowDeveloperConnection && profile.acceptsConnections && (
                <div className="profile-action-row">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleConnectionButtonClick}
                    disabled={!canRequestConnection || isConnecting || connectionStatus === 'ACCEPTED'}
                  >
                    <UserPlus size={17} />
                    <span>
                      {connectionStatus === 'ACCEPTED'
                        ? 'Connected'
                        : connectionStatus === 'PENDING' && connectionDirection === 'OUTGOING'
                          ? 'Request sent'
                          : isConnecting ? 'Sending request...' : 'Connect'}
                    </span>
                  </button>
                  {connectionMessage && (
                    <p className={
                      connectionMessage.includes('not') || connectionMessage.includes('cannot')
                        ? 'error'
                        : `connection-toast ${isConnectionMessageLeaving ? 'leaving' : ''}`
                    }>
                      {connectionMessage}
                    </p>
                  )}
                </div>
              )}
              {canSaveCandidate && (
                <div className="profile-action-row">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={toggleSavedCandidate}
                    disabled={isSavingCandidate}
                  >
                    <Bookmark size={17} />
                    <span>
                      {isSavingCandidate
                        ? 'Saving...'
                        : savedCandidateId ? 'Saved' : 'Save candidate'}
                    </span>
                  </button>
                  {saveMessage && (
                    <p className={
                      saveMessage.includes('not')
                        ? 'error'
                        : `connection-toast ${isSaveMessageLeaving ? 'leaving' : ''}`
                    }>
                      {saveMessage}
                    </p>
                  )}
                </div>
              )}
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
                {isEmployerProfile ? (
                  <EmployerNeedsList needs={needs} fallbackProjects={projects} describeIdealDeveloper={idealJuniorDevFor} />
                ) : projects.length === 0 ? (
                  <p className="subtle">
                    This developer has not published project proof yet.
                  </p>
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
            </div>

            <aside className="profile-feed-panel">
              {canSendProof && (
                <section className="workspace-panel proof-signal-panel">
                  <div className="panel-heading-row">
                    <h2>Send proof</h2>
                    <Send size={20} />
                  </div>
                  <p className="subtle">
                    Show this employer a project that proves you can help with their kind of work.
                  </p>
                  <form className="proof-signal-form" onSubmit={sendProof}>
                    {developerProofProjects.length > 0 ? (
                      <label htmlFor="proof-project">
                        Project proof
                        <select
                          id="proof-project"
                          value={proofProjectName}
                          onChange={handleProofProjectChange}
                          required
                        >
                          <option value="">Choose one of your projects</option>
                          {developerProofProjects.map((project) => (
                            <option key={project.id ?? project.name} value={project.name}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label htmlFor="proof-project-name">
                        Project proof
                        <input
                          id="proof-project-name"
                          value={proofProjectName}
                          onChange={(event) => setProofProjectName(event.target.value)}
                          placeholder="Portfolio API, analytics dashboard, auth flow"
                          required
                        />
                      </label>
                    )}
                    <label htmlFor="proof-project-url">
                      Proof link
                      <input
                        id="proof-project-url"
                        type="url"
                        value={proofProjectUrl}
                        onChange={(event) => setProofProjectUrl(event.target.value)}
                        placeholder="https://github.com/you/project"
                      />
                    </label>
                    <label htmlFor="proof-note">
                      Why this fits
                      <textarea
                        id="proof-note"
                        value={proofNote}
                        onChange={(event) => setProofNote(event.target.value)}
                        placeholder="I built a similar dashboard/auth flow/API and can help with this problem because..."
                        required
                      />
                    </label>
                    <button className="primary-button" type="submit" disabled={isSendingProof}>
                      <Send size={17} />
                      <span>{isSendingProof ? 'Sending proof...' : 'Send proof'}</span>
                    </button>
                  </form>
                  {proofStatus && <p className={proofStatus.startsWith('Proof sent') ? 'info-message' : 'error'}>{proofStatus}</p>}
                </section>
              )}

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
