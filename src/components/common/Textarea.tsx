import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      required,
      autoResize = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const hasError = !!error;

    const textareaClasses = [
      'textarea',
      hasError && 'input-error',
      autoResize && 'textarea-auto-resize',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={textareaId} className={`form-label ${required ? 'form-label-required' : ''}`}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          aria-invalid={hasError}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
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
