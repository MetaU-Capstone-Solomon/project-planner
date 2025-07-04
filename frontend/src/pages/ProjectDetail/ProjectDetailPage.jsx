import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button/Button';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ROUTES } from '@/constants/routes';
import { getProject } from '@/services/projectService';
import { showErrorToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';

/**
 * ProjectDetailPage - Displays detailed information about a specific project
 * 
 * Features:
 * - Loads project data from database using projectId
 * - Displays project title, content, and creation date with markdown rendering
 * - Shows loading states and error handling
 * - Navigation back to dashboard
 * - Renders AI-generated roadmap content with proper formatting
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
          showErrorToast(MESSAGES.ERROR.PROJECT_LOAD_FAILED);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        showErrorToast(MESSAGES.ERROR.PROJECT_LOAD_FAILED);
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
          <header className="mb-6">
            <Button
              onClick={handleBackToDashboard}
              variant="secondary"
              aria-label="Navigate back to dashboard"
            >
              ← Dashboard
            </Button>
          </header>
          <main className="rounded-lg bg-white p-8 shadow-sm text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{MESSAGES.ERROR.PROJECT_NOT_FOUND}</h2>
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

          {/* Project content with reusable markdown renderer */}
          <MarkdownRenderer content={project.content} />
        </main>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
