/**
 * ValidateResources function Validates a single resource object
 * It iterate through each resource and validate both name and URL fields
 * Returns an object with errors indexed by resource position and a boolean flag indicating overall validation status
 * Example: User types empty name and invalid URL -> { errors: { 0: { name: 'Required', url: 'Invalid URL' } }, hasErrors: true }
 * So we will have an error message displayed to the user for each resource that has an error
 * 
 * @param {Object} resource - Resource object to validate
 * @param {string} resource.name - Resource name
 * @param {string} resource.url - Resource URL
 * @returns {Object} Validation errors object (empty if valid)
 * @returns {string} [returns.name] - Name validation error message
 * @returns {string} [returns.url] - URL validation error message
 */
export const validateResource = (resource) => {
  const errors = {};
  if (!resource.name?.trim()) {
    errors.name = 'Resource name is required';
  }
  if (!resource.url?.trim()) {
    errors.url = 'Resource URL is required';
  } else {
    try {
      new URL(resource.url);
    } catch {
      errors.url = 'Please enter a valid URL';
    }
  }
  return errors;
};

export const validateResources = (resources) => {
  const errors = {};
  let hasErrors = false;

  resources.forEach((resource, index) => {
    const resourceErrors = validateResource(resource);
    if (Object.keys(resourceErrors).length > 0) {
      errors[index] = resourceErrors;
      hasErrors = true;
    }
  });

  return { errors, hasErrors };
};
