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