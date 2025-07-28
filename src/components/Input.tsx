import React from 'react';
import '../styles/Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon,
  className = '', 
  ...props 
}) => {
  const inputClassName = `
    input-field
    ${error ? 'input-error' : ''}
    ${icon ? 'pl-10' : ''}
    ${className}
  `;

  return (
    <div className="input-container">
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <div className={icon ? 'input-with-icon' : ''}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          className={inputClassName}
          {...props}
        />
      </div>
      {error && (
        <p className="error-message">{error}</p>
      )}
    </div>
  );
}

export default Input;