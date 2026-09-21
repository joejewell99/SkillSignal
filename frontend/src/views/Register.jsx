import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, Code2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import ImageWithFallback from '../ui/ImageWithFallback.jsx';
import BrandLogo from '../ui/BrandLogo.jsx';
import AuthStars from '../ui/AuthStars.jsx';

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
    acceptedTerms: true,
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transitioningRole, setTransitioningRole] = useState(null);

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
