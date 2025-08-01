import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '@/components/Button/Button';
import confirmAction from '@/utils/confirmAction';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import PhaseCardNew from '@/components/Roadmap/PhaseCardNew';
import ProgressBar from '@/components/Roadmap/ProgressBar';
import Summary from '@/components/Roadmap/Summary';
import PhaseModal from '@/components/Roadmap/PhaseModal';
import EditPhaseModal from '@/components/Roadmap/EditPhaseModal';
import { getProject, updateProject } from '@/services/projectService';
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';
import { MARKDOWN } from '@/constants/roadmap';
import useDebouncedCallback from '@/hooks/useDebouncedCallback';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cache';

/**
 * ProjectDetailPage - Card-based project details layout with modal task editing
 *
 * HOW IT WORKS:
 * - Loads and displays a single project's details.
 * - Uses React Query to cache project data for fast loading.
 * - After any edit (reorder, add, delete), invalidates the cache.
 * - On refresh or revisit, always shows the latest data after edits.
 * - Cache timing and keys are managed in the config file.
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
  const [isEditPhaseModalOpen, setIsEditPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [isCreatePhaseModalOpen, setIsCreatePhaseModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Debounced persist function to minimize network overhead during rapid interactions
  const persistRoadmap = useDebouncedCallback(
    async (updatedRoadmap) => {
      if (!projectId) return;
      const payload = JSON.stringify(updatedRoadmap);
      const result = await updateProject(projectId, payload);
      if (!result.success) {
        console.error('Error saving roadmap:', result.error);
        showErrorToast(MESSAGES.ERROR.PROJECT_SAVE_FAILED);
      } else {
        // Invalidate project detail and user projects caches
        queryClient.invalidateQueries([QUERY_KEYS.PROJECT_DETAILS, projectId]);
        queryClient.invalidateQueries([QUERY_KEYS.USER_PROJECTS]);
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
    localStorage.setItem(
      'modalState',
      JSON.stringify({
        modal: 'phase',
        phaseId: phase.id,
      })
    );
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
          const phase = roadmapData.phases.find((p) => p.id === state.phaseId);
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
   * Opens phase edit modal
   * @param {Object} phase - Phase data to edit
   */
  const handlePhaseEdit = (phase) => {
    setEditingPhase(phase);
    setIsEditPhaseModalOpen(true);
  };

  /**
   * Closes phase edit modal
   */
  const handleCloseEditPhaseModal = () => {
    setIsEditPhaseModalOpen(false);
    setEditingPhase(null);
  };

  /**
   * Opens phase create modal
   */
  const handleCreatePhase = () => {
    setIsCreatePhaseModalOpen(true);
  };

  /**
   * Closes phase create modal
   */
  const handleCloseCreatePhaseModal = () => {
    setIsCreatePhaseModalOpen(false);
  };

  /**
   * Saves phase edits and updates roadmap data
   * @param {Object} updatedPhase - Updated phase data
   */
  const handleSavePhaseEdit = (updatedPhase) => {
    setRoadmapData((prevRoadmap) => {
      const newPhases = prevRoadmap.phases.map((phase) => {
        if (phase.id === editingPhase.id) {
          return { ...phase, ...updatedPhase };
        }
        return phase;
      });

      const updatedRoadmap = { ...prevRoadmap, phases: newPhases };

      // Save to backend
      persistRoadmap(updatedRoadmap);

      return updatedRoadmap;
    });

    // Show immediate success feedback
    showSuccessToast(MESSAGES.SUCCESS.PHASE_UPDATED);
  };

  /**
   * Saves new phase and adds it to roadmap data
   * @param {Object} newPhase - New phase data
   */
  const handleSaveNewPhase = (newPhase) => {
    setRoadmapData((prevRoadmap) => {
      const updatedRoadmap = { ...prevRoadmap, phases: [...prevRoadmap.phases, newPhase] };

      // Save to backend
      persistRoadmap(updatedRoadmap);

      return updatedRoadmap;
    });

    // Show immediate success feedback
    showSuccessToast(MESSAGES.SUCCESS.PHASE_CREATED);
  };

  /**
   * Handles phase deletion with confirmation
   * @param {Object} phase - Phase to delete
   */
  const handlePhaseDelete = (phase) => {
    if (confirmAction('Are you sure you want to delete this phase?')) {
      setRoadmapData((prevRoadmap) => {
        const updatedRoadmap = {
          ...prevRoadmap,
          phases: prevRoadmap.phases.filter((p) => p.id !== phase.id),
        };

        // Save to backend
        persistRoadmap(updatedRoadmap);

        return updatedRoadmap;
      });

      // Show immediate success feedback
      showSuccessToast(MESSAGES.SUCCESS.PHASE_DELETED);
    }
  };

  /**
   * Handles phase reordering - move phase to previous or next position
   * @param {string} phaseId - ID of the phase to reorder
   * @param {string} direction - 'previous' or 'next'
   */
  const handlePhaseReorder = (phaseId, direction) => {
    setRoadmapData((prevRoadmap) => {
      const phases = [...prevRoadmap.phases];
      const currentIndex = phases.findIndex((phase) => phase.id === phaseId);

      if (currentIndex === -1) return prevRoadmap; // Phase not found

      let newIndex;
      if (direction === 'previous' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (direction === 'next' && currentIndex < phases.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        return prevRoadmap; // Can't move further
      }

      // Swap phases
      [phases[currentIndex], phases[newIndex]] = [phases[newIndex], phases[currentIndex]];

      // Update order numbers
      const reorderedPhases = phases.map((phase, index) => ({
        ...phase,
        order: index + 1,
      }));

      const updatedRoadmap = { ...prevRoadmap, phases: reorderedPhases };

      // Save to backend
      persistRoadmap(updatedRoadmap);

      return updatedRoadmap;
    });

    // Show immediate success feedback
    showSuccessToast(MESSAGES.SUCCESS.PHASE_REORDERED);
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
  /**
   * Handle milestone reordering - move milestone up or down in the list
   * @param {string} phaseId - ID of the phase containing the milestone
   * @param {string} milestoneId - ID of the milestone to reorder
   * @param {string} direction - 'up' or 'down'
   */
  const handleMilestoneReorder = (phaseId, milestoneId, direction) => {
    setRoadmapData((prevRoadmap) => {
      const newPhases = prevRoadmap.phases.map((phase) => {
        if (phase.id === phaseId) {
          const milestones = [...phase.milestones];
          const currentIndex = milestones.findIndex((m) => m.id === milestoneId);

          if (currentIndex === -1) return phase; // Milestone not found

          let newIndex;
          if (direction === 'up' && currentIndex > 0) {
            newIndex = currentIndex - 1;
          } else if (direction === 'down' && currentIndex < milestones.length - 1) {
            newIndex = currentIndex + 1;
          } else {
            return phase; // Can't move further
          }

          // Swap milestones
          [milestones[currentIndex], milestones[newIndex]] = [
            milestones[newIndex],
            milestones[currentIndex],
          ];

          // Update order numbers
          const reorderedMilestones = milestones.map((milestone, index) => ({
            ...milestone,
            order: index + 1,
          }));

          return { ...phase, milestones: reorderedMilestones };
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

      // Save to backend
      persistRoadmap(updatedRoadmap);

      return updatedRoadmap;
    });
  };

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
                      // Update task with new format: object with title, description, status, and resources
                      return {
                        ...task,
                        title: updates.title || task.title,
                        description: updates.description || task.description,
                        status: updates.status || task.status,
                        resources: updates.resources || task.resources || [],
                      };
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

      // Save to backend
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
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Project Phases
                    </h2>
                    <button
                      onClick={handleCreatePhase}
                      className="flex items-center space-x-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:border-green-600 hover:bg-green-600 hover:shadow-md"
                      aria-label="Add new phase"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Phase</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {roadmapData.phases.map((phase, index) => (
                      <PhaseCardNew
                        key={phase.id}
                        phase={phase}
                        onClick={() => handlePhaseClick(phase)}
                        onEdit={handlePhaseEdit}
                        onDelete={handlePhaseDelete}
                        onReorder={handlePhaseReorder}
                        isFirst={index === 0}
                        isLast={index === roadmapData.phases.length - 1}
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
                onMilestoneReorder={handleMilestoneReorder}
              />

              {/* Edit Phase Modal */}
              <EditPhaseModal
                isOpen={isEditPhaseModalOpen}
                onClose={handleCloseEditPhaseModal}
                phase={editingPhase}
                onSave={handleSavePhaseEdit}
              />

              {/* Create Phase Modal */}
              <EditPhaseModal
                isOpen={isCreatePhaseModalOpen}
                onClose={handleCloseCreatePhaseModal}
                phase={null}
                onSave={handleSaveNewPhase}
                nextOrder={roadmapData.phases.length + 1}
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
