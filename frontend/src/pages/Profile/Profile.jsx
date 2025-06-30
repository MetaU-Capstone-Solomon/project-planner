import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 