import React, { useEffect, useState } from 'react';
import { Bell, BellRing, CircleUserRound, Image, MessageSquareText, Monitor, Moon, ShieldAlert, Sparkles, Sun, Trash2 } from 'lucide-react';
import PublicFooter from '../ui/PublicFooter.jsx';
import PublicHeader from '../ui/PublicHeader.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { useTheme } from '../state/ThemeContext.jsx';
import { apiRequest } from '../api/client.js';

const PREFERENCES_KEY = 'skillsignal.settings';
const APPEARANCE_KEY = 'skillsignal.appearance';
const SETTINGS_SECTIONS = [
  { id: 'settings-account', label: 'Account' },
  { id: 'settings-appearance', label: 'Appearance' },
  { id: 'settings-updates', label: 'Notifications' },
  { id: 'settings-danger-zone', label: 'Danger zone' },
];

function readPreferences() {
  try {
    return {
      messages: true,
      connections: true,
      matching: true,
      profileActivity: true,
      weeklySummary: false,
      profileReminders: false,
      ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}'),
    };
  } catch {
    return { messages: true, connections: true, matching: true, profileActivity: true, weeklySummary: false, profileReminders: false };
  }
}

function readAppearance() {
  try {
    return {
      density: 'comfortable',
      showProfileImages: true,
      showInlineMedia: true,
      reduceMotion: false,
      ...JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? '{}'),
    };
  } catch {
    return { density: 'comfortable', showProfileImages: true, showInlineMedia: true, reduceMotion: false };
  }
}

function PreferenceToggle({ label, description, checked, onChange }) {
  return (
    <div className="settings-toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <button
        className={checked ? 'settings-switch is-on' : 'settings-switch'}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
      >
        <span aria-hidden="true" />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, token, updateAuth } = useAuth();
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState(readPreferences);
  const [appearance, setAppearance] = useState(readAppearance);
  const [showDeleteNotice, setShowDeleteNotice] = useState(false);
  const [name, setName] = useState(user.name);
  const [accountError, setAccountError] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
    document.documentElement.dataset.reduceMotion = appearance.reduceMotion ? 'true' : 'false';
  }, [appearance]);

  useEffect(() => {
    if (!accountStatus) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setAccountStatus(''), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [accountStatus]);

  useEffect(() => {
    let frameId = null;

    const updateActiveSection = () => {
      const triggerLine = window.scrollY + 150;
      const nextSection = SETTINGS_SECTIONS.reduce((current, section, index) => {
        const element = document.getElementById(section.id);
        return element && element.offsetTop <= triggerLine ? index : current;
      }, 0);
      setActiveSection(nextSection);
      frameId = null;
    };

    const requestUpdate = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateActiveSection);
      }
    };

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  function togglePreference(key) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  }

  function updateAppearance(key, value) {
    setAppearance((current) => ({ ...current, [key]: value }));
  }

  function scrollToSection(event, sectionId) {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
    if (element) {
      window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - headerHeight - 20, behavior: 'smooth' });
    }
  }

  async function saveName(event) {
    event.preventDefault();
    setAccountError('');
    setAccountStatus('');
    setIsSavingName(true);
    try {
      const nextAuth = await apiRequest('/api/auth/account', {
        token,
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      updateAuth(nextAuth);
      setName(nextAuth.name);
      setIsEditingName(false);
      setAccountStatus('Saved');
    } catch (error) {
      setAccountError(error.message);
    } finally {
      setIsSavingName(false);
    }
  }

  return (
    <main className="public-page settings-page">
      <PublicHeader />
      <nav className="settings-section-nav" aria-label="Settings sections" style={{ '--settings-nav-index': activeSection }}>
        <span className="settings-section-nav-line" aria-hidden="true" />
        <span className="settings-section-nav-dot" aria-hidden="true" />
        <div className="settings-section-nav-links">
          {SETTINGS_SECTIONS.map((section, index) => (
            <a
              className={index === activeSection ? 'active' : ''}
              href={`#${section.id}`}
              key={section.id}
              onClick={(event) => scrollToSection(event, section.id)}
            >
              <span className="settings-section-nav-mark" aria-hidden="true" />
              <span>{section.label}</span>
            </a>
          ))}
        </div>
      </nav>
      <section className="settings-hero">
        <div>
          <p className="eyebrow">Personal preferences</p>
          <h1>Settings that keep your signal yours.</h1>
          <p>Control how SkillSignal looks and what updates you want to receive. Your profile content remains in the dashboard.</p>
        </div>
      </section>

      <section className="settings-layout" aria-label="Settings">
        <article className="settings-card settings-account-card" id="settings-account">
          <form className="settings-account-form" onSubmit={saveName}>
            <div className="settings-card-heading settings-account-heading">
              <div className="settings-card-heading-copy">
                <CircleUserRound size={21} />
                <div>
                  <p className="eyebrow">Account</p>
                  <h2>Your SkillSignal identity</h2>
                </div>
              </div>
            </div>
            {isEditingName ? (
              <label className="settings-name-field">
                <span>Display name</span>
                <div>
                  <input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength="80" required />
                  <button className="primary-button" type="submit" disabled={isSavingName || name.trim() === user.name}>
                    {isSavingName ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </label>
            ) : (
              <div className="settings-readonly-field settings-name-field">
                <span>Display name</span>
                <div>
                  <strong>{user.name}</strong>
                  <button className="secondary-button settings-edit-button" type="button" onClick={() => setIsEditingName(true)}>
                    Edit
                  </button>
                </div>
              </div>
            )}
            <div className="settings-readonly-field">
              <span>Email</span>
              <strong>{user.email}</strong>
            </div>
            <div className="settings-readonly-field">
              <span>Account type</span>
              <strong>{user.role === 'EMPLOYER' ? 'Employer' : user.role === 'DEVELOPER' ? 'Developer' : 'Administrator'}</strong>
            </div>
            {accountError ? <p className="error settings-account-error">{accountError}</p> : null}
          </form>
          <p className="settings-note">Your display name appears across SkillSignal wherever your account and profile are shown.</p>
        </article>

        <article className="settings-card settings-appearance-card" id="settings-appearance">
          <div className="settings-card-heading">
            <Sun size={21} />
            <div><p className="eyebrow">Appearance</p><h2>Make the workspace feel like yours</h2></div>
          </div>
          <div className="settings-subsection">
            <div className="settings-subsection-heading"><div><h3>Theme</h3><p>Choose the colour treatment for your workspace.</p></div><Monitor size={18} /></div>
            <div className="theme-choice-grid" role="group" aria-label="Color theme">
              <button className={theme === 'light' ? 'theme-choice active' : 'theme-choice'} type="button" onClick={() => setTheme('light')}>
                <Sun size={19} /><span>Light</span><small>Clear, focused, and bright.</small>
              </button>
              <button className={theme === 'dark' ? 'theme-choice active' : 'theme-choice'} type="button" onClick={() => setTheme('dark')}>
                <Moon size={19} /><span>Dark</span><small>Easy on the eyes after hours.</small>
              </button>
            </div>
          </div>
          <div className="settings-subsection">
            <div className="settings-subsection-heading"><div><h3>Conversation display</h3><p>Preview how messages and shared work are presented.</p></div><MessageSquareText size={18} /></div>
            <div className={`appearance-preview ${appearance.density === 'compact' ? 'compact' : ''} ${appearance.showProfileImages ? '' : 'hide-images'} ${appearance.showInlineMedia ? '' : 'hide-media'}`}>
              <div className="appearance-preview-message"><span className="appearance-preview-avatar">JS</span><div><strong>Jordan Shaw <small>Today at 10:42</small></strong><p>Thanks for sending the project proof. The authentication flow is exactly the kind of work we need.</p>{appearance.showInlineMedia ? <div className="appearance-preview-media"><Image size={17} /><span>auth-flow-notes.png</span></div> : null}</div></div>
              <div className="appearance-preview-message"><span className="appearance-preview-avatar alt">MC</span><div><strong>Monica Clark <small>Today at 10:47</small></strong><p>Great, I have added the implementation notes and screenshots.</p></div></div>
            </div>
            <div className="settings-segmented-control" role="group" aria-label="Message density">
              <button className={appearance.density === 'comfortable' ? 'active' : ''} type="button" onClick={() => updateAppearance('density', 'comfortable')}>Comfortable</button>
              <button className={appearance.density === 'compact' ? 'active' : ''} type="button" onClick={() => updateAppearance('density', 'compact')}>Compact</button>
            </div>
            <div className="settings-toggle-list">
              <PreferenceToggle label="Display profile images" description="Show avatars beside messages, profiles, and activity." checked={appearance.showProfileImages} onChange={() => updateAppearance('showProfileImages', !appearance.showProfileImages)} />
              <PreferenceToggle label="Display inline media" description="Show shared screenshots and image previews in conversations." checked={appearance.showInlineMedia} onChange={() => updateAppearance('showInlineMedia', !appearance.showInlineMedia)} />
              <PreferenceToggle label="Reduce motion" description="Limit non-essential movement and transitions in the interface." checked={appearance.reduceMotion} onChange={() => updateAppearance('reduceMotion', !appearance.reduceMotion)} />
            </div>
          </div>
        </article>

        <article className="settings-card settings-notifications-card" id="settings-updates">
          <div className="settings-card-heading">
            <Bell size={21} />
            <div><p className="eyebrow">Notifications</p><h2>Only hear what matters</h2></div>
          </div>
          <div className="settings-subsection">
            <div className="settings-subsection-heading"><div><h3>Activity</h3><p>Stay close to the conversations and opportunities that need your attention.</p></div><BellRing size={18} /></div>
            <div className="settings-toggle-list">
              <PreferenceToggle label="Messages" description="New messages and replies in your conversations." checked={preferences.messages} onChange={() => togglePreference('messages')} />
              <PreferenceToggle label="Connection requests" description="Requests to connect and updates to existing connections." checked={preferences.connections} onChange={() => togglePreference('connections')} />
              <PreferenceToggle label="Matching activity" description="New matches and activity related to your profile or hiring needs." checked={preferences.matching} onChange={() => togglePreference('matching')} />
              <PreferenceToggle label="Profile activity" description="Useful updates when people interact with your profile or proof." checked={preferences.profileActivity} onChange={() => togglePreference('profileActivity')} />
            </div>
          </div>
          <div className="settings-subsection">
            <div className="settings-subsection-heading"><div><h3>Reminders and summaries</h3><p>Lower-priority updates to help you keep your signal current.</p></div><Sparkles size={18} /></div>
            <div className="settings-toggle-list">
              <PreferenceToggle label="Profile reminders" description="Occasional prompts to refresh projects, proof, and profile information." checked={preferences.profileReminders} onChange={() => togglePreference('profileReminders')} />
              <PreferenceToggle label="Weekly summary" description="A recap of activity, new conversations, and profile momentum." checked={preferences.weeklySummary} onChange={() => togglePreference('weeklySummary')} />
            </div>
          </div>
        </article>

        <article className="settings-card settings-danger-card" id="settings-danger-zone">
          <div className="settings-card-heading">
            <ShieldAlert size={21} />
            <div><p className="eyebrow">Danger zone</p><h2>Delete your account</h2></div>
          </div>
          <p>This will permanently remove your account data, profile, projects, messages, and connections; and you will no longer be able to access your SkillSignal history or network. This cannot be undone.</p>
          <button className="settings-delete-button" type="button" onClick={() => setShowDeleteNotice((visible) => !visible)}>
            <Trash2 size={17} />Delete account
          </button>
          {showDeleteNotice ? <p className="settings-delete-notice">Before deletion is confirmed, you will review what will be removed and confirm the decision. You will then be signed out. This protected flow is not active yet.</p> : null}
        </article>
      </section>
      <PublicFooter />
      {accountStatus ? <p className="settings-save-toast" role="status">{accountStatus}</p> : null}
    </main>
  );
}
