import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';

/**
 * CreateMilestoneModal - modal for creating new milestones
 *
 * COMPONENT:
 * This modal provides a focused creation experience for milestones within phases.
 * Simple form with fields for milestone creation.
 *
 * KEY FEATURES:
 * - Responsive Design: Optimized for both desktop and mobile screens
 * - Focused Creation: Dedicated space for milestone creation without distractions
 * - Form Validation: Prevents saving empty titles

 *
 * USER INTERACTION FLOW:
 * 1. User clicks "Add Milestone" → Modal opens with empty form
 * 2. User enters title/timeline → Real-time validation
 * 3. User clicks Save → Creates milestone, closes modal
 * 4. User clicks Cancel/X → Discards changes, closes modal
 *
 * STATE MANAGEMENT:
 * - Local state: form data, validation state
 * - Props: modal open/close state, callbacks
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onSave - Callback to save milestone data
 * @param {number} props.nextOrder - Next order number for the milestone
 */
const CreateMilestoneModal = ({ isOpen, onClose, onSave, nextOrder }) => {
  const [formData, setFormData] = useState({ title: '', timeline: '' });
  const [isValid, setIsValid] = useState(true);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ title: '', timeline: '' });
      setIsValid(true);
    }
  }, [isOpen]);

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

    const newMilestone = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title.trim(),
      timeline: formData.timeline.trim() || `Milestone ${nextOrder}`,
      order: nextOrder,
      tasks: [],
    };

    onSave(newMilestone);
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

  if (!isOpen) return null;

  return (
    <div className={`${COLOR_PATTERNS.components.modal.overlay} z-50`} onClick={handleCancel}>
      <div
        className={`${COLOR_PATTERNS.components.modal.container} mx-4 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`border-b border-gray-200 p-4 dark:border-gray-600 ${COLOR_CLASSES.surface.modal} flex-shrink-0`}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${COLOR_CLASSES.text.heading}`}>
              Add New Milestone
            </h2>
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
        <div className={`p-4 ${COLOR_CLASSES.surface.modal} flex-1 overflow-y-auto`}>
          <div className="space-y-4">
            {/* Title Field */}
            <div>
              <label
                htmlFor="milestone-title"
                className={`mb-2 block text-sm font-medium ${COLOR_CLASSES.text.heading}`}
              >
                Milestone Title *
              </label>
              <textarea
                id="milestone-title"
                className={`w-full font-medium ${COLOR_CLASSES.text.heading} border bg-gray-100 dark:bg-gray-700 ${isValid ? 'border-gray-300 dark:border-gray-600' : 'border-red-500'} rounded px-3 py-2 focus:${COLOR_CLASSES.border.focus} max-h-[100px] min-h-[50px] resize-none outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800`}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={100}
                rows={1}
                placeholder="Enter milestone title..."
                autoFocus
              />
              {!isValid && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Milestone title is required
                </p>
              )}
            </div>

            {/* Timeline Field */}
            <div>
              <label
                htmlFor="milestone-timeline"
                className={`mb-2 block text-sm font-medium ${COLOR_CLASSES.text.heading}`}
              >
                Timeline (Optional)
              </label>
              <input
                id="milestone-timeline"
                type="text"
                className={`w-full ${COLOR_CLASSES.text.body} rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm leading-relaxed dark:border-gray-600 dark:bg-gray-700 focus:${COLOR_CLASSES.border.focus} outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800`}
                value={formData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={50}
                placeholder="e.g., Days 1-3, Week 1, Month 1"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave empty to auto-generate as "Milestone {nextOrder}"
              </p>
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

export default CreateMilestoneModal;
