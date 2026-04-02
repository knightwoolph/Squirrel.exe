import { forwardRef, type InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

    if (!label) {
      return (
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`checkbox ${className}`}
          {...props}
        />
      );
    }

    return (
      <label className="checkbox-wrapper">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`checkbox ${className}`}
          {...props}
        />
        <span className="checkbox-label">{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Task Checkbox with special styling
interface TaskCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const TaskCheckbox = forwardRef<HTMLInputElement, TaskCheckboxProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={`task-checkbox ${className}`}
        {...props}
      />
    );
  }
);

TaskCheckbox.displayName = 'TaskCheckbox';

// Toggle Switch
interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const toggleId = id || `toggle-${Math.random().toString(36).slice(2, 9)}`;

    if (!label) {
      return (
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          className={`toggle ${className}`}
          {...props}
        />
      );
    }

    return (
      <label className="toggle-wrapper">
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          className={`toggle ${className}`}
          {...props}
        />
        <span className="checkbox-label">{label}</span>
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
