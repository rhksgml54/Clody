import React from 'react';

const fieldClass =
  'w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400';

export const InputField: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    {children}
    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
  </div>
);

export const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={fieldClass} />
);

export const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={fieldClass} />
);
