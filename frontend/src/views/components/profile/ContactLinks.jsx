import React from 'react';
import { Github, Globe, Linkedin, Mail } from 'lucide-react';

function contactItems(contactLinks = {}) {
  return [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: contactLinks.linkedinUrl,
      icon: Linkedin,
    },
    {
      id: 'github',
      label: 'GitHub',
      href: contactLinks.githubUrl,
      icon: Github,
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
      href: contactLinks.websiteUrl,
      icon: Globe,
    },
  ].filter((item) => item.href);
}

export default function ContactLinks({ contactLinks, compact = false, className = '' }) {
  const items = contactItems(contactLinks);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`contact-link-icons ${compact ? 'compact' : ''} ${className}`.trim()} aria-label="Contact links">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <a key={item.id} href={item.href} target={item.id === 'email' ? undefined : '_blank'} rel={item.id === 'email' ? undefined : 'noreferrer'} aria-label={item.label} title={item.label}>
            <Icon size={compact ? 17 : 19} />
          </a>
        );
      })}
    </div>
  );
}
