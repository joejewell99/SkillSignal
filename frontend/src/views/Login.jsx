import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@skillsignal.dev');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
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
          {error && <p className="error">{error}</p>}
          <button className="primary-button" type="submit">Sign in</button>
        </form>

        <p className="switch-link">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
