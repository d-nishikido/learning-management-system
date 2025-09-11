import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'interactive' | 'bordered';
  hover?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  padding = 'md', 
  onClick,
  variant = 'default',
  hover = true
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: 'rounded-xl border border-gray-200 bg-white shadow-soft',
    elevated: 'rounded-xl border border-gray-200 bg-white shadow-medium',
    interactive: 'rounded-xl border border-gray-200 bg-white shadow-soft cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
    bordered: 'rounded-xl border-2 border-primary-200 bg-white shadow-soft hover:border-primary-300',
  };

  const hoverClass = hover && variant !== 'interactive' ? 'hover:shadow-medium transition-all duration-200' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return (
    <div 
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}