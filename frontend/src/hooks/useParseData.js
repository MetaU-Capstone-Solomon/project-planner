import { useCallback } from 'react';

//create a hook for parsing file data
const useParseData = () => {
  const parseFileData = useCallback((file) => {
    if (file) {
      console.log('Parsing file:', file.name);
      // I will add the file parsing logic here
      return true;
    } else {
      console.log('No file selected for parsing');
      return false;
    }
  }, []);

  return { parseFileData };
};

export default useParseData; 