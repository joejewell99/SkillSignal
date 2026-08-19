import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import PublicFooter from '../ui/PublicFooter.jsx';
import PublicHeader from '../ui/PublicHeader.jsx';
import heroBackdrop from '../assets/home-hero-soft-studio.png';

const proofPoints = [
  {
    step: '01',
    eyebrow: 'Problem in',
    title: 'Employers explain the technical problem.',
    copy: 'A hiring brief starts with the real work: auth cleanup, dashboard performance, reporting, deployment issues, or product features that need building.',
    bullets: ['Real software problem', 'Stack and context', 'Hiring need in plain English'],
  },
  {
    step: '02',
    eyebrow: 'AI evaluation',
    title: 'SkillSignal uses AI to read the brief and evaluate proof.',
    copy: 'The system extracts stack clues, problem types, and proof requirements, then compares them against developer projects, screenshots, explanations, and linked work.',
    bullets: ['Reads brief for signal', 'Maps proof requirements', 'Checks backed-up evidence'],
  },
  {
    step: '03',
    eyebrow: 'Portfolio layer',
    title: 'Developers present a technical portfolio with real proof.',
    copy: 'Profiles are built for technical evaluation: projects, screenshots, implementation notes, tradeoffs, links, and the exact work a developer actually handled.',
    bullets: ['Projects and screenshots', 'Technical explanations', 'Clear ownership and depth'],
  },
  {
    step: '04',
    eyebrow: 'Best matches',
    title: 'Employers get the best matched results and connect faster.',
    copy: 'Instead of vague keyword filtering, employers receive ranked matches with fit reasons, while developers and employers connect inside one portfolio and discovery flow.',
    bullets: ['Ranked by fit', 'Reasons behind each match', 'One space to connect'],
  },
];

const matchSignals = [
  'AI reads the employer brief',
  'Proof-backed developer portfolios',
  'Clear fit reasons for every match',
];

const whyCards = [
  {
    eyebrow: 'CV problem',
    title: 'CVs show claims. SkillSignal shows proof.',
    copy: 'A CV can say a developer knows the stack, but it cannot show how they think or what they have actually built. SkillSignal puts the work itself at the centre of the profile.',
  },
  {
    eyebrow: 'Employer pain',
    title: 'Employers should search by problems, not job titles.',
    copy: 'Most hiring tools start with labels and filters. SkillSignal starts with the issue an employer needs solved, then looks for developers whose project proof matches that work.',
  },
  {
    eyebrow: 'Developer pain',
    title: 'Good work gets scattered and overlooked.',
    copy: 'Projects live across GitHub, portfolios, screenshots, notes, and demos. SkillSignal brings that evidence into one technical profile built for evaluation.',
  },
  {
    eyebrow: 'AI shift',
    title: 'AI connects the brief to the proof.',
    copy: 'AI reads the employer brief, evaluates project evidence, and explains why a developer is relevant, so both sides can move with more confidence.',
  },
];

const whyOutcomes = [
  {
    label: 'For developers',
    badge: 'Shows credible proof',
    value: 'Turns projects, screenshots, links, and explanations into a profile employers can evaluate.',
  },
  {
    label: 'For employers',
    badge: 'Highlights real talent',
    value: 'Describe the issue once, then get credible developers whose project proof shows they can solve it.',
  },
  {
    label: 'For matching',
    badge: 'Builds valuable connections',
    value: 'Removes guesswork by showing why a developer fits the problem, based on their actual project proof.',
  },
];

const tryCards = [
  {
    title: 'Try the AI matcher',
    copy: 'Describe the developer you need and see proof-backed matches with clear fit reasoning.',
    bullets: ['Write the brief in plain English', 'AI extracts stack and problem signals', 'Review ranked developer matches'],
    action: 'Try AI matcher',
    to: '/match',
    primary: true,
  },
  {
    title: 'Create your profile',
    copy: 'Build a developer portfolio that makes your projects easier to understand, evaluate, and discover.',
    bullets: ['Add projects, screenshots, and links', 'Explain your role and decisions', 'Get noticed for proof, not buzzwords'],
    action: 'Create account',
    to: '/register',
  },
  {
    title: 'Browse proof-rich profiles',
    copy: 'Explore developers by projects, stack, evidence, and the kind of problems they can help solve.',
    bullets: ['Inspect technical work quickly', 'Compare fit by evidence', 'Connect inside the same flow'],
    action: 'Browse profiles',
    to: '/profiles',
  },
];

const demoSignals = ['React dashboard', 'Spring Boot API', 'PostgreSQL', 'Auth flow', 'Clear project proof'];

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

const homeSections = [
  { id: 'home', label: 'Home' },
  { id: 'why-skillsignal', label: 'Why SkillSignal' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'try-it-out', label: 'Try it out' },
];

export default function Home() {
  const processRef = useRef(null);
  const [activeHomeSection, setActiveHomeSection] = useState(0);
  const [processProgress, setProcessProgress] = useState(0);
  const [runnerProgress, setRunnerProgress] = useState(0);
  const runnerProgressRef = useRef(0);

  useEffect(() => {
    let frameId = null;

    const updateActiveSection = () => {
      const triggerLine = window.scrollY + 120;
      const nextSection = homeSections.reduce((current, section, index) => {
        const element = document.getElementById(section.id);
        if (!element) {
          return current;
        }

        return element.offsetTop <= triggerLine ? index : current;
      }, 0);

      setActiveHomeSection(nextSection);
      frameId = null;
    };

    const requestUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(updateActiveSection);
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

  const handleSectionNavClick = (event, sectionId) => {
    event.preventDefault();

    if (sectionId === 'home') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      return;
    }

    if (sectionId === 'why-skillsignal') {
      const element = document.getElementById(sectionId);
      const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;

      if (element) {
        window.scrollTo({
          top: element.getBoundingClientRect().top + window.scrollY - headerHeight,
          behavior: 'smooth',
        });
      }

      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    let frameId = null;

    const animateRunner = () => {
      const current = runnerProgressRef.current;
      const distance = processProgress - current;

      if (Math.abs(distance) < 0.002) {
        runnerProgressRef.current = processProgress;
        setRunnerProgress(processProgress);
        frameId = null;
        return;
      }

      const next = current + distance * 0.11;
      runnerProgressRef.current = next;
      setRunnerProgress(next);
      frameId = window.requestAnimationFrame(animateRunner);
    };

    frameId = window.requestAnimationFrame(animateRunner);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [processProgress]);

  useEffect(() => {
    const element = processRef.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    let frameId = null;

    const updateProgress = () => {
      const rect = element.getBoundingClientRect();
      const shell = element.querySelector('.how-it-works-shell');
      const stickyTop = 80;
      const shellHeight = shell?.getBoundingClientRect().height ?? window.innerHeight;
      const scrollableDistance = rect.height - shellHeight;

      if (scrollableDistance <= 0) {
        setProcessProgress(0);
        frameId = null;
        return;
      }

      const rawProgressDistance = stickyTop - rect.top;
      const endpointBuffer = Math.min(260, scrollableDistance * 0.16);
      const animatedDistance = Math.max(scrollableDistance - endpointBuffer * 2, 1);
      const nextProgress = Math.min(Math.max((rawProgressDistance - endpointBuffer) / animatedDistance, 0), 1);
      setProcessProgress((current) => (Math.abs(current - nextProgress) > 0.002 ? nextProgress : current));
      frameId = null;
    };

    const requestProgressUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(updateProgress);
    };

    requestProgressUpdate();
    window.addEventListener('scroll', requestProgressUpdate, { passive: true });
    window.addEventListener('resize', requestProgressUpdate);

    return () => {
      window.removeEventListener('scroll', requestProgressUpdate);
      window.removeEventListener('resize', requestProgressUpdate);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const activeStep =
    processProgress < 0.24 ? 0 : processProgress < 0.58 ? 1 : processProgress < 0.92 ? 2 : 3;
  const borderOffset = 0;
  const runnerPercentX =
    runnerProgress < 1 / 3
      ? (runnerProgress / (1 / 3)) * 100
      : runnerProgress < 2 / 3
        ? 100
        : 100 - (((runnerProgress - 2 / 3) / (1 / 3)) * 100);
  const runnerPercentY =
    runnerProgress < 1 / 3
      ? 0
      : runnerProgress < 2 / 3
        ? ((runnerProgress - 1 / 3) / (1 / 3)) * 100
        : 100;

  return (
    <main className="public-page public-page-home">
      <nav
        className="home-section-nav"
        aria-label="Home page sections"
        style={{
          '--home-nav-index': activeHomeSection,
        }}
      >
        <span className="home-section-nav-line" aria-hidden="true" />
        <span className="home-section-nav-dot" aria-hidden="true" />
        <div className="home-section-nav-links">
          {homeSections.map((section, index) => (
            <a
              className={index === activeHomeSection ? 'active' : ''}
              href={`#${section.id}`}
              key={section.id}
              onClick={(event) => handleSectionNavClick(event, section.id)}
            >
              <span className="home-section-nav-mark" aria-hidden="true" />
              <span className="home-section-nav-label">{section.label}</span>
            </a>
          ))}
        </div>
      </nav>

      <PublicHeader />

      <section className="landing-hero landing-hero-thoughts" id="home">
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
          </div>
          <div className="hero-side-note" aria-hidden="true">
            <span className="hero-side-note-line" />
            <p>Proof, presentation, discovery, matching, and hiring flow in one place.</p>
          </div>
        </div>
      </section>

      <section className="landing-section why-skillsignal-section" id="why-skillsignal">
        <div className="why-signal-shell">
          <p className="eyebrow why-section-kicker">Why SkillSignal</p>
          <div className="why-skillsignal-heading">
            <h2>Why use SkillSignal?</h2>
            <p className="why-signal-lead">
              SkillSignal gives developers a place to package real technical evidence, and gives employers a faster way to find people who match the actual work.
            </p>
          </div>

          <div className="why-signal-layout">
            <article className="why-signal-feature">
              <p className="eyebrow">The product idea</p>
              <h3>Hiring should start with proof, not polished claims.</h3>
              <p>
                SkillSignal connects developers to employers through the work they can prove. Developers create a technical portfolio with project evidence. Employers explain the problem they need solved. The AI layer evaluates the brief against project evidence and returns matches with clear, traceable reasoning behind every recommendation.
              </p>
            </article>

            <div className="why-signal-grid">
              {whyCards.map((card) => (
                <article className="why-signal-card" key={card.title} tabIndex={0}>
                  <div className="why-signal-card-inner">
                    <div className="why-signal-card-face why-signal-card-front">
                      <p className="eyebrow">{card.eyebrow}</p>
                      <span className="why-signal-flip-hint">Flip for context</span>
                    </div>
                    <div className="why-signal-card-face why-signal-card-back">
                      <div className="why-signal-card-top">
                        <p className="eyebrow">{card.eyebrow}</p>
                      </div>
                      <h3>{card.title}</h3>
                      <p>{card.copy}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <article className="why-signal-proof">
            <div>
              <p className="eyebrow">What it solves</p>
            </div>
            <div className="why-outcome-grid">
              {whyOutcomes.map((outcome) => (
                <div className="why-outcome" key={outcome.label}>
                  <span className="why-outcome-label">{outcome.label}</span>
                  <strong className="why-outcome-badge">{outcome.badge}</strong>
                  <p>{outcome.value}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="landing-section how-it-works-section" id="how-it-works" ref={processRef}>
        <div className="how-it-works-shell how-it-works-shell-story">
          <span
            className="how-it-works-runner"
            aria-hidden="true"
            style={{
              left: `calc(${borderOffset}px + (${runnerPercentX} * ((100% - ${borderOffset * 2}px) / 100)))`,
              top: `calc(${borderOffset}px + (${runnerPercentY} * ((100% - ${borderOffset * 2}px) / 100)))`,
            }}
          />
          <div className="section-heading how-it-works-heading">
            <div>
              <p className="eyebrow">How it works</p>
              <h2>One workflow for both sides of the junior hiring problem</h2>
            </div>
            <p className="how-it-works-summary">
              Employers describe the work that actually needs doing. Developers show the proof that they can handle it.
            </p>
          </div>

          <div className="how-it-works-grid how-it-works-story-grid">
            <div className="how-it-works-story-panel">
              <div className="how-it-works-step-list" aria-label="Process steps">
                {proofPoints.map((item, index) => (
                  <article className={`how-it-works-step ${index === activeStep ? 'active' : ''}`} key={item.step}>
                    <div className="how-it-works-step-top">
                      <span className="how-it-works-number">{item.step}</span>
                      <p className="eyebrow">{item.eyebrow}</p>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="how-it-works-outcome" aria-label="How SkillSignal turns a brief into better matches">
              <div className="how-it-works-outcome-head">
                <div className="proof-icon-shell">
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <p className="eyebrow">What the product does</p>
                  <h3>Explain the problem, get the best matched results.</h3>
                </div>
              </div>

              <p className="how-it-works-outcome-copy">
                SkillSignal gives both sides a place to present and evaluate technical work. Developers build proof-rich portfolios. Employers describe what needs solving and receive ranked matches shaped by AI plus backed-up evidence.
              </p>

              <div className="how-it-works-signal-list" aria-hidden="true">
                {matchSignals.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>

              <div className="how-it-works-result-card">
                <p className="eyebrow">Match output</p>
                <ul className="feature-list how-it-works-result-list">
                  <li>
                    <Search size={18} />
                    <span>Brief turns into stack, proof, and problem signals</span>
                  </li>
                  <li>
                    <ShieldCheck size={18} />
                    <span>AI scores fit using real project evidence, not vague keywords</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} />
                    <span>Employers review clearer profiles and connect faster</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="landing-section try-it-out-section" id="try-it-out">
        <div className="try-it-out-shell">
          <div className="try-it-out-hero">
            <div className="try-it-out-copy">
              <p className="eyebrow">Try it out</p>
              <h2>Choose where you want to start.</h2>
              <p>
                Employers can test the AI matcher with a real hiring problem. Developers can create a profile, add proof, and start getting noticed for what they can actually build.
              </p>
            </div>

            <aside className="try-match-preview" aria-label="Example SkillSignal match preview">
              <div className="try-match-window">
                <div className="signal-board-header" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="eyebrow">Employer brief</p>
                <p className="try-match-brief">
                  Need a junior full-stack developer for auth, dashboards, API work, and PostgreSQL-backed features.
                </p>
                <div className="try-match-signals">
                  {demoSignals.map((signal) => (
                    <span key={signal}>{signal}</span>
                  ))}
                </div>
                <div className="try-match-result">
                  <strong>Best match reason</strong>
                  <p>Matched because the profile shows a full-stack dashboard, protected routes, Spring endpoints, database models, and implementation notes.</p>
                </div>
              </div>
            </aside>
          </div>

          <div className="try-card-grid">
            {tryCards.map((card) => (
              <article className={`try-card ${card.primary ? 'try-card-primary' : ''}`} key={card.title}>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </div>
                <ul className="try-card-list">
                  {card.bullets.map((bullet) => (
                    <li key={bullet}>
                      <CheckCircle2 size={16} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Link className={card.primary ? 'primary-button' : 'secondary-button'} to={card.to}>
                  {card.action}
                </Link>
              </article>
            ))}
          </div>

          <div className="try-it-out-example" aria-label="Example employer brief">
            <p className="eyebrow">The feeling we want</p>
            <p>
              Less guessing, less keyword theatre, fewer cold applications into the void. More visible proof, clearer reasons, and faster movement between developers and employers.
            </p>
            <span>SkillSignal turns technical work into a hiring signal people can actually use.</span>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
