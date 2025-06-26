export const filterExperiences = (suggestions, input, currentExperiences) => {
  return suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(input.toLowerCase()) &&
      !currentExperiences.includes(suggestion)
  );
};
