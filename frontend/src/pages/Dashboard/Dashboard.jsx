import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button/Button';
import { ROUTES } from '@/constants/routes';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate(ROUTES.NEW_PROJECT_CHAT);
  };

  const handleProfile = () => {
    navigate(ROUTES.PROFILE);
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-3">
            <Button onClick={handleNewProject} variant="primary" aria-label="Create new project">
              New Project
            </Button>
            <Button onClick={handleProfile} variant="secondary" aria-label="View profile">
              Profile
            </Button>
          </div>
        </header>

        {/* TODO: Add project cards with "View Details" button*/}

        <main className="flex items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Welcome to your dashboard</h2>
            <p className="mb-6 text-gray-600">You have successfully logged in with Google OAuth!</p>
            <Button onClick={handleSignOut} variant="danger" aria-label="Sign out of application">
              Sign Out
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
