import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Welcome to your dashboard</h1>
        <p className="mb-6 text-gray-600">You have successfully logged in with Google OAuth!</p>
        <button
          onClick={signOut}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
