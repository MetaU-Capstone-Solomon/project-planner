import { useState, useCallback } from 'react';

const useForm = (initialState = {}) => {
  const [values, setValues] = useState(initialState);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialState);
  }, [initialState]);

  return {
    values,
    handleChange,
    setValue,
    reset,
  };
};

export default useForm;
