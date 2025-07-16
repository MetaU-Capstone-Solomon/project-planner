import React from 'react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';

const Textarea = React.forwardRef(({ className = '', ...props }, ref) => {
  const baseClasses = `${COLOR_PATTERNS.components.input} resize-y min-h-[120px]`;
  const combinedClasses = `${baseClasses} ${className}`;

  return <textarea ref={ref} className={combinedClasses} {...props} />;
});

Textarea.displayName = 'Textarea';

export default Textarea;
