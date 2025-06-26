import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import RootLayout from '@/layouts/RootLayout';
import Home from '@/pages/Home/Home';
import Auth from '@/pages/Auth/Auth';
import Callback from '@/pages/Auth/Callback';
import Dashboard from '@/pages/Dashboard/Dashboard';
import NewProjectChatPage from '@/pages/NewProjectChat/NewProjectChatPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<Callback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-project-chat"
        element={
          <ProtectedRoute>
            <NewProjectChatPage />
          </ProtectedRoute>
        }
      />
      <Route element={<RootLayout />}>
        <Route path="/app" element={<div>App</div>} />
        <Route path="/app/new-project" element={<div>New Project</div>} />
        <Route path="/app/calendar" element={<div>Calendar</div>} />
        <Route path="/app/profile" element={<div>Profile</div>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
