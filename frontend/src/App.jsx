import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ROUTES } from '@/constants/routes';
import Spinner from '@/components/ui/Spinner';
import RootLayout from '@/layouts/RootLayout';
import Home from '@/pages/Home/Home';
import Auth from '@/pages/Auth/Auth';
import Callback from '@/pages/Auth/Callback';
import Dashboard from '@/pages/Dashboard/Dashboard';
import NewProjectChatPage from '@/pages/NewProjectChat/NewProjectChatPage';
import ProjectDetailPage from '@/pages/ProjectDetail/ProjectDetailPage';
import AcceptInvitationPage from '@/pages/AcceptInvitation/AcceptInvitationPage';
import SettingsPage from '@/pages/Settings/SettingsPage';
import Profile from '@/pages/Profile/Profile';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
      <Spinner size="lg" className="text-[var(--accent)]" />
    </div>
  );
  if (!user) return <Navigate to={ROUTES.HOME} replace />;
  return children;
};

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.AUTH} element={<Auth />} />
        <Route path={ROUTES.AUTH_CALLBACK} element={<Callback />} />
        <Route path={ROUTES.ACCEPT_INVITATION} element={<AcceptInvitationPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.NEW_PROJECT_CHAT} element={<NewProjectChatPage />} />
          <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
