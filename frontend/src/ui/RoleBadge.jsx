import React from 'react';
import { Code2, BriefcaseBusiness } from 'lucide-react';

export default function RoleBadge({ role, context, className = '' }) {
  const employer = String(role).toLowerCase() === 'employer';
  const Icon = employer ? BriefcaseBusiness : Code2;
  return (
    <span className={`role-badge role-badge--${employer ? 'employer' : 'developer'} ${className}`.trim()}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      {employer ? 'Employer' : 'Developer'}{context ? ` ${context}` : ''}
    </span>
  );
}
