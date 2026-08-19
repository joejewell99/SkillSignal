import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-main">
        <div className="public-footer-brand">
          <Link className="site-brand" to="/">
            <span className="brand-mark">SS</span>
            <strong>SkillSignal</strong>
          </Link>
          <p>
            SkillSignal is the proof layer for junior developer hiring, helping developers show real work and employers find people matched to the problems they need solved.
          </p>
        </div>

        <div className="public-footer-columns">
          <nav className="public-footer-column" aria-label="Product links">
            <h2>Product</h2>
            <Link to="/#why-skillsignal">Why SkillSignal</Link>
            <Link to="/#how-it-works">How it works</Link>
            <Link to="/match">AI matcher</Link>
          </nav>

          <nav className="public-footer-column" aria-label="Platform links">
            <h2>Platform</h2>
            <Link to="/profiles">Profiles</Link>
            <Link to="/register">Create account</Link>
            <Link to="/login">Sign in</Link>
          </nav>

          <nav className="public-footer-column" aria-label="Company links">
            <h2>Company</h2>
            <Link to="/">Home</Link>
            <Link to="/profiles">Browse talent</Link>
            <Link to="/match">Find matches</Link>
          </nav>
        </div>
      </div>

      <div className="public-footer-bottom">
        <span>© 2026 SkillSignal. All rights reserved.</span>
        <div>
          <Link to="/match">Try AI match</Link>
          <Link to="/register">Get started</Link>
        </div>
      </div>
    </footer>
  );
}
