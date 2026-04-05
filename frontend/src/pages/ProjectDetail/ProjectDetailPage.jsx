import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, UserPlus, Users, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ProgressRing from '@/components/ui/ProgressRing';
import confirmAction from '@/utils/confirmAction';
import PhaseModal from '@/components/Roadmap/PhaseModal';
import EditPhaseModal from '@/components/Roadmap/EditPhaseModal';
import InviteCollaboratorsModal from '@/components/Collaboration/InviteCollaboratorsModal';
import TeamPanel from '@/components/Collaboration/TeamPanel';
import McpStatusBadge from '@/components/McpStatusBadge/McpStatusBadge';
import TaskExplainer from '@/components/TaskExplainer/TaskExplainer';
import { useRoleConfig } from '@/hooks/useRoleConfig';
import { getProject, updateProject, checkUserPermission } from '@/services/projectService';
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';
import { MARKDOWN } from '@/constants/roadmap';
import { ROUTES } from '@/constants/routes';
import { pageTransition } from '@/constants/motion';
import useDebouncedCallback from '@/hooks/useDebouncedCallback';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cache';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';

/**
 * ProjectDetailPage - 3-panel layout with sidebar nav, main content, and fixed bottom bar
 *
 * HOW IT WORKS:
 * - Loads and displays a single project's details.
 * - Uses React Query to cache project data for fast loading.
 * - After any edit (reorder, add, delete), invalidates the cache.
 * - On refresh or revisit, always shows the latest data after edits.
 * - Cache timing and keys are managed in the config file.
 *
 * Features:
 * - Left sidebar with phase navigation and overall progress ring
 * - Expandable PhaseSection cards with inline task checkboxes
 * - Fixed bottom bar showing global progress
 * - Sticky top header with breadcrumb, role badge, and action buttons
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

// ---------------------------------------------------------------------------
// PhaseSection — inline expandable phase card with task checkboxes
// ---------------------------------------------------------------------------
function PhaseSection({ phase, userRole, config, onTaskUpdate, onEditPhase, onDeletePhase, onViewMilestone }) {
  const [expanded, setExpanded] = useState(true);
  const tasks = phase.milestones?.flatMap(m => m.tasks || []) || [];
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div id={`phase-${phase.id}`} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center justify-between p-5 text-left hover:bg-[var(--bg-elevated)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-[var(--text-primary)]">{phase.title}</span>
          <span className="text-sm text-[var(--text-muted)]">{completed}/{tasks.length} tasks</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-[var(--text-muted)]">{pct}%</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] p-5 space-y-4">
          {phase.milestones?.map(milestone => (
            <div key={milestone.id || milestone.title}>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium text-[var(--text-secondary)]">{milestone.title}</h4>
                <button onClick={() => onViewMilestone(phase)} className="text-xs text-[var(--accent)] hover:underline">
                  View details
                </button>
              </div>
              <div className="space-y-2">
                {milestone.tasks?.map(task => (
                  <div key={task.id || task.title} className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() =>
                          onTaskUpdate(
                            phase.id,
                            milestone.id,
                            task.id,
                            { status: task.status === 'completed' ? 'pending' : 'completed' }
                          )
                        }
                        disabled={userRole === 'viewer'}
                        className="h-4 w-4 flex-shrink-0 rounded accent-[var(--accent)]"
                      />
                      <div className="min-w-0 flex-1">
                        <span className={`text-sm ${task.status === 'completed' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                          {task.title}
                        </span>
                        {/* Developer: estimated hours */}
                        {config?.showEstimatedHours && task.estimatedHours && (
                          <span className="ml-2 text-xs text-[var(--text-muted)]">~{task.estimatedHours}h</span>
                        )}
                      </div>
                      {/* Developer: resource badges */}
                      {config?.showResourceBadges && task.resources?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.resources.slice(0, 2).map((r, i) => (
                            <a
                              key={i}
                              href={r.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-0.5 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--accent)] hover:underline"
                            >
                              {r.title || 'Resource'} <ExternalLink size={9} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Student: explain this / break it down */}
                    {(config?.showExplainThis || config?.showBreakdown) && (
                      <TaskExplainer task={task} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {userRole === 'admin' && (
            <div className="flex gap-2 pt-2">
              <button onClick={onEditPhase} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Edit phase</button>
              <button onClick={onDeletePhase} className="text-xs text-[var(--destructive)] hover:opacity-80 transition-opacity">Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProjectDetailPage
// ---------------------------------------------------------------------------
const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roadmapData, setRoadmapData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isEditPhaseModalOpen, setIsEditPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [isCreatePhaseModalOpen, setIsCreatePhaseModalOpen] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState(null);
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { config } = useRoleConfig();

  // Debounced persist function to minimize network overhead during rapid interactions
  const persistRoadmap = useDebouncedCallback(
    async (updatedRoadmap) => {
      if (!projectId) {
        return;
      }
      const payload = JSON.stringify(updatedRoadmap);
      const result = await updateProject(projectId, payload);
      if (!result.success) {
        console.error('Error saving roadmap:', result.error);
        showErrorToast(MESSAGES.ERROR.PROJECT_SAVE_FAILED);
      } else {
        // Invalidate project detail and user projects caches
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECT_DETAILS, projectId] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROJECTS] });
      }
    },
    800,
    [projectId]
  );

  // Fetch project data when component mounts or projectId changes
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        return;
      }

      setLoading(true);
      try {
        const result = await getProject(projectId);
        if (result.success) {
          setProject(result.project);

          // Check user permissions for collaboration features
          const permissionResult = await checkUserPermission(projectId, MESSAGES.COLLABORATION.PERMISSIONS.INVITE);
          if (permissionResult.success) {
            setUserRole(permissionResult.role);
          }

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

  // Realtime: invalidate project cache when MCP server writes to the roadmap table
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`roadmap-mcp-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'roadmap',
          filter: `id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECT_DETAILS, projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

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

          if (currentIndex === -1) {
            return phase; // Milestone not found
          }

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

  /**
   * Handler to update task status and content from modal or inline checkboxes
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

  // Handle invite collaborators
  const handleInviteCollaborators = async (inviteData) => {
    try {
      const response = await fetch(API_ENDPOINTS.INVITE_COLLABORATOR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteData.email,
          role: inviteData.role,
          projectId: project.id,
          projectName: project.title,
          inviterName: user?.user_metadata?.full_name || user?.email || 'Project Admin',
          inviterId: user?.id,
          message: inviteData.message || null
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showSuccessToast(MESSAGES.SUCCESS.INVITATION_SENT);
      } else {
        showErrorToast(result.error || MESSAGES.ERROR.INVITATION_FAILED);
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      showErrorToast(MESSAGES.ERROR.INVITATION_FAILED);
    }
  };

  // ---------------------------------------------------------------------------
  // Early returns
  // ---------------------------------------------------------------------------
  if (loading) return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
      <Spinner size="lg" className="text-[var(--accent)]" />
    </div>
  );

  if (!project) return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-4">
      <p className="text-[var(--text-secondary)]">Project not found.</p>
      <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>Back to dashboard</Button>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const phases = roadmapData?.phases || [];
  const totalTasks = phases.flatMap(p => p.milestones?.flatMap(m => m.tasks || []) || []);
  const completedTasks = totalTasks.filter(t => t.status === 'completed');
  const overallProgress = totalTasks.length
    ? Math.round((completedTasks.length / totalTasks.length) * 100)
    : 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <motion.div {...pageTransition} className="flex min-h-[calc(100vh-56px)] flex-col bg-[var(--bg-base)]">
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <aside className="hidden w-56 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] lg:flex lg:flex-col">
          <div className="flex flex-col items-center gap-3 border-b border-[var(--border)] p-5">
            <ProgressRing progress={overallProgress} size={72} strokeWidth={6} />
            <p className="max-w-full truncate text-center text-sm font-semibold text-[var(--text-primary)]">{project.title}</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">
            {phases.map((phase, i) => {
              const phaseTasks = phase.milestones?.flatMap(m => m.tasks || []) || [];
              const phaseComplete = phaseTasks.length
                ? Math.round((phaseTasks.filter(t => t.status === 'completed').length / phaseTasks.length) * 100)
                : 0;
              const isActive = activePhaseId === phase.id;
              return (
                <button
                  key={phase.id}
                  onClick={() => {
                    setActivePhaseId(phase.id);
                    document.getElementById(`phase-${phase.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`relative flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="phase-indicator"
                      className="absolute inset-y-0 left-0 w-0.5 rounded-r bg-[var(--accent)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-xs font-medium">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{phase.title}</span>
                  <span className="text-xs text-[var(--text-muted)]">{phaseComplete}%</span>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-[var(--border)] p-4">
            <McpStatusBadge />
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto pb-16">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-md">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="truncate text-lg font-semibold text-[var(--text-primary)]">{project.title}</h1>
                {userRole && (
                  <Badge variant={userRole === 'admin' ? 'admin' : userRole === 'editor' ? 'editor' : 'viewer'}>
                    {userRole}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {userRole === 'admin' && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setTeamPanelOpen(true)}>
                      <Users size={14} /> Team
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setIsCreatePhaseModalOpen(true)}>
                      <Plus size={14} /> Phase
                    </Button>
                  </>
                )}
                {/* Invite always visible for Founder/PM, or admin-only otherwise */}
                {(userRole === 'admin' || config.alwaysShowInvite) && (
                  <Button variant="secondary" size="sm" onClick={() => setInviteModalOpen(true)}>
                    <UserPlus size={14} /> Invite
                  </Button>
                )}
              </div>
            </div>
            {/* Mobile phase tabs */}
            <div className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
              {phases.map((phase, i) => (
                <button
                  key={phase.id}
                  onClick={() => document.getElementById(`phase-${phase.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex-shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {i + 1}. {phase.title}
                </button>
              ))}
            </div>
          </div>

          {/* Phase sections */}
          <div className="space-y-4 p-6">
            {phases.length > 0 ? (
              phases.map((phase) => (
                <PhaseSection
                  key={phase.id}
                  phase={phase}
                  userRole={userRole}
                  config={config}
                  onTaskUpdate={handleTaskUpdate}
                  onEditPhase={() => { setEditingPhase(phase); setIsEditPhaseModalOpen(true); }}
                  onDeletePhase={() => handlePhaseDelete(phase)}
                  onViewMilestone={(p) => { setSelectedPhase(p); setModalOpen(true); saveModalState(p); }}
                />
              ))
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
                <p className="text-[var(--text-secondary)]">No roadmap data available for this project.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FIXED BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">{completedTasks.length}</span> of{' '}
            <span className="font-medium text-[var(--text-primary)]">{totalTasks.length}</span> tasks complete
          </p>
          <div className="flex w-48 items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
              <motion.div
                className="h-full rounded-full bg-[var(--accent)]"
                animate={{ width: `${overallProgress}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--text-muted)]">{overallProgress}%</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Auto-saved</p>
        </div>
      </div>

      {/* MODALS */}

      {/* Phase detail modal */}
      <PhaseModal
        open={modalOpen}
        onClose={handleCloseModal}
        phase={selectedPhase}
        onTaskUpdate={handleTaskUpdate}
        onMilestoneReorder={handleMilestoneReorder}
      />

      {/* Team Panel */}
      <TeamPanel
        isOpen={teamPanelOpen}
        onClose={() => setTeamPanelOpen(false)}
        projectId={projectId}
        currentUserId={user?.id}
        isAdmin={userRole === 'admin'}
      />

      {/* Invite Collaborators Modal */}
      <InviteCollaboratorsModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteCollaborators}
        projectName={project?.title || 'this project'}
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
        nextOrder={roadmapData?.phases?.length + 1 || 1}
      />
    </motion.div>
  );
};

export default ProjectDetailPage;
