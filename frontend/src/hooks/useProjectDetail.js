import { useState, useCallback, useEffect } from 'react';

const useForm = (initialState = {}) => {
  const [values, setValues] = useState(initialState);

  // Save form values to localStorage
  const saveFormValues = useCallback((newValues) => {
    localStorage.setItem('projectForm', JSON.stringify(newValues));
  }, []);

  // Load saved form data on mount
  useEffect(() => {
    const savedForm = JSON.parse(localStorage.getItem('projectForm') || '{}');
    if (Object.keys(savedForm).length > 0) {
      setValues(savedForm);
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const newValues = {
      ...values,
      [name]: value,
    };
    setValues(newValues);
    saveFormValues(newValues);
  }, [values, saveFormValues]);

  const setValue = useCallback((name, value) => {
    const newValues = {
      ...values,
      [name]: value,
    };
    setValues(newValues);
    saveFormValues(newValues);
  }, [values, saveFormValues]);

  const reset = useCallback(() => {
    setValues(initialState);
    localStorage.removeItem('projectForm');
  }, [initialState]);

  return {
    values,
    handleChange,
    setValue,
    reset,
  };
};

export default useForm;
