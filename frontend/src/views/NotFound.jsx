import React from 'react';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicFooter from '../ui/PublicFooter.jsx';
import PublicHeader from '../ui/PublicHeader.jsx';

export default function NotFound() {
  return (
    <main className="public-page not-found-page">
      <PublicHeader />
      <section className="not-found-content" aria-labelledby="not-found-title">
        <SearchX size={42} aria-hidden="true" />
        <p className="eyebrow">404</p>
        <h1 id="not-found-title">That page is not here.</h1>
        <p>The link may be out of date, or the profile may no longer be public.</p>
        <Link className="primary-button" to="/">
          <ArrowLeft size={17} />
          <span>Back to marketplace</span>
        </Link>
      </section>
      <PublicFooter />
    </main>
  );
}
