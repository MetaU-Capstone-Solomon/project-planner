import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Displays detailed information about a specific project

// TODO: Add timeline bar, progress calculation, markdown rendering, and real project data
const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Navigate back to dashboard"
            >
              ← Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Project Details</h1>
          </div>
        </header>

        <main className="rounded-lg bg-white p-8 shadow-sm">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">Project ID: {projectId}</h2>
            <p className="text-gray-600">
              Project content will be displayed here in future iterations
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
