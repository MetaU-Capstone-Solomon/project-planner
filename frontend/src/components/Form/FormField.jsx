import React from 'react';

const FormField = ({ label, children, className = '' }) => {
  const renderLabel = () => {
    if (label.includes('*')) {
      const parts = label.split('*');
      return (
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {parts[0]}
          <span className="text-red-500">*</span>
          {parts[1]}
        </label>
      );
    }
    return <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>;
  };

  return (
    <div className={className}>
      {renderLabel()}
      {children}
    </div>
  );
};

export default FormField;
