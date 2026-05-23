import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DEVELOPER',
  });
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await register(form);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">SkillSignal</p>
          <h1>Create your account</h1>
          <p className="subtle">Choose the role you want to test first. Admin accounts are seeded by the backend.</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(event) => updateField('email', event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={form.password} onChange={(event) => updateField('password', event.target.value)} type="password" minLength="8" required />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
              <option value="DEVELOPER">Developer</option>
              <option value="EMPLOYER">Employer</option>
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary-button" type="submit">Create account</button>
        </form>

        <p className="switch-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
