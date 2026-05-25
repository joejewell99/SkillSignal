import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import PublicHeader from '../ui/PublicHeader.jsx';

const proofPoints = [
  {
    icon: BrainCircuit,
    title: 'Employers describe real work',
    copy: 'Spring Security maintenance, slow dashboards, Docker day-to-day, PostgreSQL reports, production fixes.',
  },
  {
    icon: Search,
    title: 'SkillSignal extracts hiring signals',
    copy: 'The brief becomes skills, problem types, evidence to check, gaps, and interview prompts.',
  },
  {
    icon: ShieldCheck,
    title: 'Junior developers are matched by proof',
    copy: 'Matches are ranked by project evidence instead of generic keywords or polished resume claims.',
  },
];

export default function Home() {
  return (
    <main className="public-page">
      <PublicHeader />

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">Proof-based junior hiring</p>
          <h1>Match junior developers to real software work by proof, not keywords.</h1>
          <p>
            SkillSignal helps employers describe the problem they need solved, then ranks junior developers by project evidence, strengths, gaps, and useful interview questions.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/match">Try AI match</Link>
            <Link className="secondary-button" to="/profiles">Browse profiles</Link>
          </div>
        </div>

        <div className="signal-board" aria-hidden="true">
          <div className="signal-board-header">
            <span />
            <span />
            <span />
          </div>
          <div className="signal-flow">
            <div className="signal-node active">
              <small>Employer brief</small>
              <strong>Slow Spring dashboard</strong>
            </div>
            <ArrowRight size={18} />
            <div className="signal-node">
              <small>Extracted signals</small>
              <strong>Security · Docker · SQL</strong>
            </div>
            <ArrowRight size={18} />
            <div className="signal-node active">
              <small>Best evidence</small>
              <strong>96% profile match</strong>
            </div>
          </div>
          <div className="signal-bars">
            <span style={{ '--signal-width': '92%' }} />
            <span style={{ '--signal-width': '74%' }} />
            <span style={{ '--signal-width': '64%' }} />
            <span style={{ '--signal-width': '48%' }} />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">How it works</p>
            <h2>One workflow for both sides of the junior hiring problem</h2>
          </div>
        </div>

        <div className="audience-grid proof-grid">
          {proofPoints.map((item) => {
            const Icon = item.icon;
            return (
              <article className="audience-panel" key={item.title}>
                <Icon size={24} />
                <h2>{item.title}</h2>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-section">
        <article className="workspace-panel landing-callout">
          <div>
            <p className="eyebrow">For junior developers</p>
            <h2>Show what you can actually handle</h2>
            <p className="subtle">
              Profiles are built around projects, evidence links, stack choices, tradeoffs, and clear explanations of what you personally built.
            </p>
          </div>
          <ul className="feature-list">
            <li>
              <CheckCircle2 size={18} />
              <span>Turn projects into hiring evidence</span>
            </li>
            <li>
              <CheckCircle2 size={18} />
              <span>Understand which roles you are close to</span>
            </li>
            <li>
              <CheckCircle2 size={18} />
              <span>Get matched to employer problems, not vague job titles</span>
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
