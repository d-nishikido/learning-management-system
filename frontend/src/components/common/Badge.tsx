import { ReactNode } from 'react';

interface BadgeProps {
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant, size = 'md', children, className = '', dot = false }: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 font-semibold rounded-full ring-1 transition-all duration-200 hover:scale-105';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 ring-primary-200 hover:bg-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 ring-secondary-200 hover:bg-secondary-200',
    success: 'bg-success-50 text-success-700 ring-success-200 hover:bg-success-100',
    warning: 'bg-warning-50 text-warning-700 ring-warning-200 hover:bg-warning-100',
    error: 'bg-error-50 text-error-700 ring-error-200 hover:bg-error-100',
    info: 'bg-info-50 text-info-700 ring-info-200 hover:bg-info-100',
  };

  const dotColors = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    info: 'bg-info-500',
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />
      )}
      {children}
    </span>
  );
}