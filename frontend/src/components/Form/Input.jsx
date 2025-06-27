import React from 'react';

const Input = ({ type = 'text', placeholder, value, onChange, className = '', ...props }) => {
  const baseClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`${baseClasses} ${className}`}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

export default Input;
