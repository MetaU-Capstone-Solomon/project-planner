import { PASSWORD_MIN_LENGTH, ERROR_MESSAGES } from '@/constants/validation';

export const validateProjectForm = (values) => {
  const errors = {};

  // Check required fields
  if (!values.title?.trim()) {
    errors.title = 'Project title is required';
  }

  if (!values.timeline) {
    errors.timeline = 'Timeline is required';
  } else if (values.timeline === 'custom' && !values.customTimeline?.trim()) {
    errors.customTimeline = 'Custom timeline is required';
  }

  if (!values.experienceLevel) {
    errors.experienceLevel = 'Experience level is required';
  }

  if (!values.projectScope) {
    errors.projectScope = 'Project scope is required';
  }

  return errors;
};

export const hasRequiredFields = (values) => {
  const hasTitle = values.title?.trim();
  const hasTimeline = values.timeline && (values.timeline !== 'custom' || values.customTimeline?.trim());
  const hasExperienceLevel = values.experienceLevel;
  const hasProjectScope = values.projectScope;

  return hasTitle && hasTimeline && hasExperienceLevel && hasProjectScope;
};

// Get final timeline value (custom or selected)
export const getFinalTimeline = (values) => {
  return values.timeline === 'custom' ? values.customTimeline : values.timeline;
}; 