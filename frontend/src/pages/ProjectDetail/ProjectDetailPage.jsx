import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button/Button';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import PhaseCard from '@/components/Roadmap/PhaseCard';
import { ROUTES } from '@/constants/routes';
import { getProject } from '@/services/projectService';
import { showErrorToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';
import { formatDate } from '@/utils/dateUtils';

/**
 * ProjectDetailPage - Displays project details with phase-based roadmap visualization
 * 
 * Features:
 * - Always shows project header with title and creation date
 * - Parses JSON roadmap content with markdown code block support
 * - Displays structured phase cards with progress tracking
 * - Handles phase expansion/collapse functionality
 * - Shows friendly error messages for invalid roadmap data
 * - Clean minimal design when no roadmap data is available
 * - Provides navigation back to dashboard
 */
const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roadmapData, setRoadmapData] = useState(null);
  const [expandedPhases, setExpandedPhases] = useState(new Set());

  // Fetch project data when component mounts or projectId changes
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        const result = await getProject(projectId);
        if (result.success) {
          setProject(result.project);
          
          // Try to parse content as JSON roadmap
          try {
            // Remove markdown code block formatting if present
            let jsonContent = result.project.content.trim();
            if (jsonContent.startsWith('```json')) {
              jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }
            
            const parsedContent = JSON.parse(jsonContent);
            
            if (parsedContent.metadata && parsedContent.phases) {
              setRoadmapData(parsedContent);
              // Expand first phase by default
              setExpandedPhases(new Set([parsedContent.phases[0]?.id]));
            } else {
              setRoadmapData(null);
              showErrorToast(MESSAGES.VALIDATION.ROADMAP_INCOMPLETE);
            }
          } catch (e) {
            // Content is not valid JSON roadmap, show toast message
            setRoadmapData(null);
            showErrorToast(MESSAGES.VALIDATION.ROADMAP_PARSE_FAILED);
          }
        } else {
          showErrorToast(MESSAGES.ERROR.PROJECT_LOAD_FAILED);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
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

  const togglePhase = (phaseId) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
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
            <p className="text-gray-600">The project could not be found.</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <header className="mb-6 flex items-center justify-between">
          <Button
            onClick={handleBackToDashboard}
            variant="secondary"
            aria-label="Navigate back to dashboard"
          >
            ← Dashboard
          </Button>
        </header>

        <main>
          {/* Project header */}
          <div className="rounded-lg bg-white p-8 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <div className="text-sm text-gray-500">
                Created: {formatDate(project.created_at)}
              </div>
            </div>
          </div>

          {roadmapData && (
            <div className="space-y-4">
              {roadmapData.phases.map((phase) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  isExpanded={expandedPhases.has(phase.id)}
                  onToggle={() => togglePhase(phase.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
