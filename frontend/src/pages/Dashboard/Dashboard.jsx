import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate('/new-project-chat');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-3">
            <button
              onClick={handleNewProject}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              New Project
            </button>
            <button
              onClick={handleProfile}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Profile
            </button>
          </div>
        </div>

        {/* TODO: Add project cards with "View Details" button*/}

        <div className="flex items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Welcome to your dashboard</h2>
            <p className="mb-6 text-gray-600">You have successfully logged in with Google OAuth!</p>
            <button
              onClick={signOut}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
