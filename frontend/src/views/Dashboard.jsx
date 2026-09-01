import React from 'react';
import { useSearchParams } from 'react-router-dom';
import DeveloperDashboard from './components/dashboard/DeveloperDashboard.jsx';
import EmployerDashboard from './components/dashboard/EmployerDashboard.jsx';
import RoleDashboard from './components/dashboard/RoleDashboard.jsx';
import { useAuth } from '../state/AuthContext.jsx';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedSection = searchParams.get('section');

  if (user.role === 'DEVELOPER') {
    return <DeveloperDashboard user={user} token={token} selectedSection={selectedSection} />;
  }

  if (user.role === 'EMPLOYER') {
    return <EmployerDashboard user={user} token={token} selectedSection={selectedSection} />;
  }

  return <RoleDashboard user={user} token={token} />;
}
