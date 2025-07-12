import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import RootLayout from '@/layouts/RootLayout';
import Home from '@/pages/Home/Home';
import Auth from '@/pages/Auth/Auth';
import Callback from '@/pages/Auth/Callback';
import Dashboard from '@/pages/Dashboard/Dashboard';
import NewProjectChatPage from '@/pages/NewProjectChat/NewProjectChatPage';
import Profile from '@/pages/Profile/Profile';
import ProjectDetailPage from '@/pages/ProjectDetail/ProjectDetailPage';

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication. Redirects unauthenticated users
 * to the landing page instead of auth page for better UX after sign out.
 * 
 * @param {React.ReactNode} children - Child components to render if authenticated
 * @returns {React.ReactNode} Protected content or redirect
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication status
  if (loading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Redirect to landing page if not authenticated
  if (!user) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
};

/**
 * AppRoutes Component
 * 
 * Defines the application routing structure with public and protected routes.
 * Public routes (landing, auth) don't have navbar/footer, while protected
 * routes are wrapped with authentication check and layout components.
 * 
 * @returns {React.ReactNode} Application routes
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - accessible to all users */}
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.AUTH} element={<Auth />} />
      <Route path={ROUTES.AUTH_CALLBACK} element={<Callback />} />
      
      {/* Protected routes - require authentication */}
      <Route
        element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.NEW_PROJECT_CHAT} element={<NewProjectChatPage />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
        <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster />
    </AuthProvider>
  );
}
