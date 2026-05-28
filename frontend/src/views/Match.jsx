import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, ExternalLink, Info, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicHeader from '../ui/PublicHeader.jsx';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';

const exampleBriefs = [
  'Spring Security + Docker',
  'Slow finance dashboard',
  'React admin screens',
  'PostgreSQL reporting',
];
const defaultBrief = 'We use Spring Boot, Spring Security, Docker, PostgreSQL, and React. Our finance dashboard is slow, and we need a junior developer who can help maintain auth and improve database queries safely.';

function readStoredMatchState(storageKey) {
  try {
    const storedState = JSON.parse(sessionStorage.getItem(storageKey));
    return {
      brief: storedState?.brief || defaultBrief,
      results: storedState?.results || null,
    };
  } catch {
    sessionStorage.removeItem(storageKey);
    return { brief: defaultBrief, results: null };
  }
}

export default function Match() {
  const { user, token } = useAuth();
  const matchStorageKey = useMemo(() => `skillsignal.ai-match.${user?.email || 'guest'}`, [user?.email]);
  const initialMatchState = useMemo(() => readStoredMatchState(matchStorageKey), [matchStorageKey]);
  const [aiBrief, setAiBrief] = useState(initialMatchState.brief);
  const [aiResults, setAiResults] = useState(initialMatchState.results);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    const storedState = readStoredMatchState(matchStorageKey);
    setAiBrief(storedState.brief);
    setAiResults(storedState.results);
    setAiError('');
  }, [matchStorageKey]);

  useEffect(() => {
    sessionStorage.setItem(matchStorageKey, JSON.stringify({ brief: aiBrief, results: aiResults }));
  }, [aiBrief, aiResults, matchStorageKey]);

  const handleAiSearch = (event) => {
    event.preventDefault();
    setIsAiLoading(true);
    setAiError('');

    apiRequest('/api/ai/matches', {
      token,
      method: 'POST',
      body: JSON.stringify({ brief: aiBrief }),
    })
      .then((results) => {
        setAiResults(results);
        sessionStorage.setItem(matchStorageKey, JSON.stringify({ brief: aiBrief, results }));
      })
      .catch((err) => {
        setAiResults(null);
        setAiError(err.message);
      })
      .finally(() => setIsAiLoading(false));
  };

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
          <h1>Describe the software work.</h1>
          <p>
            Use normal language. Mention the stack, production risks, bugs, maintenance work, and the kind of evidence you would trust.
          </p>
        </div>

        <form className="ai-search-panel" onSubmit={handleAiSearch}>
          <div className="ai-panel-heading">
            <BrainCircuit size={24} />
            <div>
              <label htmlFor="ai-brief">Employer brief</label>
              <p>SkillSignal will extract signals and rank junior developers by proof.</p>
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
            placeholder="Example: We use Spring Security and Docker every day. Our dashboard is slow and we need someone careful with PostgreSQL and production fixes."
            rows={8}
          />
          <div className="prompt-chips" aria-label="Example briefs">
            {exampleBriefs.map((brief) => (
              <button key={brief} type="button" onClick={() => {
                setAiBrief(`${aiBrief}\n${brief}`);
                setAiResults(null);
              }}>
                {brief}
              </button>
            ))}
          </div>
          <button className="primary-button ai-submit" disabled={isAiLoading} type="submit">
            <Sparkles size={18} />
            <span>{isAiLoading ? 'Finding matches...' : 'Find evidence-backed matches'}</span>
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
                  ? 'Brief needs a software hiring problem'
                  : aiResults.briefQuality === 'NEEDS_MORE_DETAIL'
                    ? 'Add more detail to unlock matches'
                    : `${aiResults.matches.length} developer matches found`}
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
                    Match scores compare your brief with developer skills, problem types, project evidence,
                    proof depth, and any gaps to check in interview.
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

          {!aiResults.rejected && aiResults.briefQuality !== 'NEEDS_MORE_DETAIL' && (
            <div className="match-grid">
            {aiResults.matches.map((match) => (
              <article className="match-card" key={match.profile.id}>
                <div className="match-score">
                  <strong>{match.matchScore}%</strong>
                  <span>match</span>
                </div>
                <div className="match-profile">
                  {match.profile.image ? (
                    <img src={match.profile.image} alt={match.profile.name} />
                  ) : (
                    <div className="profile-placeholder">{match.profile.name.slice(0, 2).toUpperCase()}</div>
                  )}
                  <div>
                    <h3>{match.profile.name}</h3>
                    <p>{match.profile.title}</p>
                  </div>
                </div>
                <p className="proof-text">{match.reason}</p>
                {(match.evidence ?? []).length > 0 && (
                  <div className="match-evidence">
                    <h4>Project evidence</h4>
                    <ul>
                      {match.evidence.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="match-columns">
                  <div>
                    <h4>Strengths</h4>
                    <div className="skill-list">
                      {match.strengths.map((strength) => <span key={strength}>{strength}</span>)}
                    </div>
                  </div>
                  <div>
                    <h4>Check gaps</h4>
                    <ul>
                      {(match.gaps.length ? match.gaps : ['No major gap from this brief']).map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <h4>Interview prompts</h4>
                  <ul>
                    {match.interviewQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                </div>
                <Link className="secondary-button match-view-profile" to={`/profiles/${match.profile.id}`}>
                  <ExternalLink size={16} />
                  <span>View profile</span>
                </Link>
              </article>
            ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
