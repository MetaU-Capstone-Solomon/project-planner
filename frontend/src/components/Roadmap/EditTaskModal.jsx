import React, { useState, useEffect } from 'react';
import { X, Save, Edit2, Trash2, Plus } from 'lucide-react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '../../constants/colors';
import { getInputClasses, getResourceCountClasses, getButtonClasses } from '../../utils/formUtils';
import { useResourceManagement } from '../../hooks/useResourceManagement';

/**
 * EditTaskModal - Dedicated modal for editing task title and description
 *
 * COMPONENT:
 * This modal provides a focused editing experience for tasks, replacing inline editing
 * to provide better UX on both desktop and mobile devices.
 *
 * KEY FEATURES:
 * - Responsive Design: Optimized for both desktop and mobile screens
 * - Focused Editing: Dedicated space for editing without distractions
 * - Form Validation: Prevents saving empty titles
 * - Keyboard Support: Enter to save, Escape to cancel
 * - Accessibility: Proper ARIA labels and focus management
 *
 * USER INTERACTION FLOW:
 * 1. User clicks edit icon → Phase modal closes, Edit modal opens
 * 2. User edits title/description → Real-time validation
 * 3. User clicks Save → Updates task, closes edit modal, reopens phase modal
 * 4. User clicks Cancel/X → Discards changes, closes edit modal, reopens phase modal
 *
 * STATE MANAGEMENT:
 * - Local state: form data, validation state
 * - Props: task data, modal open/close state, callbacks
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal and reopen phase modal
 * @param {Object} props.task - Task data to edit
 * @param {Function} props.onSave - Callback to save task changes
 */
const EditTaskModal = ({ isOpen, onClose, task, onSave }) => {
  const [formData, setFormData] = useState({ title: '', description: '', resources: [] });
  const [isValid, setIsValid] = useState(true);
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(false);
  
  // Use custom hook for resource management
  const {
    resources,
    editingIndex,
    draft,
    errors,
    addResource,
    editResource,
    saveResource,
    cancelEdit,
    deleteResource,
    updateDraft,
    initialize
  } = useResourceManagement();

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        resources: Array.isArray(task.resources) ? task.resources : []
      });
      setIsValid(true);
      setIsResourcesExpanded(false);
      initialize(task.resources || []);
    }
  }, [isOpen, task]);

  // Handle form data changes
  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setIsValid(newData.title.trim().length > 0);
  };

  // Handle save
  const handleSave = () => {
    if (!formData.title.trim()) {
      setIsValid(false);
      return;
    }

    onSave({
      title: formData.title.trim(),
      description: formData.description,
      resources: resources
    });
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Toggle resources expansion
  const handleToggleResources = () => {
    setIsResourcesExpanded(!isResourcesExpanded);
  };

  // Handle resource save with form data update
  const handleSaveResource = () => {
    if (saveResource()) {
      // Update form data with new resources from hook
      setFormData(prev => ({ ...prev, resources: resources }));
    }
  };

  // Handle resource delete with form data update
  const handleDeleteResource = (idx) => {
    deleteResource(idx);
    // Update form data with new resources from hook
    setFormData(prev => ({ ...prev, resources: resources }));
  };

  if (!isOpen || !task) return null;

  return (
    <div className={`${COLOR_PATTERNS.components.modal.overlay} z-50`} onClick={handleCancel}>
      <div
        className={`${COLOR_PATTERNS.components.modal.container} mx-4 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`border-b border-gray-200 p-4 dark:border-gray-600 ${COLOR_CLASSES.surface.modal} flex-shrink-0`}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${COLOR_CLASSES.text.heading}`}>Edit Task</h2>
            <button
              onClick={handleCancel}
              className="rounded-full p-1 transition-colors duration-200 hover:bg-gray-100 focus:outline-none dark:hover:bg-gray-800"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className={`p-4 ${COLOR_CLASSES.surface.modal} overflow-y-auto flex-1`}>
          <div className="space-y-4">
            {/* Title Field */}
            <div>
              <label
                htmlFor="task-title"
                className={`mb-2 block text-sm font-medium ${COLOR_CLASSES.text.heading}`}
              >
                Task Title *
              </label>
              <textarea
                id="task-title"
                className={`w-full font-medium ${COLOR_CLASSES.text.heading} border bg-gray-100 dark:bg-gray-700 ${isValid ? 'border-gray-300 dark:border-gray-600' : 'border-red-500'} rounded px-3 py-2 focus:${COLOR_CLASSES.border.focus} max-h-[100px] min-h-[50px] resize-none outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800`}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={100}
                rows={1}
                placeholder="Enter task title..."
                autoFocus
              />
              {!isValid && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Task title is required
                </p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor="task-description"
                className={`mb-2 block text-sm font-medium ${COLOR_CLASSES.text.heading}`}
              >
                Description
              </label>
              <textarea
                id="task-description"
                className={`w-full ${COLOR_CLASSES.text.body} rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm leading-relaxed dark:border-gray-600 dark:bg-gray-700 focus:${COLOR_CLASSES.border.focus} resize-vertical max-h-[300px] min-h-[120px] outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800`}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1000}
                rows={4}
                placeholder="Enter task description..."
              />
            </div>

            {/* Resources Section */}
            <div>
              <button
                type="button"
                onClick={handleToggleResources}
                className={`flex items-center justify-between w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${COLOR_CLASSES.text.heading}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Resources</span>
                  <span className={getResourceCountClasses(resources.length > 0)}>
                    {resources.length}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`transform transition-transform duration-200 ${isResourcesExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded Resources Content */}
              {isResourcesExpanded && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                                  {resources.length === 0 && editingIndex === null && (
                  <p className={`text-sm ${COLOR_CLASSES.text.body} py-3 px-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 text-center`}>
                    No resources added. Click "+ Add Resource" below to add more resources.
                  </p>
                )}
                
                {resources.map((resource, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    {editingIndex === idx ? (
                      <>
                        <div className="flex gap-2">
                          <input
                            className={`w-1/2 ${getInputClasses(errors.name, 'sm')}`}
                            value={draft.name}
                            onChange={e => updateDraft('name', e.target.value)}
                            placeholder="Resource name"
                          />
                          <input
                            className={`w-1/2 ${getInputClasses(errors.url, 'sm')}`}
                            value={draft.url}
                            onChange={e => updateDraft('url', e.target.value)}
                            placeholder="https://example.com"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={handleSaveResource} className={`p-1 rounded ${COLOR_CLASSES.status.success.bg} ${COLOR_CLASSES.status.success.text}`} aria-label="Save resource">
                            <Save className="h-4 w-4" />
                          </button>
                          <button onClick={cancelEdit} className={`p-1 rounded border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30`} aria-label="Cancel edit">
                            <X className="h-4 w-4" />
                          </button>
                          {(errors.name || errors.url) && (
                            <span className="text-xs text-red-500">{errors.name || errors.url}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="flex-1 truncate text-sm font-medium ${COLOR_CLASSES.text.heading}">{resource.name}</span>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 mr-2"
                          >
                            Link
                          </a>
                          <button onClick={() => editResource(idx)} className={`p-1 rounded ${COLOR_CLASSES.surface.cardHover}`} aria-label="Edit resource">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteResource(idx)} className={`p-1 rounded hover:${COLOR_CLASSES.status.error.bg}`} aria-label="Delete resource">
                            <Trash2 className={`h-4 w-4 ${COLOR_CLASSES.status.error.text}`} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                  
                                    {/* Add Resource Row */}
                  {editingIndex === resources.length && (
                    <div className="flex flex-col gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <div className="flex gap-2">
                        <input
                          className={`w-1/2 ${getInputClasses(errors.name, 'sm')}`}
                          value={draft.name}
                          onChange={e => updateDraft('name', e.target.value)}
                          placeholder="Resource name"
                        />
                        <input
                          className={`w-1/2 ${getInputClasses(errors.url, 'sm')}`}
                          value={draft.url}
                          onChange={e => updateDraft('url', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={handleSaveResource} className={`p-1 rounded ${COLOR_CLASSES.status.success.bg} ${COLOR_CLASSES.status.success.text}`} aria-label="Save resource">
                          <Save className="h-4 w-4" />
                        </button>
                        <button onClick={cancelEdit} className={`p-1 rounded border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30`} aria-label="Cancel add">
                          <X className="h-4 w-4" />
                        </button>
                        {(errors.name || errors.url) && (
                          <span className="text-xs text-red-500">{errors.name || errors.url}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Add Resource Button */}
                  {editingIndex === null && (
                    <button
                      type="button"
                      onClick={addResource}
                      className={`flex items-center space-x-1 px-3 py-1 rounded ${COLOR_PATTERNS.button.secondary} text-sm`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Resource</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`border-t border-gray-200 p-4 dark:border-gray-600 ${COLOR_CLASSES.surface.modal} flex-shrink-0`}
        >
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className={`flex items-center space-x-1 rounded px-4 py-2 ${COLOR_PATTERNS.button.secondary} text-sm`}
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`flex items-center space-x-1 rounded px-4 py-2 ${COLOR_PATTERNS.button.primary} text-sm disabled:cursor-not-allowed disabled:bg-gray-300`}
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
