import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'large';
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, variant = 'default', fullWidth = false, className = '', ...props }, ref) => {
    const textareaClasses = variant === 'large' 
      ? 'block w-full min-w-0 min-h-[120px] rounded-lg border border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 text-lg px-5 py-3.5 transition-all duration-200 hover:border-gray-400 placeholder:text-gray-400'
      : 'block w-full min-w-0 min-h-[100px] rounded-lg border border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 text-base px-4 py-3 transition-all duration-200 hover:border-gray-400 placeholder:text-gray-400';
    const errorClasses = error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : '';
    const widthClasses = fullWidth ? 'w-full' : '';
    
    return (
      <div className={`form-group ${widthClasses}`}>
        {label && (
          <label htmlFor={props.id} className="label">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            className={`${textareaClasses} ${errorClasses} ${className}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
            {...props}
          />
          {error && (
            <div className="absolute top-3 right-3 pointer-events-none">
              <svg className="h-5 w-5 text-error-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        {error && (
          <p id={`${props.id}-error`} className="mt-2 text-sm text-error-600 animate-slide-down" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';