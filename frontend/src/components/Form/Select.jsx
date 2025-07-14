import React from 'react';

const Select = ({ name, value, onChange, options, className = '' }) => {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
