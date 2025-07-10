import { useCallback, useRef } from 'react';

/**
 * hook that creates a debounced version of a callback function.
 * Useful for reducing the frequency of API calls.
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @param {Array} deps - Dependencies array for the callback
 * @returns {Function} Debounced version of the callback
 */
const useDebouncedCallback = (callback, delay, deps = []) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay, ...deps]);
};

export default useDebouncedCallback; 