import { useState } from 'react';
import { validateResource } from '../utils/formValidation';

/**
 * This hook is for managing resources in the edit forms
 * Manages resource list state including adding, editing, deleting, and validation of resources
 * Handles draft state, validation errors, and editing modes automatically.
 * 
 * Feature Included:
 * 
 * Start editing an existing resource
 * Save the current draft (add new or update existing)
 * Cancel the current editing operation
 * Delete a resource at the specified index
 * Update a specific field in the current draft
 * Initialize the hook with a new set of resources
 */
export const useResourceManagement = (initialResources = []) => {
  const [resources, setResources] = useState(initialResources);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState({ name: '', url: '' });
  const [errors, setErrors] = useState({});

  /**
   * Start adding a new resource
   */
  const addResource = () => {
    setEditingIndex(resources.length);
    setDraft({ name: '', url: '' });
    setErrors({});
  };


  const editResource = (index) => {
    setEditingIndex(index);
    setDraft({ ...resources[index] });
    setErrors({});
  };

  
  const saveResource = () => {
    const validationErrors = validateResource(draft);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    const updated = [...resources];
    updated[editingIndex] = { ...draft };
    setResources(updated);
    setEditingIndex(null);
    setDraft({ name: '', url: '' });
    setErrors({});
    return true;
  };


  const cancelEdit = () => {
    setEditingIndex(null);
    setDraft({ name: '', url: '' });
    setErrors({});
  };

  const deleteResource = (index) => {
    const updated = resources.filter((_, i) => i !== index);
    setResources(updated);
    if (editingIndex === index) {
      cancelEdit();
    }
  };

  const updateDraft = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };


  const initialize = (newResources) => {
    setResources(Array.isArray(newResources) ? newResources : []);
    setEditingIndex(null);
    setDraft({ name: '', url: '' });
    setErrors({});
  };

  return {
    // State
    resources,
    editingIndex,
    draft,
    errors,
    
    // Actions
    addResource,
    editResource,
    saveResource,
    cancelEdit,
    deleteResource,
    updateDraft,
    initialize
  };
}; 