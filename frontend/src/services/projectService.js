import { supabase } from '@/lib/supabase';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    const { error } = await supabase
      .from('roadmap')
      .update({ content })
      .eq('id', projectId);

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
