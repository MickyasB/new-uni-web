import React from 'react';

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'danger' | 'ghost' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const baseClasses = ['btn-ui', `btn-ui-${variant}`, `btn-ui-${size}`];
  if (fullWidth) baseClasses.push('btn-ui-full');
  if (loading) baseClasses.push('btn-ui-loading');
  if (className) baseClasses.push(className);

  return (
    <button
      className={baseClasses.join(' ')}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner-wrap">
          <span className="spinner-sm" />
          <span>Loading...</span>
        </span>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
