import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button/Button';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import { ROUTES } from '@/constants/routes';
import { getProject } from '@/services/projectService';
import { showErrorToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';

/**
 * ProjectDetailPage - Displays detailed information about a specific project
 * 
 * Features:
 * - Loads project data from database using projectId
 * - Displays project title, content, and creation date
 * - Shows loading states and error handling
 * - Navigation back to dashboard
 */
const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch project data when component mounts or projectId changes
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        const result = await getProject(projectId);
        if (result.success) {
          setProject(result.project);
        } else {
          showErrorToast(MESSAGES.PROJECT.LOAD_ERROR);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        showErrorToast(MESSAGES.PROJECT.LOAD_ERROR);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleBackToDashboard = () => {
    navigate(ROUTES.DASHBOARD);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="p-6">
          <header className="mb-8">
            <Button
              onClick={handleBackToDashboard}
              variant="secondary"
              aria-label="Navigate back to dashboard"
            >
              ← Dashboard
            </Button>
          </header>
          <main className="rounded-lg bg-white p-8 shadow-sm text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{MESSAGES.PROJECT.NOT_FOUND}</h2>
            <p className="text-gray-600">The requested project could not be found.</p>
          </main>
        </div>
      </div>
    );
  }

  // Format project creation date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <header className="mb-6">
          <Button
            onClick={handleBackToDashboard}
            variant="secondary"
            aria-label="Navigate back to dashboard"
          >
            ← Dashboard
          </Button>
        </header>

        <main className="rounded-lg bg-white p-8 shadow-sm">
          {/* Project header with title and creation date */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <div className="text-sm text-gray-500">
              Created: {formatDate(project.created_at)}
            </div>
          </div>

          {/* Separator line */}
          <div className="mb-6 h-px bg-gray-200"></div>

          {/* Project content */}
          <div className="prose prose-lg max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-900 bg-gray-50 p-6 rounded-lg border">
              {project.content}
            </pre>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
