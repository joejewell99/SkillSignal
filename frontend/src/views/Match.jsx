import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2, ChevronDown, ExternalLink, Info, LayoutGrid, List, Sparkles, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicFooter from '../ui/PublicFooter.jsx';
import PublicHeader from '../ui/PublicHeader.jsx';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';
import CandidateRundown from './components/CandidateRundown.jsx';

const developerPlaceholder = 'Example: I am looking for developers with React, Spring Boot, PostgreSQL, and dashboard experience. I would like to see GitHub projects, deployed work, screenshots, or proof they have handled auth, APIs, data cleanup, or production fixes.';
const employerPlaceholder = 'Example: I am strongest with React, Python, SQL, APIs, and dashboard work. I am looking for employers hiring junior developers for data cleanup, admin screens, reporting tools, or full-stack projects where my GitHub work would be useful.';
const aiMatchMessages = [
  'Work in. Proof out.',
  'Proof-led matching.',
  'Build a relevant network.',
  'Strong, well-reasoned responses.',
];
const exampleBriefs = {
  DEVELOPER: [
    {
      label: 'React · TypeScript · Spring Boot · PostgreSQL',
      prompt: 'I am looking for a developer to improve a React dashboard used to manage customer records and internal reporting. The current interface has slow data tables, inconsistent filters, and API requests that make the page feel unresponsive when users search or sort large datasets.\n\nThe ideal developer should be comfortable with React, JavaScript or TypeScript, REST APIs, Spring Boot, and PostgreSQL. I would like to see evidence of dashboard work, reusable components, loading and error states, API integration, authentication or role-based permissions, and thoughtful handling of performance issues.\n\nPlease prioritise developers who can show GitHub projects, deployed apps, screenshots, tests, or examples of solving similar problems rather than only listing the technologies.',
    },
    {
      label: 'Python · Django · Celery · PostgreSQL',
      prompt: 'I am looking for a developer to stabilise an internal operations platform that imports supplier CSV files, validates product data, and prepares records for reporting. Imports currently time out on larger files, duplicate records appear after retries, and staff have to manually investigate failures without a clear audit trail.\n\nThe ideal developer should be comfortable with Python, Django, PostgreSQL, Celery, Redis, Docker, and background job processing. They should be able to design reliable import pipelines, validate and clean data, make jobs safe to retry, surface useful failure messages, and improve the admin workflow for reviewing problem records. Experience with database constraints, migrations, tests, logging, and deployment is especially valuable.\n\nPlease prioritise developers who can show GitHub projects, deployed tools, tests, dashboards, or examples of data processing and backend reliability work. I want to see evidence that they can reason carefully about data quality, queues, retries, and maintainable operational systems rather than only listing the stack.',
    },
  ],
  EMPLOYER: [
    {
      label: 'React · TypeScript · Node.js · PostgreSQL',
      prompt: 'I am a junior full-stack developer looking for employers who need help improving internal dashboards, admin workflows, customer portals, or API-driven tools. I am strongest with React, TypeScript, Node.js, PostgreSQL, REST APIs, authentication, and responsive interface work.\n\nI have built a project called ShiftFlow, a deployed React and TypeScript operations dashboard for managing rota changes, team availability, and approval workflows. It includes reusable table and filter components, loading and error states, protected routes, form validation, and a Node.js API backed by PostgreSQL. I also built SupportDesk, a small customer-support portal with role-based access, ticket status tracking, search, and a responsive interface designed around real support workflows.\n\nI am looking for an employer with practical front-end or full-stack work where I can contribute to improving workflows, fixing UI issues, building reliable forms and tables, integrating APIs, or adding features to an existing product. I can provide GitHub repositories, deployed links, screenshots, and a walkthrough of the decisions behind each project.',
    },
    {
      label: 'Python · FastAPI · Docker · AWS',
      prompt: 'I am a developer looking for employers with backend, data-processing, reporting, or operational reliability problems to solve. My strongest areas are Python, FastAPI, PostgreSQL, Docker, AWS, REST APIs, automated testing, and building tools that make repetitive work more reliable.\n\nI built ImportWatch, a Python and FastAPI service that receives supplier CSV files, validates fields, records import outcomes, and gives staff an audit view of rejected rows. The project uses PostgreSQL for data integrity, Docker for a repeatable local environment, background processing for longer jobs, and structured logs so failures can be investigated without guessing. I also built a reporting API that turns cleaned operational data into scheduled summaries and downloadable exports, with tests around validation and edge cases.\n\nI am looking for an employer where I can help improve data imports, backend APIs, internal reporting, automation, deployment reliability, or the quality of operational information. I can show GitHub code, tests, architecture notes, screenshots, and deployed project evidence, and I am especially interested in teams that value careful problem solving and clear feedback.',
    },
  ],
};

function readStoredMatchState(storageKey) {
  try {
    const storedState = JSON.parse(sessionStorage.getItem(storageKey));
    return {
      brief: storedState?.brief || '',
      mode: storedState?.mode || '',
      results: storedState?.scoringVersion ? null : storedState?.results || null,
      resultsBrief: storedState?.resultsBrief ?? storedState?.brief ?? '',
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
  openRundown,
  isSelected,
  canOpenRundown,
}) {
  const [openPanelKey, setOpenPanelKey] = useState('');
  const cardKey = `${match.profile.id ?? match.profile.name}-${matchIndex}`;
  const togglePanel = (panelKey) => {
    setOpenPanelKey((currentKey) => currentKey === panelKey ? '' : panelKey);
  };

  return (
    <article className={`match-card ${isSelected ? 'rundown-selected' : ''}`}>
      <div className="match-card-heading">
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
      </div>
      <p className="proof-text">{match.reason}</p>
      {isEmployerMode && (
        <div className="readiness-coach">
          <div className={`accordion-panel ${openPanelKey === 'hiring' ? 'open' : ''}`}>
            <button className="accordion-trigger" type="button" aria-expanded={openPanelKey === 'hiring'} onClick={() => togglePanel('hiring')}>
              <h4>Are they likely to hire you around this?</h4>
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
      <div className={`match-columns ${isEmployerMode && (match.readinessScore ?? match.matchScore) < 75 ? 'needs-improvement' : ''}`}>
        <div>
          <h4>{isEmployerMode ? 'Skill overlap' : 'Matching skills'}</h4>
          <div className="skill-list">
            {match.strengths.map((strength) => <span key={strength}>{strength}</span>)}
          </div>
        </div>
        {isEmployerMode && (match.readinessScore ?? match.matchScore) < 75 ? (
          <div className="improvement-summary">
            <AlertTriangle size={18} />
            <div>
              <h4>Improve before applying</h4>
              <ul>
                {(match.improvementTips?.length ? match.improvementTips : match.gaps).slice(0, 2).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className={isEmployerMode ? 'ready-summary' : ''}>
            {isEmployerMode && <CheckCircle2 size={18} />}
            <div>
              <h4>{isEmployerMode ? 'Ready signals' : 'Uncertainties'}</h4>
              <ul>
                {(isEmployerMode ? ['No major gaps in skill for this role'] : match.gaps.length ? match.gaps : ['No specific uncertainties identified for this search.']).map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      <div className="match-action-row">
        {user ? <button className="secondary-button rundown-launch" type="button" onClick={() => openRundown(match)}
          disabled={!canOpenRundown} aria-haspopup="dialog" aria-label={`AI rundown for ${match.profile.name}`}>
          <Sparkles size={16} /><span>AI rundown</span>
        </button> : <Link className="secondary-button rundown-launch" to="/login" state={{ returnTo: '/match' }}>
          <Sparkles size={16} /><span>Sign in for AI rundown</span>
        </Link>}
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
      <p className="rundown-allowance">{user ? 'A focused explanation of this match. Uses 1 AI allowance credit when generated.' : 'AI rundowns are available with a developer or employer account.'}</p>
    </article>
  );
}

function AiStatusBanner({ aiResults, isAiRefreshing }) {
  if (!aiResults?.aiStatusMessage) {
    return null;
  }

  if (aiResults.aiStatus === 'PENDING') {
    return (
      <div className="ai-status-banner pending" role="status" aria-live="polite">
        <div className="ai-status-header">
          <span className="ai-status-chip">Quick-matched response</span>
          <span className="ai-status-loader" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
        <p>{isAiRefreshing ? 'Analysing and upgrading the response...' : aiResults.aiStatusMessage}</p>
      </div>
    );
  }

  if (aiResults.aiStatus === 'COMPLETE') {
    return (
      <div className="ai-status-banner complete" role="status" aria-live="polite">
        <div className="ai-status-header">
          <span className="ai-status-chip complete-chip">
            <CheckCircle2 size={14} />
            <span>Enhanced AI response</span>
          </span>
        </div>
        <p>{aiResults.aiStatusMessage}</p>
      </div>
    );
  }

  return (
    <div className="ai-status-banner fallback" role="status" aria-live="polite">
      <div className="ai-status-header">
        <span className="ai-status-chip fallback-chip">Quick-matched results</span>
      </div>
      <p>{aiResults.aiStatusMessage}</p>
    </div>
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
  const [resultsBrief, setResultsBrief] = useState(initialMatchState.resultsBrief || '');
  const [rundownSelection, setRundownSelection] = useState(null);
  const closeRundown = useCallback(() => setRundownSelection(null), []);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiRefreshing, setIsAiRefreshing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [connectionActivity, setConnectionActivity] = useState([]);
  const [connectingProfileId, setConnectingProfileId] = useState(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [resultView, setResultView] = useState('detail');
  const [aiMatchMessageIndex, setAiMatchMessageIndex] = useState(0);
  const [isSearchButtonPressed, setIsSearchButtonPressed] = useState(false);

  useEffect(() => {
    const storedState = readStoredMatchState(matchStorageKey);
    const nextMode = storedState.mode || defaultMode;
    setMatchMode(nextMode);
    setAiBrief(storedState.brief || '');
    setAiResults(storedState.results);
    setResultsBrief(storedState.resultsBrief || '');
    setRundownSelection(null);
    setAiError('');
  }, [defaultMode, matchStorageKey]);

  useEffect(() => {
    sessionStorage.setItem(matchStorageKey, JSON.stringify({ brief: aiBrief, mode: matchMode, results: aiResults, resultsBrief }));
  }, [aiBrief, aiResults, matchMode, matchStorageKey, resultsBrief]);

  useEffect(() => {
    if (rundownSelection || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setAiMatchMessageIndex((current) => (current + 1) % aiMatchMessages.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [rundownSelection]);

  useEffect(() => {
    if (!isSearchButtonPressed) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setIsSearchButtonPressed(false), 700);
    return () => window.clearTimeout(timeoutId);
  }, [isSearchButtonPressed]);

  useEffect(() => {
    if (user?.role !== 'DEVELOPER' || !token) {
      setConnectionActivity([]);
      return;
    }

    apiRequest('/api/developer/connections/activity', { token })
      .then(setConnectionActivity)
      .catch(() => setConnectionActivity([]));
  }, [token, user?.role]);

  useEffect(() => {
    if (!aiResults?.aiSearchId || aiResults.aiStatus !== 'PENDING') {
      setIsAiRefreshing(false);
      return undefined;
    }

    let cancelled = false;
    let timeoutId;
    setIsAiRefreshing(true);

    const pollForUpgrade = async () => {
      try {
        const updatedResults = await apiRequest(`/api/ai/matches/${aiResults.aiSearchId}`, {
          token,
          timeoutMs: 8000,
        });
        if (cancelled) {
          return;
        }
        setAiResults((current) => {
          // Poll responses carry the allowance from the original search. Keep credits used by a rundown.
          if (current?.aiSearchId !== updatedResults.aiSearchId || updatedResults.dailySearchLimit < 0) return updatedResults;
          const remaining = Math.min(current.dailySearchesRemaining, updatedResults.dailySearchesRemaining);
          return { ...updatedResults, dailySearchesRemaining: remaining, dailySearchesUsed: updatedResults.dailySearchLimit - remaining };
        });
        if (updatedResults.aiStatus === 'PENDING') {
          timeoutId = window.setTimeout(pollForUpgrade, 2000);
          return;
        }
        setIsAiRefreshing(false);
      } catch {
        if (cancelled) {
          return;
        }
        timeoutId = window.setTimeout(pollForUpgrade, 3000);
      }
    };

    timeoutId = window.setTimeout(pollForUpgrade, 1800);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [aiResults?.aiSearchId, aiResults?.aiStatus, token]);

  const handleAiSearch = (event) => {
    event.preventDefault();
    setIsSearchButtonPressed(true);
    if (!aiBrief.trim()) {
      setAiError('Add a skill, stack, project type, or hiring need to search.');
      return;
    }
    setIsAiLoading(true);
    setRundownSelection(null);
    setAiError('');

    apiRequest('/api/ai/matches', {
      token,
      method: 'POST',
      timeoutMs: 12000,
      body: JSON.stringify({ brief: aiBrief, mode: matchMode }),
    })
      .then((results) => {
        setAiResults(results);
        setResultsBrief(aiBrief);
        sessionStorage.setItem(matchStorageKey, JSON.stringify({ brief: aiBrief, mode: matchMode, results, resultsBrief: aiBrief }));
      })
      .catch((err) => {
        setAiResults(null);
        setAiError(err.message);
      })
      .finally(() => setIsAiLoading(false));
  };

  const updateMatchMode = (nextMode) => {
    setRundownSelection(null);
    setResultsBrief('');
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
  const formLabel = 'Describe the work';
  const heroHeading = isEmployerMode ? 'Find employers with work for your stack.' : 'Find quality developers, matched by AI.';
  const heroCopy = isEmployerMode
    ? 'Describe your stack, the work you have done, and the problems you want to solve next. SkillSignal will find employers with relevant hiring needs.'
    : 'Describe the software problem, stack, expected work, and proof you want to see. SkillSignal will find developers whose project evidence fits.';
  const panelCopy = isEmployerMode
    ? 'Include your strongest work, stack, ideal problems, and the proof you can share.'
    : 'Include the problem, stack, key responsibilities, and evidence that would build trust.';
  const submitLabel = isEmployerMode ? 'Find employers' : 'Find devs';
  const loadingLabel = isEmployerMode ? 'Finding employers...' : 'Finding devs...';
  const placeholder = isEmployerMode ? employerPlaceholder : developerPlaceholder;
  const hasUnlockedResults = Boolean(aiResults && !aiResults.rejected && aiResults.briefQuality !== 'NEEDS_MORE_DETAIL');
  const aiStatusTone = aiResults?.aiStatus === 'COMPLETE'
    ? 'complete'
    : aiResults?.aiStatus === 'FALLBACK'
      ? 'fallback'
      : aiResults?.aiStatus === 'PENDING'
        ? 'pending'
        : '';

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
    <main className={`public-page match-discovery ${rundownSelection ? 'rundown-open' : ''}`}>
      <div className="match-discovery-stage">
      <PublicHeader />

      <section className="tool-hero match-discovery-hero">
        <div className="hero-copy">
          <div className="ai-mode-toggle" aria-label="AI match mode">
            <button className={`match-mode-developer ${matchMode === 'DEVELOPER' ? 'active' : ''}`} type="button" onClick={() => updateMatchMode('DEVELOPER')}>
              Find Developers
            </button>
            <button className={`match-mode-employer ${matchMode === 'EMPLOYER' ? 'active' : ''}`} type="button" onClick={() => updateMatchMode('EMPLOYER')}>
              Find Employers
            </button>
          </div>
          <h1>{heroHeading}</h1>
          <p>{heroCopy}</p>
          <div className="match-flow-guide" aria-label="How AI Match works">
            <div>
              <span>01</span>
              <p><strong>Describe the work</strong> Add the stack, task, and proof that matters.</p>
            </div>
            <div>
              <span>02</span>
              <p><strong>Match against evidence</strong> SkillSignal compares it with real project signals.</p>
            </div>
            <div>
              <span>03</span>
              <p><strong>Review and connect</strong> Open the strongest profiles and make the next move.</p>
            </div>
          </div>
        </div>

        <form className="ai-search-panel" onSubmit={handleAiSearch}>
          <div className="ai-brief-meta" aria-hidden="true">
            <span>Your match brief</span>
            <span className="ai-brief-message" key={aiMatchMessageIndex}>
              {aiMatchMessages[aiMatchMessageIndex]}
            </span>
          </div>
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
                <strong>{isEmployerMode ? 'For better employer matches, include:' : 'For better developer matches, include:'}</strong>
                <ul>
                  {isEmployerMode ? (
                    <>
                      <li>Your strongest stack and project experience.</li>
                      <li>The work or problems you want to solve next.</li>
                      <li>The proof you can share, such as projects or demos.</li>
                    </>
                  ) : (
                    <>
                      <li>The software problem or outcome you need.</li>
                      <li>The stack and responsibilities involved.</li>
                      <li>The evidence that would build your confidence.</li>
                    </>
                  )}
                </ul>
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
          <div className="ai-example-prompts" aria-label="Full example match briefs">
            {Object.entries(exampleBriefs).map(([mode, examples]) => (
              <div className="ai-example-group" key={mode}>
                <span>{mode === 'DEVELOPER' ? 'Find devs' : 'Find employers'}</span>
                <div>
                  {examples.map((example) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => {
                        updateMatchMode(mode);
                        setAiBrief(example.prompt);
                      }}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className={`primary-button ai-submit ${isSearchButtonPressed ? 'just-pressed' : ''}`} disabled={isAiLoading} type="submit">
            <Sparkles size={18} />
            <span>{isAiLoading ? loadingLabel : submitLabel}</span>
          </button>
          <p className="quota-note">{quotaLabel}</p>
          {aiError && <p className="error">{aiError}</p>}
        </form>
      </section>

      {aiResults && (
        <section className={`ai-results-section ${resultView === 'grid' ? 'compact-results' : ''}`}>
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
              <div className="results-tools">
                <div className="result-view-toggle" aria-label="Results view">
                  <button
                    className={resultView === 'detail' ? 'active' : ''}
                    type="button"
                    aria-label="Detailed result view"
                    aria-pressed={resultView === 'detail'}
                    onClick={() => setResultView('detail')}
                  >
                    <List size={18} />
                  </button>
                  <button
                    className={resultView === 'grid' ? 'active' : ''}
                    type="button"
                    aria-label="Grid result view"
                    aria-pressed={resultView === 'grid'}
                    onClick={() => setResultView('grid')}
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
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
              </div>
            )}
          </div>

          <div className={`ai-brief-summary ${aiResults.rejected ? 'rejected' : aiResults.briefQuality === 'NEEDS_MORE_DETAIL' ? 'needs-detail' : ''}`}>
            <p>{aiResults.summary}</p>
            {aiResults.aiStatus !== 'NOT_USED' && aiResults.aiStatus !== 'UNAVAILABLE' && (
              <AiStatusBanner aiResults={aiResults} isAiRefreshing={isAiRefreshing} />
            )}
            {aiResults.aiStatus === 'UNAVAILABLE' && aiResults.aiStatusMessage && (
              <div className="ai-status-banner fallback">
                <strong>Local ranking only</strong>
                <p>{aiResults.aiStatusMessage}</p>
              </div>
            )}
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
            <div className={`match-grid ${resultView === 'grid' ? 'compact-view' : ''}`}>
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
                openRundown={(selectedMatch) => setRundownSelection({ match: selectedMatch, brief: resultsBrief })}
                isSelected={rundownSelection?.match.profile.id === match.profile.id}
                canOpenRundown={Boolean(resultsBrief) && !isAiLoading}
              />
            ))}
            </div>
          )}
          {connectionMessage && <p className={connectionMessage.includes('sent') ? 'info-message' : 'error'}>{connectionMessage}</p>}
        </section>
      )}
      </div>

      <div className="match-discovery-footer">
        <PublicFooter />
      </div>
      <CandidateRundown selection={rundownSelection} token={token} onClose={closeRundown} setAiResults={setAiResults} />
    </main>
  );
}
