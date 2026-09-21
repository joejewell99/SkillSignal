import React from 'react';

export default function BrandLogo() {
  return (
    <svg className="brand-mark" viewBox="0 0 180 64" preserveAspectRatio="xMinYMid meet" width="144" height="48" role="img" aria-label="SkillSignal">
      <g fill="none" stroke="var(--ink)" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 28H10Q4 28 4 34T10 40H16Q22 40 22 46T16 52H4" />
        <path d="M30 28V52M43 35L30 44H36L44 52" />
        <path d="M51 37V52M59 28V48Q59 52 63 52M69 28V48Q69 52 73 52" />
        <path d="M98 28H87Q81 28 81 34T87 40H93Q99 40 99 46T93 52H81" />
        <path d="M107 37V52" />
        <path d="M129 35H121Q115 35 115 41V45Q115 51 121 51H129M129 35V54Q129 60 123 60H117" />
        <path d="M137 52V35H145Q151 35 151 41V52" />
        <path d="M169 35H163Q158 35 158 41V46Q158 52 163 52H169V35M177 28V52" />
      </g>
      <g fill="var(--signal)">
        <rect x="48.8" y="28" width="4.4" height="4.4" rx="1.2" />
        <rect x="104.8" y="28" width="4.4" height="4.4" rx="1.2" />
      </g>
      <g fill="none" stroke="var(--signal)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M45 23Q51 17 57 23" />
        <path d="M40 18Q51 7 62 18" />
        <path d="M35 13Q51 -3 67 13" />
      </g>
    </svg>
  );
}
