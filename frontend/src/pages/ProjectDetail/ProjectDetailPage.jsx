import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button/Button';
import { ROUTES } from '@/constants/routes';

// Displays detailed information about a specific project
// TODO: Add timeline bar, progress calculation, markdown rendering, and real project data
const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const handleBackToDashboard = () => {
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBackToDashboard}
              variant="secondary"
              aria-label="Navigate back to dashboard"
            >
              ← Dashboard
            </Button>
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
