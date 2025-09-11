import React, { useState, useEffect } from 'react';
import { X, Mail, UserPlus } from 'lucide-react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';
import { getInputClasses, getButtonClasses } from '@/utils/formUtils';
import { MESSAGES } from '@/constants/messages';
import { FORM_LIMITS, MODAL_SIZES } from '@/constants/forms';
import { validateEmailWithMessage, validateTextLength, isFormValid } from '@/utils/validationUtils';

/**
 * InviteCollaboratorsModal - Modal for inviting collaborators to a project
 *
 * COMPONENT:
 * This modal provides a focused experience for inviting collaborators to a project.
 * Follows the established modal patterns from the codebase.
 *
 * KEY FEATURES:
 * - Responsive Design: Optimized for both desktop and mobile screens
 * - Form Validation: Prevents sending invalid invitations
 * - Role Selection: Choose between Editor and Viewer roles
 * - Email Validation: Basic email format validation
 * - Keyboard Support: Enter to submit, Escape to cancel
 * - Accessibility: Proper ARIA labels and focus management
 *
 * USER INTERACTION FLOW:
 * 1. User clicks "Invite Collaborators" → Modal opens with empty form
 * 2. User enters email and selects role → Real-time validation
 * 3. User clicks "Send Invitation" → Sends invitation, closes modal
 * 4. User clicks Cancel/X → Discards changes, closes modal
 *
 * STATE MANAGEMENT:
 * - Local state: form data, validation state, loading state
 * - Props: modal open/close state, callbacks
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onInvite - Callback to send invitation
 * @param {string} props.projectName - Name of the project for context
 */
const InviteCollaboratorsModal = ({ isOpen, onClose, onInvite, projectName }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: MESSAGES.COLLABORATION.ROLES.EDITOR,
    message: ''
  });
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        role: MESSAGES.COLLABORATION.ROLES.EDITOR,
        message: ''
      });
      setIsValid(false);
      setIsLoading(false);
      setErrors({});
    }
  }, [isOpen]);

  // Handle form data changes
  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Validate form
    const newErrors = { ...errors };
    
    if (field === 'email') {
      const emailValidation = validateEmailWithMessage(value);
      if (emailValidation.isValid) {
        delete newErrors.email;
      } else {
        newErrors.email = emailValidation.error;
      }
    }

    if (field === 'message') {
      const messageValidation = validateTextLength(value, FORM_LIMITS.MESSAGE_MAX_LENGTH);
      if (!messageValidation.isValid) {
        newErrors.message = messageValidation.error;
      } else {
        delete newErrors.message;
      }
    }

    setErrors(newErrors);
    setIsValid(newData.email.trim().length > 0 && isFormValid(newErrors));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await onInvite({
        email: formData.email.trim(),
        role: formData.role,
        message: formData.message.trim()
      });
      onClose();
    } catch (error) {
      console.error('Error sending invitation:', error);
      setErrors({ submit: 'Failed to send invitation. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`${COLOR_PATTERNS.components.modal.overlay} z-50`} onClick={handleCancel}>
      <div
        className={`${COLOR_PATTERNS.components.modal.container} mx-4 flex max-h-[90vh] w-full ${MODAL_SIZES.MEDIUM} flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`border-b border-gray-200 p-5 dark:border-gray-600 ${COLOR_CLASSES.surface.modal} flex-shrink-0`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${COLOR_CLASSES.text.heading}`}>
                  Invite Collaborators
                </h2>
                <p className={`text-base ${COLOR_CLASSES.text.muted}`}>
                  Add team members to "{projectName}"
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="rounded-full p-2 transition-colors duration-200 hover:bg-gray-100 focus:outline-none dark:hover:bg-gray-800"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className={`p-5 ${COLOR_CLASSES.surface.modal} flex-1 overflow-y-auto`}>
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className={`block text-base font-medium ${COLOR_CLASSES.text.heading} mb-2`}>
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`${getInputClasses(!!errors.email)} pl-10 text-base`}
                  placeholder="colleague@company.com"
                  autoComplete="email"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-base text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className={`block text-base font-medium ${COLOR_CLASSES.text.heading} mb-2`}>
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className={`${getInputClasses()} text-base`}
              >
                <option value={MESSAGES.COLLABORATION.ROLES.EDITOR}>
                  Editor
                </option>
                <option value={MESSAGES.COLLABORATION.ROLES.VIEWER}>
                  Viewer
                </option>
              </select>
            </div>

            {/* Optional Message */}
            <div>
              <label htmlFor="message" className={`block text-base font-medium ${COLOR_CLASSES.text.heading} mb-2`}>
                Personal Message (Optional)
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className={`${getInputClasses()} resize-none text-base`}
                placeholder="Add a personal note to your invitation..."
                rows={3}
                maxLength={FORM_LIMITS.MESSAGE_MAX_LENGTH}
              />
              <p className={`mt-1 text-sm ${COLOR_CLASSES.text.muted}`}>
                {formData.message.length}/{FORM_LIMITS.MESSAGE_MAX_LENGTH} characters
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className={`rounded-md p-3 ${COLOR_CLASSES.status.error.bg} ${COLOR_CLASSES.status.error.border} border`}>
                <p className={`text-sm ${COLOR_CLASSES.status.error.text}`}>
                  {errors.submit}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className={`${getButtonClasses('secondary')} px-6 py-3 text-base`}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${getButtonClasses('primary')} px-6 py-3 text-base font-medium`}
              disabled={!isValid || isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteCollaboratorsModal;
