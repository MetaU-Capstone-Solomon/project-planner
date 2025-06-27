import React from 'react';

const FormField = ({ label, children, className = '' }) => {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
};

export default FormField;
