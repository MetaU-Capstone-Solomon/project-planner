import { supabase } from '@/lib/supabase';

/**
 * Save a new project to the database
 * @param {Object} projectData - Project data to save
 * @param {string} projectData.title - Project title
 * @param {string} projectData.content - Project roadmap content
 * @returns {Promise<Object>} - Result with success status and project ID or error
 */
export const saveProject = async (projectData) => {
  // TODO: Add validation for projectData (PR feedback: data integrity)
  // TODO: Add user_id to the saved project
  // TODO: Add project metadata (timeline, technologies, scope) to database
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('You must be logged in to save a project.');

    // Insert new project
    const { data, error } = await supabase
      .from('roadmap')
      .insert({
        title: projectData.title || 'Untitled Project',
        content: projectData.content,
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

// TODO: Add getProject function for retrieving saved projects (Next PR)
// TODO: Add getUserProjects function for listing user's projects 