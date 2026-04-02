import { forwardRef, type InputHTMLAttributes } from 'react';

type InputSize = 'sm' | 'md' | 'lg';
type InputState = 'default' | 'error' | 'success';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  state?: InputState;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  hint?: string;
  label?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      state = 'default',
      leftIcon,
      rightIcon,
      error,
      hint,
      label,
      required,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const hasError = state === 'error' || !!error;
    const hasSuccess = state === 'success';

    const inputClasses = [
      'input',
      size === 'sm' && 'input-sm',
      size === 'lg' && 'input-lg',
      hasError && 'input-error',
      hasSuccess && 'input-success',
      leftIcon && 'input-with-icon-left',
      rightIcon && 'input-with-icon-right',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const input = (
      <input
        ref={ref}
        id={inputId}
        className={inputClasses}
        aria-invalid={hasError}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
    );

    // If no icons, just return the input (possibly with label)
    if (!leftIcon && !rightIcon && !label && !error && !hint) {
      return input;
    }

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className={`form-label ${required ? 'form-label-required' : ''}`}>
            {label}
          </label>
        )}
        {(leftIcon || rightIcon) ? (
          <div className="input-wrapper">
            {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
            {input}
            {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
          </div>
        ) : (
          input
        )}
        {error && (
          <div id={`${inputId}-error`} className="form-error">
            {error}
          </div>
        )}
        {hint && !error && (
          <div id={`${inputId}-hint`} className="form-hint">
            {hint}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input variant
interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div className="search-wrapper">
        <Input
          ref={ref}
          type="search"
          className={`search-input ${className}`}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  state?: InputState;
  error?: string;
  hint?: string;
  label?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      state = 'default',
      error,
      hint,
      label,
      required,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const hasError = state === 'error' || !!error;
    const hasSuccess = state === 'success';

    const textareaClasses = [
      'textarea',
      hasError && 'input-error',
      hasSuccess && 'input-success',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const textarea = (
      <textarea
        ref={ref}
        id={textareaId}
        className={textareaClasses}
        aria-invalid={hasError}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        {...props}
      />
    );

    if (!label && !error && !hint) {
      return textarea;
    }

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={textareaId} className={`form-label ${required ? 'form-label-required' : ''}`}>
            {label}
          </label>
        )}
        {textarea}
        {error && (
          <div id={`${textareaId}-error`} className="form-error">
            {error}
          </div>
        )}
        {hint && !error && (
          <div id={`${textareaId}-hint`} className="form-hint">
            {hint}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
