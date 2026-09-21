import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/AuthContext.jsx';
import { ThemeProvider } from './state/ThemeContext.jsx';
import AppShell from './ui/AppShell.jsx';
import RouteScrollReset from './ui/RouteScrollReset.jsx';
import ScrollReveal from './ui/ScrollReveal.jsx';
const Home = lazy(() => import('./views/Home.jsx'));
const LegalPage = lazy(() => import('./views/LegalPage.jsx'));
const Login = lazy(() => import('./views/Login.jsx'));
const Match = lazy(() => import('./views/Match.jsx'));
const NotFound = lazy(() => import('./views/NotFound.jsx'));
const ProfileDetail = lazy(() => import('./views/ProfileDetail.jsx'));
const Profiles = lazy(() => import('./views/Profiles.jsx'));
const Register = lazy(() => import('./views/Register.jsx'));
const Settings = lazy(() => import('./views/Settings.jsx'));
const Dashboard = lazy(() => import('./views/Dashboard.jsx'));
import './styles/index.css';

function ProtectedRoute({ children }) {
  const { isAuthReady, user } = useAuth();
  const location = useLocation();
  if (!isAuthReady) return <RouteLoading />;
  return user ? children : <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search }} />;
}

function GuestRoute({ children }) {
  const { isAuthReady, user } = useAuth();
  const { state } = useLocation();
  if (!isAuthReady) return <RouteLoading />;
  const destination = typeof state?.returnTo === 'string' && state.returnTo.startsWith('/')
    ? state.returnTo
    : '/dashboard';
  return user ? <Navigate to={destination} replace /> : children;
}

function RouteLoading() {
  return (
    <main className="route-loading" aria-live="polite" aria-busy="true">
      <span className="route-loading-mark" aria-hidden="true">SS</span>
      <p>Restoring your workspace...</p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <RouteScrollReset />
          <Suspense fallback={<RouteLoading />}>
            <ScrollReveal />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/privacy" element={<LegalPage />} />
              <Route path="/terms" element={<LegalPage />} />
              <Route path="/match" element={<Match />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/profiles/:id" element={<ProfileDetail />} />
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <Register />
                  </GuestRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Dashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
