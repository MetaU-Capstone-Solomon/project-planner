import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button/Button';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import PhaseCardNew from '@/components/Roadmap/PhaseCardNew';
import ProgressBar from '@/components/Roadmap/ProgressBar';
import Summary from '@/components/Roadmap/Summary';
import { ROUTES } from '@/constants/routes';
import { getProject, updateProject } from '@/services/projectService';
import { showErrorToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';
import { formatDate } from '@/utils/dateUtils';
import { MARKDOWN } from '@/constants/roadmap';
import useDebouncedCallback from '@/hooks/useDebouncedCallback';

/**
 * ProjectDetailPage - Card-based project details layout
 * 
 * Features:
 * - Card-based phase layout similar to dashboard
 * - Responsive grid layout for phase cards
 * - Clean, modern UI with consistent styling
 * - Maintains existing functionality for data display
 */
const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roadmapData, setRoadmapData] = useState(null);

  // Debounced persist function to minimize network overhead during rapid interactions
  const persistRoadmap = useDebouncedCallback(async (updatedRoadmap) => {
    if (!projectId) return;
    const payload = JSON.stringify(updatedRoadmap);
    const result = await updateProject(projectId, payload);
    if (!result.success) {
      console.error('Error saving roadmap:', result.error);
    }
  }, 800, [projectId]);

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
            if (jsonContent.startsWith(MARKDOWN.JSON_CODE_BLOCK)) {
              jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }
            
            const parsedContent = JSON.parse(jsonContent);
            
            if (parsedContent.metadata && parsedContent.phases) {
              setRoadmapData(parsedContent);
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
          {roadmapData ? (
            <>
              <div className="space-y-6">
                <ProgressBar phases={roadmapData.phases} />
                <Summary metadata={roadmapData.metadata} summary={roadmapData.summary} />
                
                {/* Phase Cards Grid */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Project Phases</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roadmapData.phases.map((phase) => (
                      <PhaseCardNew
                        key={phase.id}
                        phase={phase}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-white p-8 shadow-sm text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Roadmap Data</h2>
              <p className="text-gray-600">This project doesn't have any roadmap data available.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
