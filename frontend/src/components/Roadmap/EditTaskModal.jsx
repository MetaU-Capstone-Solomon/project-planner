import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '../../constants/colors';

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
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isValid, setIsValid] = useState(true);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
      });
      setIsValid(true);
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

  if (!isOpen || !task) return null;

  return (
    <div className={`${COLOR_PATTERNS.components.modal.overlay} z-50`} onClick={handleCancel}>
      <div
        className={`${COLOR_PATTERNS.components.modal.container} mx-4 w-full max-w-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`border-b border-gray-200 p-4 dark:border-gray-600 ${COLOR_CLASSES.surface.modal}`}
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
        <div className={`p-4 ${COLOR_CLASSES.surface.modal}`}>
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
          </div>
        </div>

        {/* Footer */}
        <div
          className={`border-t border-gray-200 p-4 dark:border-gray-600 ${COLOR_CLASSES.surface.modal}`}
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
