import React from 'react';

export default function BrandLogo() {
  return (
    <svg className="brand-mark" viewBox="13 0 180 64" preserveAspectRatio="xMinYMid meet" width="144" height="48" role="img" aria-label="SkillSignal">
      <g fill="var(--ink)" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" letterSpacing="0">
        <text x="12" y="52" fontSize="40">S</text>
        <text x="38" y="52" fontSize="30">k</text>
        <rect x="57.75" y="36.375" width="4.25" height="15.625" />
        <circle cx="59.875" cy="32.25" r="2.125" />
        <rect x="65" y="30.25" width="4.25" height="21.75" />
        <rect x="72.25" y="30.25" width="4.25" height="21.75" />
        <text x="78" y="52" fontSize="30">signal</text>
      </g>
      <g fill="none" stroke="var(--signal)" strokeWidth="2.8" strokeLinecap="round" transform="translate(5 0)">
        <path d="M49.875 27Q54.875 22 59.875 27" />
        <path d="M44.875 22Q54.875 12 64.875 22" />
        <path d="M39.875 17Q54.875 2 69.875 17" />
      </g>
    </svg>
  );
}
