import { supabase } from '@/lib/supabase';
import { MESSAGES } from '@/constants/messages';

/**
 * Project Service
 *
 * Handles all project-related database operations including:
 * - Saving new projects with roadmap content
 * - Retrieving projects by ID
 * - Retrieving all user projects for dashboard
 * - Updating project content for persistence
 * - User authentication validation
 * - Error handling and response formatting
 *
 * All functions return response objects with success/error status.
 */

/**
 * Save a new project to the database
 *
 * @param {Object} projectData - Project data to save
 * @param {string} projectData.title - Project title
 * @param {string} projectData.content - Project roadmap content
 * @returns {Promise<Object>} Result with success status and project ID or error
 */
export const saveProject = async (projectData) => {
  try {
    // Get current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('You must be logged in to save a project.');

    // Insert new project
    const { data, error } = await supabase
      .from('roadmap')
      .insert({
        title: projectData.title || MESSAGES.ACTIONS.DEFAULT_TITLE,
        content: projectData.content,
        user_id: user.id,
      })
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      return { success: true, projectId: data[0].id };
    } else {
      throw new Error('Project saved, but failed to retrieve the new ID.');
    }
  } catch (error) {
    console.error('Failed to save project:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Retrieve all projects for the current user
 *
 * @returns {Promise<Object>} Result with projects array or error
 */
export const getUserProjects = async () => {
  try {
    // Get current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('You must be logged in to view projects.');

    // Fetch user's projects ordered by most recent
    const { data, error } = await supabase
      .from('roadmap')
      .select('id, title, content, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return { success: true, projects: data || [] };
  } catch (error) {
    console.error('Failed to fetch user projects:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update existing project content for persistence
 *
 * @param {string} projectId - Project ID to update
 * @param {string} content - JSON string representing the updated roadmap
 * @returns {Promise<Object>} Result with success status or error
 */
export const updateProject = async (projectId, content) => {
  try {
    // Check if user has permission to edit
    const permissionResult = await checkUserPermission(projectId, MESSAGES.COLLABORATION.PERMISSIONS.EDIT);
    if (!permissionResult.success) {
      return { success: false, error: permissionResult.error };
    }
    if (!permissionResult.hasPermission) {
      return { success: false, error: MESSAGES.ERROR.PROJECT_EDIT_DENIED };
    }

    const { error } = await supabase.from('roadmap').update({ content }).eq('id', projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Failed to update project:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Retrieve a project by ID
 *
 * @param {string} projectId - Project ID to retrieve
 * @returns {Promise<Object>} Result with project data or error
 */
export const getProject = async (projectId) => {
  try {
    // Check if user has permission to view
    const permissionResult = await checkUserPermission(projectId, MESSAGES.COLLABORATION.PERMISSIONS.VIEW);
    if (!permissionResult.success) {
      return { success: false, error: permissionResult.error };
    }
    if (!permissionResult.hasPermission) {
      return { success: false, error: MESSAGES.ERROR.PROJECT_ACCESS_DENIED };
    }

    const { data, error } = await supabase
      .from('roadmap')
      .select('id, title, content, created_at')
      .eq('id', projectId)
      .single();

    if (error) throw error;

    return { success: true, project: data };
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a project from the database
 *
 * @param {string} projectId - Project ID to delete
 * @returns {Promise<Object>} Result with success status or error
 */
export const deleteProject = async (projectId) => {
  try {
    // Check if user has permission to delete
    const permissionResult = await checkUserPermission(projectId, MESSAGES.COLLABORATION.PERMISSIONS.DELETE);
    if (!permissionResult.success) {
      return { success: false, error: permissionResult.error };
    }
    if (!permissionResult.hasPermission) {
      return { success: false, error: MESSAGES.ERROR.PROJECT_DELETE_DENIED };
    }

    // Delete the project
    const { error } = await supabase.from('roadmap').delete().eq('id', projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Failed to delete project:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// COLLABORATION PERMISSION FUNCTIONS
// =====================================================

/**
 * Check if the current user has a specific permission for a project
 *
 * @param {string} projectId - Project ID to check permissions for
 * @param {string} permission - Permission to check (view, edit, delete, invite)
 * @param {string} userId - Optional user ID (defaults to current user)
 * @returns {Promise<Object>} Result with permission status and user role
 */
export const checkUserPermission = async (projectId, permission, userId = null) => {
  try {
    // Get current user if userId not provided
    if (!userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('You must be logged in to check permissions.');
      userId = user.id;
    }

    // First, try to get user's role from collaborators table
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select('role, status')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      if (data) {
        const role = data.role;
        const hasPermission = getPermissionForRole(role, permission);
        return { 
          success: true, 
          hasPermission,
          role,
          isCollaborator: true
        };
      }
    } catch (collaboratorError) {
      console.warn('Failed to check collaborators table, falling back to project owner check:', collaboratorError);
    }

    // Fallback: Check if user is the project owner
    const { data: project, error: projectError } = await supabase
      .from('roadmap')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // If user is the project owner, give them admin permissions
    if (project.user_id === userId) {
      const hasPermission = getPermissionForRole(MESSAGES.COLLABORATION.ROLES.ADMIN, permission);
      return { 
        success: true, 
        hasPermission,
        role: MESSAGES.COLLABORATION.ROLES.ADMIN,
        isCollaborator: true
      };
    }

    // User is not a collaborator and not the owner
    return { 
      success: true, 
      hasPermission: false,
      role: null,
      isCollaborator: false
    };

  } catch (error) {
    console.error('Failed to check user permission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's role for a specific project
 *
 * @param {string} projectId - Project ID to check
 * @param {string} userId - Optional user ID (defaults to current user)
 * @returns {Promise<Object>} Result with user role and collaboration status
 */
export const getUserProjectRole = async (projectId, userId = null) => {
  try {
    // Get current user if userId not provided
    if (!userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('You must be logged in to check project role.');
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('project_collaborators')
      .select('role, status')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

    const role = data?.role || null;
    const permissions = getRolePermissions(role);

    return { 
      success: true, 
      role, 
      permissions,
      isCollaborator: !!data
    };
  } catch (error) {
    console.error('Failed to get user project role:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get permission for a specific role
 *
 * @param {string} role - User role (admin, editor, viewer, or null)
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether the role has the permission
 */
const getPermissionForRole = (role, permission) => {
  const permissions = getRolePermissions(role);
  
  switch (permission) {
    case MESSAGES.COLLABORATION.PERMISSIONS.VIEW:
      return permissions.canView;
    case MESSAGES.COLLABORATION.PERMISSIONS.EDIT:
      return permissions.canEdit;
    case MESSAGES.COLLABORATION.PERMISSIONS.DELETE:
      return permissions.canDelete;
    case MESSAGES.COLLABORATION.PERMISSIONS.INVITE:
      return permissions.canInvite;
    default:
      return false;
  }
};

/**
 * Get all permissions for a specific role
 *
 * @param {string} role - User role (admin, editor, viewer, or null)
 * @returns {Object} Object with all permissions for the role
 */
const getRolePermissions = (role) => {
  const permissions = {
    canView: false,
    canEdit: false,
    canDelete: false,
    canInvite: false
  };

  switch (role) {
    case MESSAGES.COLLABORATION.ROLES.ADMIN:
      permissions.canView = true;
      permissions.canEdit = true;
      permissions.canDelete = true;
      permissions.canInvite = true;
      break;
    case MESSAGES.COLLABORATION.ROLES.EDITOR:
      permissions.canView = true;
      permissions.canEdit = true;
      break;
    case MESSAGES.COLLABORATION.ROLES.VIEWER:
      permissions.canView = true;
      break;
    default:
      // No permissions for non-collaborators
      break;
  }

  return permissions;
};
