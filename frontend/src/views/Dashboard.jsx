import React from 'react';
import DeveloperDashboard from './components/dashboard/DeveloperDashboard.jsx';
import EmployerDashboard from './components/dashboard/EmployerDashboard.jsx';
import RoleDashboard from './components/dashboard/RoleDashboard.jsx';
import { useAuth } from '../state/AuthContext.jsx';

export default function Dashboard() {
  const { user, token } = useAuth();

  if (user.role === 'DEVELOPER') {
    return <DeveloperDashboard user={user} token={token} />;
  }

  if (user.role === 'EMPLOYER') {
    return <EmployerDashboard user={user} token={token} />;
  }

  return <RoleDashboard user={user} token={token} />;
}
