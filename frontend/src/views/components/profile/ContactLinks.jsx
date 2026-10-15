import React from 'react';
import { Globe, Mail } from 'lucide-react';
import SocialBrandIcon from '../../../ui/SocialBrandIcon.jsx';

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function contactItems(contactLinks = {}) {
  return [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: safeWebUrl(contactLinks.linkedinUrl),
      brand: 'linkedin',
    },
    {
      id: 'github',
      label: 'GitHub',
      href: safeWebUrl(contactLinks.githubUrl),
      brand: 'github',
    },
    {
      id: 'email',
      label: 'Email',
      href: contactLinks.email ? `mailto:${contactLinks.email}` : '',
      icon: Mail,
    },
    {
      id: 'website',
      label: 'Website',
      href: safeWebUrl(contactLinks.websiteUrl),
      icon: Globe,
    },
  ].filter((item) => item.href);
}

export default function ContactLinks({ contactLinks, compact = false, showLabels = false, className = '' }) {
  const items = contactItems(contactLinks);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`contact-link-icons ${compact ? 'compact' : ''} ${className}`.trim()} aria-label="Contact links">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <a className={`contact-link-icon--${item.id}`} key={item.id} href={item.href} target={item.id === 'email' ? undefined : '_blank'} rel={item.id === 'email' ? undefined : 'noreferrer'} aria-label={item.label}>
            {item.brand ? <SocialBrandIcon brand={item.brand} size={compact ? 17 : 19} /> : <Icon size={compact ? 17 : 19} />}
            {showLabels && <span>{item.label}</span>}
          </a>
        );
      })}
    </div>
  );
}
