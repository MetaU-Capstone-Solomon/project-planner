import React from 'react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';

const Select = React.forwardRef(({ options, className = '', ...props }, ref) => {
  const baseClasses = `${COLOR_PATTERNS.components.input}`;
  const combinedClasses = `${baseClasses} ${className}`;

  return (
    <select ref={ref} className={combinedClasses} {...props}>
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className={`${COLOR_CLASSES.surface.input} ${COLOR_CLASSES.text.heading}`}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
});

Select.displayName = 'Select';

export default Select;
