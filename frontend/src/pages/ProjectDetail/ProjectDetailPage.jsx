import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/Button/Button';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import PhaseCardNew from '@/components/Roadmap/PhaseCardNew';
import ProgressBar from '@/components/Roadmap/ProgressBar';
import Summary from '@/components/Roadmap/Summary';
import PhaseModal from '@/components/Roadmap/PhaseModal';
import { getProject, updateProject } from '@/services/projectService';
import { showErrorToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';
import { MARKDOWN } from '@/constants/roadmap';
import useDebouncedCallback from '@/hooks/useDebouncedCallback';

/**
 * ProjectDetailPage - Card-based project details layout with modal task editing
 *
 * Features:
 * - Card-based phase layout similar to dashboard
 * - Responsive grid layout for phase cards
 * - Clean, modern UI with consistent styling
 * - Maintains existing functionality for data display
 * - Modal task editing: Edit task titles and descriptions in a dedicated edit modal
 *
 * MODAL TASK EDITING WORKFLOW:
 * 1. User clicks edit icon next to task status dropdown in PhaseModal
 * 2. Edit modal opens with form fields for title and description
 * 3. User modifies title and/or description
 * 4. User clicks "Save" button
 * 5. User clicks "Cancel" button
 * 6. Changes are validated (empty titles prevented) and persisted to database
 *
 */
const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roadmapData, setRoadmapData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);

  // Debounced persist function to minimize network overhead during rapid interactions
  const persistRoadmap = useDebouncedCallback(
    async (updatedRoadmap) => {
      if (!projectId) return;
      const payload = JSON.stringify(updatedRoadmap);
      const result = await updateProject(projectId, payload);
      if (!result.success) {
        console.error('Error saving roadmap:', result.error);
      }
    },
    800,
    [projectId]
  );

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

  // Save modal state to localStorage
  const saveModalState = (phase) => {
    localStorage.setItem('modalState', JSON.stringify({
      modal: 'phase',
      phaseId: phase.id
    }));
  };

  // Restore modal state from localStorage
  const restoreModalState = () => {
    const saved = localStorage.getItem('modalState');
    if (saved) {
      const state = JSON.parse(saved);
      if (state.modal === 'phase' && state.phaseId) {
        setModalOpen(true);
        // selectedPhase will be set when data loads
      }
    }
  };

  // Restore modal state immediately 
  useEffect(() => {
    restoreModalState();
  }, []); // Run immediately on component mount

  // Set selectedPhase when data loads (if modal is open)
  useEffect(() => {
    if (modalOpen && roadmapData) {
      const saved = localStorage.getItem('modalState');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.modal === 'phase' && state.phaseId) {
          const phase = roadmapData.phases.find(p => p.id === state.phaseId);
          if (phase) {
            setSelectedPhase(phase);
          }
        }
      }
    }
  }, [modalOpen, roadmapData]);

  // Handler to open modal with selected phase
  const handlePhaseClick = (phase) => {
    setSelectedPhase(phase);
    setModalOpen(true);
    saveModalState(phase);
  };

  // Handler to close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPhase(null);
    localStorage.removeItem('modalState');
  };

  /**
   * Handler to update task status and content from modal
   * Supports both legacy format (status string) and new format (object with title, description, status)
   * Also supports adding new tasks when action is 'add', new milestones when action is 'addMilestone',
   * deleting milestones when action is 'deleteMilestone', and deleting tasks when action is 'deleteTask'
   * @param {string} phaseId - The phase ID containing the task
   * @param {string} milestoneId - The milestone ID containing the task (or to delete)
   * @param {string} taskId - The task ID to update (null for new tasks)
   * @param {string|Object} updates - Either status string (legacy) or object with title, description, status, or new task/milestone object
   * @param {string} action - 'update' (default), 'add' for new tasks, 'addMilestone' for new milestones, 'deleteMilestone' for deleting milestones, or 'deleteTask' for deleting tasks
   */
  const handleTaskUpdate = (phaseId, milestoneId, taskId, updates, action = 'update') => {
    setRoadmapData((prevRoadmap) => {
      const newPhases = prevRoadmap.phases.map((phase) => {
        if (phase.id === phaseId) {
          if (action === 'addMilestone') {
            // Add new milestone to the phase
            const newMilestone = updates; // updates is the complete new milestone object
            const newMilestones = [...phase.milestones, newMilestone];
            return { ...phase, milestones: newMilestones };
          } else if (action === 'deleteMilestone') {
            // Delete milestone from the phase
            const newMilestones = phase.milestones
              .filter((milestone) => milestone.id !== milestoneId)
              .map((milestone, index) => ({ ...milestone, order: index + 1 })); // Reorder remaining milestones
            return { ...phase, milestones: newMilestones };
          } else {
            const newMilestones = phase.milestones.map((milestone) => {
              if (milestone.id === milestoneId) {
                if (action === 'add') {
                  // Add new task to the milestone
                  const newTask = updates; // updates is the complete new task object
                  const newTasks = [...milestone.tasks, newTask];
                  return { ...milestone, tasks: newTasks };
                } else if (action === 'deleteTask') {
                  // Delete task from the milestone
                  const newTasks = milestone.tasks.filter((task) => task.id !== taskId);
                  return { ...milestone, tasks: newTasks };
                } else {
                  // Update existing task
                  const newTasks = milestone.tasks.map((task) => {
                    if (task.id === taskId) {
                      // Handle both our init and new format (object)
                      if (typeof updates === 'string') {
                        // Legacy format: just status
                        return { ...task, status: updates };
                      } else {
                        // New format: object with title, description, status, and resources
                        return {
                          ...task,
                          title: updates.title || task.title,
                          description: updates.description || task.description,
                          status: updates.status || task.status,
                          resources: updates.resources || task.resources || [],
                        };
                      }
                    }
                    return task;
                  });
                  return { ...milestone, tasks: newTasks };
                }
              }
              return milestone;
            });
            return { ...phase, milestones: newMilestones };
          }
        }
        return phase;
      });

      const updatedRoadmap = { ...prevRoadmap, phases: newPhases };

      // Update selectedPhase with the updated phase data
      if (selectedPhase && selectedPhase.id === phaseId) {
        const updatedPhase = newPhases.find((phase) => phase.id === phaseId);
        if (updatedPhase) {
          setSelectedPhase(updatedPhase);
        }
      }

      // Persist changes to backend
      persistRoadmap(updatedRoadmap);

      return updatedRoadmap;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-800">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800">
        <div className="p-6">
          <main className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              {MESSAGES.ERROR.PROJECT_NOT_FOUND}
            </h2>
            <p className="text-gray-600 dark:text-gray-100">The project could not be found.</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800">
      <div className="p-6">
        <main>
          {roadmapData ? (
            <>
              <div className="space-y-6">
                <ProgressBar phases={roadmapData.phases} />
                <Summary metadata={roadmapData.metadata} summary={roadmapData.summary} />

                {/* Phase Cards Grid */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Project Phases
                  </h2>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {roadmapData.phases.map((phase) => (
                      <PhaseCardNew
                        key={phase.id}
                        phase={phase}
                        onClick={() => handlePhaseClick(phase)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* Phase Modal */}
              <PhaseModal
                open={modalOpen}
                onClose={handleCloseModal}
                phase={selectedPhase}
                onTaskUpdate={handleTaskUpdate}
              />
            </>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                No Roadmap Data
              </h2>
              <p className="text-gray-600 dark:text-gray-100">
                This project doesn't have any roadmap data available.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
