import React from 'react';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  className = '',
}) => {
  const icons: Record<ToastType, string> = {
    error: '⚠️',
    success: '✅',
    info: 'ℹ️',
    warning: '⚡',
  };

  return (
    <div className={`toast-ui toast-ui-${type} ${className}`} role="alert">
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Close notification">
          ✕
        </button>
      )}
    </div>
  );
};
