import React, { useState } from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import PublicHeader from '../ui/PublicHeader.jsx';
import { apiRequest } from '../api/client.js';

const exampleBriefs = [
  'Spring Security + Docker',
  'Slow finance dashboard',
  'React admin screens',
  'PostgreSQL reporting',
];

export default function Match() {
  const [aiBrief, setAiBrief] = useState('We use Spring Boot, Spring Security, Docker, PostgreSQL, and React. Our finance dashboard is slow, and we need a junior developer who can help maintain auth and improve database queries safely.');
  const [aiResults, setAiResults] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleAiSearch = (event) => {
    event.preventDefault();
    setIsAiLoading(true);
    setAiError('');

    apiRequest('/api/ai/matches', {
      method: 'POST',
      body: JSON.stringify({ brief: aiBrief }),
    })
      .then(setAiResults)
      .catch((err) => {
        setAiResults(null);
        setAiError(err.message);
      })
      .finally(() => setIsAiLoading(false));
  };

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
          </div>
          <textarea
            id="ai-brief"
            value={aiBrief}
            onChange={(event) => setAiBrief(event.target.value)}
            placeholder="Example: We use Spring Security and Docker every day. Our dashboard is slow and we need someone careful with PostgreSQL and production fixes."
            rows={8}
          />
          <div className="prompt-chips" aria-label="Example briefs">
            {exampleBriefs.map((brief) => (
              <button key={brief} type="button" onClick={() => setAiBrief(`${aiBrief}\n${brief}`)}>
                {brief}
              </button>
            ))}
          </div>
          <button className="primary-button ai-submit" disabled={isAiLoading} type="submit">
            <Sparkles size={18} />
            <span>{isAiLoading ? 'Finding matches...' : 'Find evidence-backed matches'}</span>
          </button>
          {aiError && <p className="error">{aiError}</p>}
        </form>
      </section>

      {aiResults && (
        <section className="ai-results-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Results</p>
              <h2>{aiResults.matches.length} developer matches found</h2>
            </div>
          </div>

          <div className="ai-brief-summary">
            <p>{aiResults.summary}</p>
            <div className="skill-list">
              {[...aiResults.requiredSkills, ...aiResults.problemTypes].map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
          </div>

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
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
