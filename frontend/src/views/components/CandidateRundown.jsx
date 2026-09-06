import React, { memo, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CheckCircle2, LoaderCircle, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../state/AuthContext.jsx';
import '../../styles/rundown.css';

function safeLink(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

const HighlightedEvidence = memo(function HighlightedEvidence({ text, signals }) {
  const terms = [...new Set((signals ?? []).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!terms.length || !text) return text || 'No project description provided.';
  const pattern = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(pattern).map((part, index) => index % 2
    ? <mark key={index}>{part}</mark> : part);
});

function CandidateRundown({ selection, token, onClose, setAiResults }) {
  const { logout } = useAuth();
  const dialogRef = useRef(null);
  const sourceRef = useRef(null);
  const cache = useRef(new Map());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    cache.current.clear();
  }, [token]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!selection) return undefined;
    const previousFocus = document.activeElement;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [selection]);

  useEffect(() => {
    if (!selection) return undefined;
    const key = JSON.stringify([selection.match.profile.id, selection.brief]);
    const cached = cache.current.get(key);
    setActiveEvidence(0);
    setError('');
    setErrorStatus(null);
    setData(cached ?? null);
    setLoading(!cached);
    if (cached) return undefined;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 32000);
    let cancelled = false;
    apiRequest('/api/ai/rundown', {
      token, method: 'POST', signal: controller.signal,
      body: JSON.stringify({ profileId: selection.match.profile.id, brief: selection.brief }),
    }).then((result) => {
      if (cancelled) return;
      if (cache.current.size >= 20) cache.current.delete(cache.current.keys().next().value);
      cache.current.set(key, result);
      setData(result);
      setAiResults((current) => current ? {
        ...current,
        dailySearchesRemaining: result.dailySearchesRemaining,
        dailySearchesUsed: current.dailySearchLimit < 0 ? 0 : current.dailySearchLimit - result.dailySearchesRemaining,
      } : current);
    }).catch((err) => {
      if (!cancelled) {
        setError(err.message);
        setErrorStatus(err.status);
      }
    }).finally(() => {
      window.clearTimeout(timeout);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [selection, token, retry, setAiResults]);

  const profile = selection?.match.profile;
  const point = data?.evidence[activeEvidence];
  const employer = profile?.type === 'EMPLOYER';

  return (
    <dialog ref={dialogRef} className="candidate-rundown" aria-labelledby="rundown-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      } }}>
      {selection && <>
        <header className="rundown-header">
          <div>
            <span className="rundown-eyebrow"><Sparkles size={16} /> AI rundown</span>
            <h2 id="rundown-title">A closer look at {profile.name}</h2>
            <p>{profile.title}</p>
          </div>
          <button type="button" className="rundown-close" aria-label="Close AI rundown" onClick={onClose} autoFocus><X size={22} /></button>
        </header>
        <div className="rundown-body" aria-busy={loading}>
          <details className="rundown-brief"><summary>The brief behind this rundown</summary><p>{selection.brief}</p></details>
          {loading && <div className="rundown-loading" role="status">
            <LoaderCircle size={28} />
            <h3>Connecting the evidence to your brief</h3>
            <p>Looking at {profile.name}'s {employer ? 'work needs' : 'projects'}, relevant details, and questions worth asking.</p>
          </div>}
          {error && <div className="rundown-error" role="alert">
            <h3>{errorStatus === 401 ? 'Sign in again to continue' : 'The rundown couldn\u0027t finish'}</h3><p>{error}</p>
            {errorStatus === 401 ? <>
              <Link className="primary-button" to="/login" state={{ returnTo: '/match' }} onClick={() => { onClose(); logout(); }}>Sign in again</Link>
              <p className="rundown-note">This request did not use an AI allowance credit. Your search is saved for when you sign back in.</p>
            </> : <>
              {errorStatus !== 429 && <button type="button" className="secondary-button" onClick={() => setRetry((value) => value + 1)}>Try again</button>}
              <p className="rundown-note">Each generation attempt uses one AI allowance credit.</p>
            </>}
          </div>}
          {data && <>
            <section className="rundown-summary"><h3>{employer ? 'Why this opportunity could fit' : 'Why this person could fit'}</h3><p>{data.summary}</p></section>
            {data.evidence.length > 0 ? <div className="rundown-evidence-layout">
              <section className="rundown-reasons" aria-label="Connections to your brief">
                <h3>{employer ? 'The needs that matter' : 'The projects that matter'}</h3>
                <p className="rundown-note">Choose a connection to spotlight its profile evidence.</p>
                {data.evidence.map((item, index) => <div className={`rundown-reason ${activeEvidence === index ? 'is-active' : ''}`} key={`${item.projectName}-${index}`}>
                  <button type="button" className="rundown-evidence-toggle" aria-pressed={activeEvidence === index}
                    aria-controls="rundown-source" onClick={() => {
                      setActiveEvidence(index);
                      if (window.matchMedia('(max-width: 700px)').matches) {
                        window.requestAnimationFrame(() => sourceRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
                      }
                    }}>
                    <span className="rundown-number">{String(index + 1).padStart(2, '0')}</span>
                    <span>{item.projectName}</span>
                    {activeEvidence === index && <CheckCircle2 size={18} aria-hidden="true" />}
                  </button>
                  <p>{item.whyItMatters}</p>
                  <div className="rundown-question"><strong>Ask about this</strong><p>{item.question}</p></div>
                </div>)}
              </section>
              <aside ref={sourceRef} className="rundown-source" id="rundown-source" aria-label="Selected profile evidence" aria-live="polite">
                <span className="rundown-eyebrow">Evidence {activeEvidence + 1} · From the profile</span>
                <h3>{point.projectName}</h3>
                <blockquote><HighlightedEvidence text={point.description} signals={selection.match.strengths} /></blockquote>
                <div className="rundown-source-links">
                  {safeLink(point.githubUrl) && <a href={safeLink(point.githubUrl)} target="_blank" rel="noopener noreferrer">View code <ArrowUpRight size={16} /></a>}
                  {safeLink(point.liveUrl) && <a href={safeLink(point.liveUrl)} target="_blank" rel="noopener noreferrer">Open project <ArrowUpRight size={16} /></a>}
                </div>
                <p className="rundown-note">Profile-supplied evidence. The AI has not verified the code, links, or ownership.</p>
              </aside>
            </div> : <p className="rundown-empty">There isn't enough relevant project evidence to spotlight. Review the uncertainties below before deciding.</p>}
            <section className="rundown-uncertainties"><h3>What still needs checking</h3><ul>{data.uncertainties.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
            <section className="rundown-next"><h3>A useful next step</h3><p>{data.nextStep}</p></section>
          </>}
        </div>
        <footer className="rundown-footer">
          <span>Based on the saved profile and your search brief.</span>
          <Link className="primary-button" to={`/profiles/${profile.id}`} onClick={onClose}>View full profile <ArrowUpRight size={16} /></Link>
        </footer>
      </>}
    </dialog>
  );
}

export default memo(CandidateRundown);
