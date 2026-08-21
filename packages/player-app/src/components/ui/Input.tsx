import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixNode?: React.ReactNode;
  suffixNode?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  prefixNode,
  suffixNode,
  fullWidth = true,
  className = '',
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`input-field-group ${fullWidth ? 'input-full' : ''} ${disabled ? 'input-disabled' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className={`input-container ${error ? 'input-error-border' : ''}`}>
        {prefixNode && <span className="input-prefix">{prefixNode}</span>}
        <input
          id={inputId}
          ref={ref}
          className={`input-control ${className}`}
          disabled={disabled}
          {...props}
        />
        {suffixNode && <span className="input-suffix">{suffixNode}</span>}
      </div>
      {error && <span className="input-error-text">⚠️ {error}</span>}
      {!error && helperText && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
});

Input.displayName = 'Input';
