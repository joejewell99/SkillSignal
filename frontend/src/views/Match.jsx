import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, ChevronDown, ExternalLink, Info, Sparkles, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicHeader from '../ui/PublicHeader.jsx';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';

const peerExampleBriefs = [
  'React dashboard projects',
  'Spring Boot and PostgreSQL',
  'Developers learning auth',
  'Python data cleanup',
];
const employerExampleBriefs = [
  'React admin screens',
  'Spring Boot authentication',
  'PostgreSQL reporting',
  'Python data cleanup',
];
const developerPlaceholder = 'Example: I am looking for developers with React, Spring Boot, PostgreSQL, and dashboard experience. I would like to see GitHub projects, deployed work, screenshots, or proof they have handled auth, APIs, data cleanup, or production fixes.';
const employerPlaceholder = 'Example: I am strongest with React, Python, SQL, APIs, and dashboard work. I am looking for employers hiring junior developers for data cleanup, admin screens, reporting tools, or full-stack projects where my GitHub work would be useful.';

function readStoredMatchState(storageKey) {
  try {
    const storedState = JSON.parse(sessionStorage.getItem(storageKey));
    return {
      brief: storedState?.brief || '',
      mode: storedState?.mode || '',
      results: storedState?.results || null,
    };
  } catch {
    sessionStorage.removeItem(storageKey);
    return { brief: '', mode: '', results: null };
  }
}

function MatchResultCard({
  match,
  matchIndex,
  isEmployerMode,
  user,
  connectionForProfile,
  connectingProfileId,
  connectWithDeveloper,
}) {
  const [openPanelKey, setOpenPanelKey] = useState('');
  const cardKey = `${match.profile.id ?? match.profile.name}-${matchIndex}`;
  const togglePanel = (panelKey) => {
    setOpenPanelKey((currentKey) => currentKey === panelKey ? '' : panelKey);
  };

  return (
    <article className="match-card">
      <div className="match-score">
        <strong>{isEmployerMode ? match.readinessScore ?? match.matchScore : match.matchScore}%</strong>
        <span>{isEmployerMode ? match.readinessLabel ?? 'readiness' : 'match'}</span>
      </div>
      <div className="match-profile">
        {match.profile.image ? (
          <img src={match.profile.image} alt={match.profile.name} />
        ) : (
          <div className="profile-placeholder">{match.profile.name.slice(0, 2).toUpperCase()}</div>
        )}
        <div>
          <div className="match-name-row">
            <h3>{match.profile.name}</h3>
          </div>
          <p>{match.profile.title}</p>
        </div>
      </div>
      <p className="proof-text">{match.reason}</p>
      {isEmployerMode && (
        <div className="readiness-coach">
          <div className={`accordion-panel ${openPanelKey === 'hiring' ? 'open' : ''}`}>
            <button className="accordion-trigger" type="button" aria-expanded={openPanelKey === 'hiring'} onClick={() => togglePanel('hiring')}>
              <h4>Are they likely to hire around this?</h4>
              <ChevronDown size={16} />
            </button>
            {openPanelKey === 'hiring' && <p className="accordion-body">{match.hiringOutlook}</p>}
          </div>
          <div className={`accordion-panel ${openPanelKey === 'proof' ? 'open' : ''}`}>
            <button className="accordion-trigger" type="button" aria-expanded={openPanelKey === 'proof'} onClick={() => togglePanel('proof')}>
              <h4>What should you show them?</h4>
              <ChevronDown size={16} />
            </button>
            {openPanelKey === 'proof' && <p className="accordion-body">{match.proofToShow}</p>}
          </div>
          <div className={`accordion-panel ${openPanelKey === 'next' ? 'open' : ''}`}>
            <button className="accordion-trigger" type="button" aria-expanded={openPanelKey === 'next'} onClick={() => togglePanel('next')}>
              <h4>Your next move</h4>
              <ChevronDown size={16} />
            </button>
            {openPanelKey === 'next' && <p className="accordion-body">{match.nextStep}</p>}
          </div>
        </div>
      )}
      {(match.evidence ?? []).length > 0 && (
        <div className="match-evidence">
          <h4>{isEmployerMode ? 'Hiring need evidence' : 'Project evidence'}</h4>
          <ul>
            {match.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="match-columns">
        <div>
          <h4>{isEmployerMode ? 'Need overlap' : 'Proof signals'}</h4>
          <div className="skill-list">
            {match.strengths.map((strength) => <span key={strength}>{strength}</span>)}
          </div>
        </div>
        {isEmployerMode && (match.readinessScore ?? match.matchScore) < 75 ? (
          <div className={`improvement-tips accordion-panel ${openPanelKey === 'improve' ? 'open' : ''}`}>
            <button className="accordion-trigger" type="button" aria-expanded={openPanelKey === 'improve'} onClick={() => togglePanel('improve')}>
              <h4>Improve before applying</h4>
              <ChevronDown size={16} />
            </button>
            {openPanelKey === 'improve' && (
              <ul className="accordion-list">
                {(match.improvementTips?.length ? match.improvementTips : match.gaps).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div>
            <h4>{isEmployerMode ? 'Ready signals' : 'Check before acting'}</h4>
            <ul>
              {(match.gaps.length ? match.gaps : ['No major gap from this search']).map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        <h4>{isEmployerMode ? 'Questions to answer' : 'Connection prompts'}</h4>
        <ul>
          {match.interviewQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </div>
      <div className="match-action-row">
        <Link className="secondary-button match-view-profile" to={`/profiles/${match.profile.id}`}>
          <ExternalLink size={16} />
          <span>{isEmployerMode ? 'View employer' : 'View profile'}</span>
        </Link>
        {!isEmployerMode && user?.role === 'DEVELOPER' && match.profile.acceptsConnections && (
          <button
            className="primary-button"
            type="button"
            disabled={Boolean(connectionForProfile(match.profile.id)) || connectingProfileId === match.profile.id}
            onClick={() => connectWithDeveloper(match.profile.id)}
          >
            <UserPlus size={16} />
            <span>
              {connectingProfileId === match.profile.id
                ? 'Connecting...'
                : connectionForProfile(match.profile.id)?.status === 'ACCEPTED'
                  ? 'Connected'
                  : connectionForProfile(match.profile.id)
                    ? 'Request sent'
                    : 'Connect'}
            </span>
          </button>
        )}
      </div>
    </article>
  );
}

export default function Match() {
  const { user, token } = useAuth();
  const defaultMode = 'DEVELOPER';
  const matchStorageKey = useMemo(() => `skillsignal.ai-match.${user?.email || 'guest'}`, [user?.email]);
  const initialMatchState = useMemo(() => readStoredMatchState(matchStorageKey), [matchStorageKey]);
  const [matchMode, setMatchMode] = useState(initialMatchState.mode || defaultMode);
  const [aiBrief, setAiBrief] = useState(initialMatchState.brief || '');
  const [aiResults, setAiResults] = useState(initialMatchState.results);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [connectionActivity, setConnectionActivity] = useState([]);
  const [connectingProfileId, setConnectingProfileId] = useState(null);
  const [connectionMessage, setConnectionMessage] = useState('');

  useEffect(() => {
    const storedState = readStoredMatchState(matchStorageKey);
    const nextMode = storedState.mode || defaultMode;
    setMatchMode(nextMode);
    setAiBrief(storedState.brief || '');
    setAiResults(storedState.results);
    setAiError('');
  }, [defaultMode, matchStorageKey]);

  useEffect(() => {
    sessionStorage.setItem(matchStorageKey, JSON.stringify({ brief: aiBrief, mode: matchMode, results: aiResults }));
  }, [aiBrief, aiResults, matchMode, matchStorageKey]);

  useEffect(() => {
    if (user?.role !== 'DEVELOPER' || !token) {
      setConnectionActivity([]);
      return;
    }

    apiRequest('/api/developer/connections/activity', { token })
      .then(setConnectionActivity)
      .catch(() => setConnectionActivity([]));
  }, [token, user?.role]);

  const handleAiSearch = (event) => {
    event.preventDefault();
    if (!aiBrief.trim()) {
      setAiError('Add a skill, stack, project type, or hiring need to search.');
      return;
    }
    setIsAiLoading(true);
    setAiError('');

    apiRequest('/api/ai/matches', {
      token,
      method: 'POST',
      body: JSON.stringify({ brief: aiBrief, mode: matchMode }),
    })
      .then((results) => {
        setAiResults(results);
        sessionStorage.setItem(matchStorageKey, JSON.stringify({ brief: aiBrief, mode: matchMode, results }));
      })
      .catch((err) => {
        setAiResults(null);
        setAiError(err.message);
      })
      .finally(() => setIsAiLoading(false));
  };

  const updateMatchMode = (nextMode) => {
    setMatchMode(nextMode);
    setAiBrief('');
    setAiResults(null);
    setAiError('');
    setConnectionMessage('');
  };

  const connectionForProfile = (profileId) => connectionActivity.find((item) => (
    String(item.requesterProfileId) === String(profileId)
    || String(item.receiverProfileId) === String(profileId)
  ));

  const connectWithDeveloper = async (profileId) => {
    setConnectionMessage('');
    setConnectingProfileId(profileId);

    try {
      const connection = await apiRequest('/api/developer/connections', {
        token,
        method: 'POST',
        body: JSON.stringify({ receiverProfileId: profileId }),
      });
      setConnectionActivity((current) => [
        connection,
        ...current.filter((item) => item.id !== connection.id),
      ]);
      setConnectionMessage('Connection request sent.');
    } catch (err) {
      setConnectionMessage(err.message);
    } finally {
      setConnectingProfileId(null);
    }
  };

  const isEmployerMode = matchMode === 'EMPLOYER';
  const activeExamples = isEmployerMode ? employerExampleBriefs : peerExampleBriefs;
  const formLabel = isEmployerMode ? 'Employer search' : 'Developer search';
  const heroHeading = isEmployerMode ? 'Find employers by need and stack.' : 'Find devs by skill and project proof.';
  const heroCopy = isEmployerMode
    ? 'Search by stack, work type, or problem area. SkillSignal will find employer profiles with related hiring needs.'
    : 'Search by stack, project type, learning goal, or collaboration idea. SkillSignal will find developers with related proof.';
  const panelCopy = isEmployerMode
    ? 'SkillSignal will rank employers by their needs, technical focus, and evidence they are likely to value.'
    : 'SkillSignal will rank developers by shared skills, project evidence, and useful connection signals.';
  const submitLabel = isEmployerMode ? 'Find employers' : 'Find devs';
  const loadingLabel = isEmployerMode ? 'Finding employers...' : 'Finding devs...';
  const placeholder = isEmployerMode ? employerPlaceholder : developerPlaceholder;
  const hasUnlockedResults = Boolean(aiResults && !aiResults.rejected && aiResults.briefQuality !== 'NEEDS_MORE_DETAIL');

  const quotaLabel = aiResults
    ? aiResults.dailySearchLimit < 0
      ? 'Unlimited AI searches today'
      : `${aiResults.dailySearchesRemaining} of ${aiResults.dailySearchLimit} AI searches left today`
    : user?.role === 'ADMIN'
      ? 'Unlimited AI searches today'
      : user?.role === 'EMPLOYER'
        ? 'Employers get 10 AI searches per day'
        : user?.role === 'DEVELOPER'
          ? 'Developers get 5 AI searches per day'
          : 'Guests get 3 AI searches per day';

  return (
    <main className="public-page">
      <PublicHeader />

      <section className="tool-hero">
        <div className="hero-copy">
          <p className="eyebrow">AI match</p>
          <div className="ai-mode-toggle" aria-label="AI match mode">
            <button className={matchMode === 'DEVELOPER' ? 'active' : ''} type="button" onClick={() => updateMatchMode('DEVELOPER')}>
              Find Developers
            </button>
            <button className={matchMode === 'EMPLOYER' ? 'active' : ''} type="button" onClick={() => updateMatchMode('EMPLOYER')}>
              Find Employers
            </button>
          </div>
          <h1>{heroHeading}</h1>
          <p>{heroCopy}</p>
        </div>

        <form className="ai-search-panel" onSubmit={handleAiSearch}>
          <div className="ai-panel-heading">
            <BrainCircuit size={24} />
            <div>
              <label htmlFor="ai-brief">{formLabel}</label>
              <p>{panelCopy}</p>
            </div>
            <div className="score-info search-score-info">
              <button type="button" aria-label="What makes a strong AI match brief">
                <Info size={18} />
              </button>
              <div className="score-tooltip" role="tooltip">
                <strong>For best search results:</strong>
                <p>
                  SkillSignal works best when your brief gives a clear picture of the work, the stack,
                  and the proof you would trust.
                </p>
                <ul>
                  <li>Discuss the software problem: slow pages, auth bugs, messy imports, fragile deployments.</li>
                  <li>Describe the evidence you want: GitHub projects, live demos, screenshots, tests, similar work.</li>
                  <li>List the stack you are looking for: React, Spring Boot, PostgreSQL, Docker, Rails, Python.</li>
                  <li>Name the work type: dashboard, API, permissions, reporting, data cleanup, deployment.</li>
                  <li>Describe the ideal person: careful, junior-friendly, communicative, production-minded.</li>
                </ul>
                <p className="tooltip-example">
                  Short examples: slow React dashboard, Spring Security auth, PostgreSQL reporting, Docker deployment.
                </p>
              </div>
            </div>
          </div>
          <textarea
            id="ai-brief"
            value={aiBrief}
            onChange={(event) => {
              setAiBrief(event.target.value);
              setAiResults(null);
            }}
            placeholder={placeholder}
            rows={8}
          />
          <div className="prompt-chips" aria-label="Example briefs">
            {activeExamples.map((brief) => (
              <button key={brief} type="button" onClick={() => {
                setAiBrief((current) => current.trim() ? `${current.trim()}\n${brief}` : brief);
                setAiResults(null);
                setAiError('');
              }}>
                {brief}
              </button>
            ))}
          </div>
          <button className="primary-button ai-submit" disabled={isAiLoading} type="submit">
            <Sparkles size={18} />
            <span>{isAiLoading ? loadingLabel : submitLabel}</span>
          </button>
          <p className="quota-note">{quotaLabel}</p>
          {aiError && <p className="error">{aiError}</p>}
        </form>
      </section>

      {aiResults && (
        <section className="ai-results-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Results</p>
              <h2>
                {aiResults.rejected
                  ? 'Search needs a software signal'
                  : aiResults.briefQuality === 'NEEDS_MORE_DETAIL'
                    ? 'Add more detail to unlock matches'
                    : isEmployerMode ? `${aiResults.matches.length} employers found` : `${aiResults.matches.length} devs found`}
              </h2>
            </div>
            {!aiResults.rejected && aiResults.briefQuality !== 'NEEDS_MORE_DETAIL' && (
              <div className="score-info results-score-info">
                <button type="button" aria-label="How match percentages are calculated">
                  <Info size={18} />
                </button>
                <div className="score-tooltip" role="tooltip">
                  <strong>How percentages work</strong>
                  <p>
                    {!isEmployerMode
                      ? 'Match scores compare your search with developer skills, project evidence, proof depth, and useful overlap for connection.'
                      : 'Match scores compare your search with employer needs, skills, problem areas, and useful fit signals.'}
                  </p>
                  <ul>
                    <li>Skills and stack overlap</li>
                    <li>Similar project proof</li>
                    <li>GitHub, live demo, screenshots, or featured work</li>
                    <li>Relevant risks like auth, performance, data, or deployment</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className={`ai-brief-summary ${aiResults.rejected ? 'rejected' : aiResults.briefQuality === 'NEEDS_MORE_DETAIL' ? 'needs-detail' : ''}`}>
            <p>{aiResults.summary}</p>
            {aiResults.rejectionReason && <p className="brief-guidance">{aiResults.rejectionReason}</p>}
            {(aiResults.followUpQuestions ?? []).length > 0 && (
              <div className="brief-followups">
                <h3>{aiResults.rejected ? 'Try adding' : 'Add a little more detail'}</h3>
                <ul>
                  {aiResults.followUpQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
            {![...(aiResults.requiredSkills ?? []), ...(aiResults.problemTypes ?? [])].length ? null : (
              <div className="skill-list">
                {[...(aiResults.requiredSkills ?? []), ...(aiResults.problemTypes ?? [])].map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
            )}
          </div>

          {hasUnlockedResults && aiResults.matches.length === 0 && (
            <div className="match-empty-state">
              <h3>No strong matches yet</h3>
              <p>
                Try adding a specific stack, work type, or proof signal like GitHub, screenshots, deployed app, auth, dashboard, SQL, data cleanup, or deployment.
              </p>
            </div>
          )}

          {hasUnlockedResults && aiResults.matches.length > 0 && (
            <div className="match-grid">
            {aiResults.matches.map((match, matchIndex) => (
              <MatchResultCard
                key={`${match.profile.id ?? match.profile.name}-${matchIndex}`}
                match={match}
                matchIndex={matchIndex}
                isEmployerMode={isEmployerMode}
                user={user}
                connectionForProfile={connectionForProfile}
                connectingProfileId={connectingProfileId}
                connectWithDeveloper={connectWithDeveloper}
              />
            ))}
            </div>
          )}
          {connectionMessage && <p className={connectionMessage.includes('sent') ? 'info-message' : 'error'}>{connectionMessage}</p>}
        </section>
      )}
    </main>
  );
}
