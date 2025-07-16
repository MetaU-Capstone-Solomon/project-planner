import React from 'react';
import { COLOR_CLASSES } from '@/constants/colors';

//  wrapper component: optional required indicator
const FormField = ({
  label,
  children,
  className = '',
  isRequired = false,
  requiredIndicator = '*',
}) => {
  const renderLabel = () => {
    return (
      <label className={`mb-2 block text-sm font-medium ${COLOR_CLASSES.text.heading}`}>
        {label}
        {isRequired && (
          <span className="ml-1 text-red-500 dark:text-red-400">{requiredIndicator}</span>
        )}
      </label>
    );
  };

  return (
    <div className={className}>
      {renderLabel()}
      {children}
    </div>
  );
};

export default FormField;
