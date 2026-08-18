import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import PublicHeader from '../ui/PublicHeader.jsx';
import heroBackdrop from '../assets/home-hero-soft-studio.png';

const proofPoints = [
  {
    icon: BrainCircuit,
    title: 'Employers describe real work',
    copy: 'Start with the actual problem: slow dashboards, auth cleanup, reporting, deployment friction, or production fixes.',
  },
  {
    icon: Search,
    title: 'SkillSignal extracts hiring signals',
    copy: 'The brief becomes stack clues, proof requirements, problem types, gaps to probe, and smarter interview prompts.',
  },
  {
    icon: ShieldCheck,
    title: 'Developers are matched by proof',
    copy: 'Projects, screenshots, explanations, links, and implementation depth matter more than polished keyword claims.',
  },
];

const heroThoughts = [
  'Why does junior tech hiring feel like sending a CV into a void?',
  'Can I show real proof instead of just keywords?',
  'How do I know what this developer actually built?',
  'Why is LinkedIn so broad for technical hiring?',
  'Can employers search by real engineering problems?',
  'What if GitHub showed the full hiring story too?',
  'Why are junior roles always so vague?',
  'Can I present projects like actual products?',
  'How do I separate real builders from polished profiles?',
  'Can I find developers by stack and evidence together?',
  'What if portfolios lived where employers already search?',
  'How can a junior developer stand out without buzzwords?',
  'Can I see screenshots, tradeoffs, and explanations in one place?',
  'Why do job boards feel like raffles?',
  'Could hiring start from the work that needs doing?',
  'How do employers find promising junior talent faster?',
  'Can messaging, proof, and matching live in one flow?',
  'What if technical profiles were structured properly?',
  'Can I search for problem-solvers instead of titles?',
  'Why does every portfolio site look disconnected from hiring?',
  'Can employers compare candidates with real context?',
  'How do I show depth, not just a tech stack list?',
  'What if projects were the first-class hiring signal?',
  'Can I find collaborators and employers in the same place?',
  'Why is technical hiring still mostly keyword filtering?',
  'Could proof-based matching reduce bad interviews?',
  'How do I browse developers by what they have actually shipped?',
  'Can this feel more like discovery than applying?',
  'What if junior developers were evaluated by substance first?',
  'Can one platform handle proof, presentation, and pipeline together?',
];

export default function Home() {
  return (
    <main className="public-page public-page-home">
      <PublicHeader />

      <section className="landing-hero landing-hero-thoughts">
        <img className="hero-backdrop-image" src={heroBackdrop} alt="" aria-hidden="true" />
        <div className="hero-backdrop-overlay" aria-hidden="true" />
        <div className="hero-thought-clouds" aria-hidden="true">
          {heroThoughts.map((thought, index) => (
            <article
              className="thought-cloud"
              key={thought}
              style={{
                '--thought-lane': `${4 + ((index * 4.6) % 24)}%`,
                '--thought-drift': `${((index % 4) - 1.5) * 18}px`,
                '--thought-duration': `${18 + (index % 5) * 2}s`,
                '--thought-delay': `${index * -2.6}s`,
              }}
            >
              <p>{thought}</p>
            </article>
          ))}
        </div>

        <div className="hero-copy hero-copy-thoughts">
          <div className="hero-copy-frame hero-copy-frame-dark">
            <p className="eyebrow">Proof-based junior hiring</p>
            <h1>Match junior developers to real software work by proof, not keywords.</h1>
            <p className="hero-answer">
              SkillSignal gives technical hiring a place where projects, screenshots, explanations, and proof of work are presented clearly, while employers search by the real problems they need solved instead of throwing resumes into a vague job-board abyss.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" to="/match">Try AI match</Link>
              <Link className="secondary-button" to="/profiles">Browse profiles</Link>
            </div>
            <div className="hero-proof-strip">
              <span>Structured technical profiles</span>
              <span>Problem-based employer search</span>
              <span>Proof-rich matching flow</span>
            </div>
          </div>
          <div className="hero-side-note" aria-hidden="true">
            <span className="hero-side-note-line" />
            <p>Proof, presentation, discovery, matching, and hiring flow in one place.</p>
          </div>
        </div>
      </section>

      <section className="landing-section how-it-works-section">
        <div className="how-it-works-shell">
          <div className="section-heading how-it-works-heading">
            <div>
              <p className="eyebrow">How it works</p>
              <h2>One workflow for both sides of the junior hiring problem</h2>
            </div>
            <p className="how-it-works-summary">
              Employers describe the work that actually needs doing. Developers show the proof that they can handle it.
            </p>
          </div>

          <div className="audience-grid proof-grid proof-grid-elevated">
            {proofPoints.map((item) => {
              const Icon = item.icon;
              return (
                <article className="audience-panel audience-panel-elevated" key={item.title}>
                  <div className="proof-icon-shell">
                    <Icon size={22} />
                  </div>
                  <h2>{item.title}</h2>
                  <p>{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <article className="workspace-panel landing-callout landing-callout-elevated">
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
