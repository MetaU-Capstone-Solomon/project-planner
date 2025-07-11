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

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  if (!user) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes (no navbar/footer) */}
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.AUTH} element={<Auth />} />
      <Route path={ROUTES.AUTH_CALLBACK} element={<Callback />} />
      
      {/* Protected routes with navbar/footer */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path={ROUTES.DASHBOARD}
          element={<Dashboard />}
        />
        <Route
          path={ROUTES.NEW_PROJECT_CHAT}
          element={<NewProjectChatPage />}
        />
        <Route
          path={ROUTES.PROFILE}
          element={<Profile />}
        />
        <Route
          path={ROUTES.PROJECT_DETAIL}
          element={<ProjectDetailPage />}
        />
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
