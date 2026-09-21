import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import BrandLogo from '../ui/BrandLogo.jsx';
import AuthStars from '../ui/AuthStars.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setStatus('Signing in...');
    setIsSubmitting(true);
    try {
      await login(email, password);
      setStatus('Signed in. Taking you to your dashboard...');
    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthStars />
      <div className="auth-shell">
        <div className="auth-branding">
          <BrandLogo />
          <p>Proof-backed hiring, in one focused workspace.</p>
        </div>
        <section className="auth-panel">
          <div className="auth-tabs" aria-label="Account access">
            <span className="auth-tab active">Sign in</span>
            <Link className="auth-tab" to="/register">Create account</Link>
          </div>
          <div className="auth-heading">
            <p className="eyebrow">Welcome back</p>
            <h1>Sign in to SkillSignal</h1>
            <p className="subtle">Continue to your proof workspace.</p>
          </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              placeholder="JordanBlake@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          {status && <p className="success">{status}</p>}
          {error && <p className="error">{error}</p>}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="switch-link">
          New here? <Link to="/register">Create an account</Link>
        </p>
        </section>
      </div>
    </main>
  );
}
