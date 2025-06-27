import { useState, useMemo, useCallback } from 'react';
import { EXPERIENCE_SUGGESTIONS } from '@/constants/experienceSuggestions';
import { filterExperiences } from '@/services/experienceService';

export const useExperiences = () => {
  const [experiences, setExperiences] = useState([]);
  const [experienceInput, setExperienceInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredSuggestions = useMemo(() => {
    return filterExperiences(EXPERIENCE_SUGGESTIONS, experienceInput, experiences);
  }, [experienceInput, experiences]);

  const addExperience = useCallback((experience) => {
    if (experience.trim()) {
      setExperiences((prev) => {
        if (prev.includes(experience.trim())) return prev;
        return [...prev, experience.trim()];
      });
      setExperienceInput('');
      setShowDropdown(false);
    }
  }, []);

  const removeExperience = useCallback((index) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleExperienceInputChange = useCallback((value) => {
    setExperienceInput(value);
    setShowDropdown(value.length > 0);
  }, []);

  return {
    experiences,
    experienceInput,
    showDropdown,
    filteredSuggestions,
    addExperience,
    removeExperience,
    handleExperienceInputChange,
  };
};
