import React, { useState } from 'react';
import { BriefcaseBusiness, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

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
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DEVELOPER',
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function chooseRole(role) {
    setSelectedRole(role);
    setForm((current) => ({ ...current, role }));
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
      await register(form);
      setStatus('Account created. Taking you to your dashboard...');
    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page register-page">
      <section className="register-layout">
        <div className="register-heading">
          <p className="eyebrow">Join SkillSignal</p>
          <h1>Choose how you want to use SkillSignal.</h1>
          <p className="subtle">Pick a side, then create the account that matches what you want to do.</p>
        </div>

        <div className="role-choice-grid">
          {Object.entries(roleOptions).map(([role, option]) => {
            const Icon = option.icon;
            return (
              <button
                className={`role-choice ${selectedRole === role ? 'selected' : ''}`}
                key={role}
                type="button"
                onClick={() => chooseRole(role)}
              >
                <img src={option.image} alt="" />
                <span className="role-choice-content">
                  <Icon size={24} />
                  <strong>{option.title}</strong>
                  <span>{option.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        {selectedRole && (
          <section className="auth-panel register-form-panel">
            <div>
              <p className="eyebrow">{roleOptions[selectedRole].title} account</p>
              <h2>Create your account</h2>
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
              {status && <p className="success">{status}</p>}
              {error && <p className="error">{error}</p>}
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : `Create ${roleOptions[selectedRole].title.toLowerCase()} account`}
              </button>
            </form>
          </section>
        )}

        <p className="switch-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
