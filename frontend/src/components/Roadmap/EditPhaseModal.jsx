import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';

/**
 * Modal for editing phase titles
 *
 * HOW IT WORKS:
 *
 * 1. FORM STATE: Manages local form state with title input and validation status.
 *    - formData: Current form values (title)
 *    - isValid: Real-time validation state for immediate user feedback
 *
 * 2. INITIALIZATION: When modal opens, pre-populates form with existing phase data
 *    using useEffect to ensure form reflects current phase title.
 *
 * 3. VALIDATION: Real-time validation ensures title is not empty before allowing save.
 *    Shows error message and disables save button if validation fails.
 *
 * 4. SAVE HANDLING: Sends only the updated title back to parent component for processing.
 *
 * 5. KEYBOARD SHORTCUTS: Supports Ctrl+Enter to save and Escape to cancel for better UX.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Object} props.phase - Phase data to edit
 * @param {Function} props.onSave - Callback to save phase changes
 */
const EditPhaseModal = ({ isOpen, onClose, phase, onSave }) => {
  const [formData, setFormData] = useState({ title: '' });
  const [isValid, setIsValid] = useState(true);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && phase) {
      setFormData({
        title: phase.title || '',
      });
      setIsValid(true);
    }
  }, [isOpen, phase]);

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
            <h2 className={`text-lg font-semibold ${COLOR_CLASSES.text.heading}`}>Edit Phase</h2>
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
                htmlFor="phase-title"
                className={`mb-2 block text-sm font-medium ${COLOR_CLASSES.text.heading}`}
              >
                Phase Title *
              </label>
              <textarea
                id="phase-title"
                className={`w-full font-medium ${COLOR_CLASSES.text.heading} border bg-gray-100 dark:bg-gray-700 ${isValid ? 'border-gray-300 dark:border-gray-600' : 'border-red-500'} rounded px-3 py-2 focus:${COLOR_CLASSES.border.focus} max-h-[100px] min-h-[50px] resize-none outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800`}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={100}
                rows={1}
                placeholder="Enter phase title..."
                autoFocus
              />
              {!isValid && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Phase title is required
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.title.length}/100 characters
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

export default EditPhaseModal;
