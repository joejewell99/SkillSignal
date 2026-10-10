import React, { useEffect, useMemo, useRef, useState } from 'react';
import { assessPassword } from '../utils/passwordStrength.js';
import { BriefcaseBusiness, Code2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import ImageWithFallback from '../ui/ImageWithFallback.jsx';
import BrandLogo from '../ui/BrandLogo.jsx';
import AuthStars from '../ui/AuthStars.jsx';
import { EMAIL_ERROR, isValidEmail, validateEmailInput } from '../utils/emailValidation.js';

const roleOptions = {
  DEVELOPER: {
    title: 'Developer',
    description: 'Build a profile around your projects, skills, GitHub links, and proof of what you can do.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    icon: Code2,
  },
  EMPLOYER: {
    title: 'Employer',
    description: 'Search for developers by skills, project evidence, and the problems you need solved.',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
    icon: BriefcaseBusiness,
  },
};

export default function Register() {
  const { register } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const initialRole = requestedRole === 'EMPLOYER' || requestedRole === 'DEVELOPER' ? requestedRole : null;
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: initialRole || 'DEVELOPER',
  });
  const [error, setError] = useState('');
  const passwordStrength = useMemo(() => assessPassword(form.password, form.name, form.email), [form.password, form.name, form.email]);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transitioningRole, setTransitioningRole] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileContainer = useRef(null);
  const turnstileWidgetId = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    setTurnstileToken('');
    setTurnstileError('');
    setTurnstileReady(false);
    if (!selectedRole) return;
    let cancelled = false;
    let loadTimeout;
    let script;
    const loadError = () => {
      if (!cancelled) {
        setTurnstileToken('');
        setTurnstileError('Cloudflare verification could not load. Check your connection or content blocker and refresh.');
      }
    };
    const renderWidget = () => {
      if (cancelled || !turnstileContainer.current || !window.turnstile || turnstileWidgetId.current !== null) return;
      if (!siteKey) {
        setTurnstileError('Bot protection is not configured. Please try again later.');
        return;
      }
      try {
      turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
        sitekey: siteKey,
        theme: 'dark',
        size: turnstileContainer.current.clientWidth < 300 ? 'compact' : 'flexible',
        appearance: 'always',
        'refresh-expired': 'auto',
        callback: (token) => { if (!cancelled) { setTurnstileToken(token); setTurnstileError(''); setTurnstileReady(true); } },
        'expired-callback': () => { if (!cancelled) setTurnstileToken(''); },
        'timeout-callback': () => { if (!cancelled) setTurnstileToken(''); },
        'error-callback': () => { if (!cancelled) { setTurnstileToken(''); setTurnstileError('Cloudflare could not verify this request. Check your connection and retry.'); } },
      });
      setTurnstileError('');
      setTurnstileReady(true);
      } catch { loadError(); }
    };
    if (window.turnstile) {
      renderWidget();
    } else {
      const existing = document.querySelector('script[data-turnstile-script]');
      script = existing || document.createElement('script');
      script.addEventListener('load', renderWidget);
      script.addEventListener('error', loadError);
      if (!existing) {
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = 'true';
        document.head.appendChild(script);
      }
    }
    loadTimeout = window.setTimeout(() => {
      if (!cancelled && !window.turnstile) {
        setTurnstileError('Waiting for Cloudflare verification… If this remains, check your connection or content blocker.');
      }
    }, 8000);
    return () => {
      cancelled = true;
      window.clearTimeout(loadTimeout);
      script?.removeEventListener('load', renderWidget);
      script?.removeEventListener('error', loadError);
      if (turnstileWidgetId.current !== null && window.turnstile) {
        window.turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, [siteKey, selectedRole]);

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'EMPLOYER' || role === 'DEVELOPER') {
      setSelectedRole(role);
      setForm((current) => ({ ...current, role }));
    } else {
      
      setSelectedRole(null);
    }
  }, [searchParams]);
  function chooseRole(role) {
    setForm((current) => ({ ...current, role }));
    setError('');
    setStatus('');
    setTransitioningRole(role);
    window.setTimeout(() => {
      setSelectedRole(role);
      setSearchParams({ role });
      setTransitioningRole(null);
    }, 420);
  }

  function backToRoleChoice() {
    setSelectedRole(null);
    setSearchParams({});
    setError('');
    setStatus('');
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setStatus(`Creating ${form.role.toLowerCase()} account...`);
    setIsSubmitting(true);
    try {
      if (!isValidEmail(form.email)) throw new Error(EMAIL_ERROR);
      if (!passwordStrength.acceptable) throw new Error(passwordStrength.guidance || 'Use at least 8 characters.');
      if (!turnstileToken) throw new Error('Complete the Cloudflare bot protection check before creating your account.');
      await register({ ...form, acceptedTerms: true, turnstileToken });
      setStatus('Account created. Taking you to your dashboard...');
    } catch (err) {
      setError(err.message);
      setStatus('');
      setTurnstileToken('');
      if (turnstileWidgetId.current !== null && window.turnstile) window.turnstile.reset(turnstileWidgetId.current);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page register-page">
      <AuthStars />
      {selectedRole ? (
        <section className="register-form-view">
          <div className="auth-branding">
            <BrandLogo />
            <p>Begin your journey with SkillSignal.</p>
          </div>
          <section className="auth-panel register-form-panel">
            <div className="auth-tabs" aria-label="Account access">
              <Link className="auth-tab" to="/login">Sign in</Link>
              <span className="auth-tab active">Create account</span>
            </div>
            <div className="auth-heading register-form-heading">
              <p className="eyebrow">{roleOptions[selectedRole].title} account</p>
              <h1>Create your {roleOptions[selectedRole].title.toLowerCase()} account</h1>
              <button className="role-change" type="button" onClick={backToRoleChoice}>Choose a different account type</button>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <label>
                Name
                <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder={selectedRole === 'EMPLOYER' ? 'Company name' : 'Developer name'} maxLength="80" autoComplete={selectedRole === 'EMPLOYER' ? 'organization' : 'name'} required />
              </label>
              <label>
                Email
                <input value={form.email} onChange={(event) => { updateField('email', event.target.value); validateEmailInput(event.target); }} onBlur={(event) => validateEmailInput(event.target)} placeholder="you@example.com" type="email" maxLength="254" autoComplete="email" required />
              </label>
              <label>
                Password
                <input value={form.password} onChange={(event) => updateField('password', event.target.value)} type="password" placeholder="At least 8 characters" aria-describedby={passwordStrength.guidance ? 'password-guidance' : undefined} maxLength="72" autoComplete="new-password" required />
              </label>
              <div className="password-strength" data-score={passwordStrength.score}>
                <div className="password-strength-heading"><span>Password strength</span>{form.password && <strong>{passwordStrength.label}</strong>}</div>
                <div className="password-strength-bars" role="meter" aria-label="Estimated password strength" aria-valuemin={0} aria-valuemax={5} aria-valuenow={form.password ? passwordStrength.score + 1 : 0} aria-valuetext={form.password ? passwordStrength.label : 'Not entered'}>
                  {[0, 1, 2, 3, 4].map(index => <span key={index} className={form.password && index <= passwordStrength.score ? 'filled' : ''} />)}
                </div>
                <div aria-live="polite">{passwordStrength.guidance && <p id="password-guidance" className="password-warning">{passwordStrength.guidance}</p>}</div>
              </div>
              <div className="turnstile-wrap">
                <div ref={turnstileContainer} className="turnstile-widget" aria-label="Cloudflare bot protection" />
              </div>
              {!turnstileReady && !turnstileError && <p role="status">Loading verification...</p>}
              {turnstileError && <p className="error turnstile-error" role="alert">{turnstileError}</p>}
              {status && <p className="success">{status}</p>}
              {error && <p className="error">{error}</p>}
              <button className="primary-button" type="submit" disabled={isSubmitting || !turnstileToken || !passwordStrength.acceptable}>
                {isSubmitting ? 'Creating account...' : `Create ${roleOptions[selectedRole].title.toLowerCase()} account`}
              </button>
            </form>
            <p className="terms-notice">
              By creating an account you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>. We don&apos;t sell your data.
            </p>
          </section>
          <p className="switch-link">Already have an account? <Link to="/login">Sign in</Link></p>
        </section>
      ) : (
        <section className="register-layout">
          <div className="auth-branding register-branding">
            <BrandLogo />
          </div>
          <div className="register-heading">
            <h1>Choose your account type.</h1>
            <p className="subtle">Select Developer or Employer to get started.</p>
          </div>
          <div className={`role-choice-grid ${transitioningRole ? 'is-transitioning' : ''}`}>
            {Object.entries(roleOptions).map(([role, option]) => {
              const Icon = option.icon;
              return (
                <button className={`role-choice ${transitioningRole === role ? 'is-choosing' : ''}`} key={role} type="button" onClick={() => chooseRole(role)} disabled={Boolean(transitioningRole)}>
                  <span className="role-choice-media" aria-hidden="true">
                    <Icon size={52} />
                    <ImageWithFallback className="role-choice-image" src={option.image} alt="" fallback={null} />
                  </span>
                  <span className="role-choice-content">
                    <Icon size={24} />
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="switch-link">Already have an account? <Link to="/login">Sign in</Link></p>
        </section>
      )}
    </main>
  );
}
