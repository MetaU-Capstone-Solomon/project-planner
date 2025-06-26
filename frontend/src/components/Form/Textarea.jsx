import React from 'react';

const Textarea = ({ placeholder, value, onChange, rows = 4, className = '', ...props }) => {
  const baseClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none';

  return (
    <textarea
      placeholder={placeholder}
      rows={rows}
      className={`${baseClasses} ${className}`}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

export default Textarea;
