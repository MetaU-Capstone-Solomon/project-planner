import React from 'react';

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
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
        {isRequired && <span className="ml-1 text-red-500">{requiredIndicator}</span>}
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
