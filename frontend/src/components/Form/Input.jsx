import React from 'react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';

const Input = React.forwardRef(({ className = '', ...props }, ref) => {
  const baseClasses = `${COLOR_PATTERNS.components.input}`;
  const combinedClasses = `${baseClasses} ${className}`;

  return <input ref={ref} className={combinedClasses} {...props} />;
});

Input.displayName = 'Input';

export default Input;
