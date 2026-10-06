import React from 'react';
import { siGithub } from 'simple-icons';
import { icons } from '@iconify-json/logos';

export default function SocialBrandIcon({ brand, size = 17 }) {
  if (brand === 'linkedin') {
    return <svg width={size} height={size} viewBox="0 0 256 256" className="social-brand-icon" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: icons.icons['linkedin-icon'].body }} />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="social-brand-icon social-brand-icon--github" aria-hidden="true" focusable="false">
      <path d={siGithub.path} fill="currentColor" />
    </svg>
  );
}
