import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@skillsignal.dev');
  const [password, setPassword] = useState('Admin123!');
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
      <section className="auth-panel">
        <div>
          <p className="eyebrow">SkillSignal</p>
          <h1>Sign in to your proof workspace</h1>
          <p className="subtle">Use role-based access to manage developer proof, employer search, or admin moderation.</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
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
    </main>
  );
}
