import type { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; emoji: string; class: string }> = {
  5: { label: 'Critical', emoji: '🔥🔥', class: 'priority-badge-critical' },
  4: { label: 'High', emoji: '🔥', class: 'priority-badge-high' },
  3: { label: 'Medium', emoji: '⚡', class: 'priority-badge-medium' },
  2: { label: 'Low', emoji: '📌', class: 'priority-badge-low' },
  1: { label: 'Someday', emoji: '💤', class: 'priority-badge-someday' },
};

export function PriorityBadge({
  priority,
  showLabel = true,
  size = 'md',
  className = '',
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  if (!showLabel) {
    // Icon-only variant
    return (
      <span
        className={`priority-icon priority-icon-${config.class.replace('priority-badge-', '')} ${className}`}
        title={`${config.label} priority`}
      >
        {config.emoji}
      </span>
    );
  }

  return (
    <span
      className={`priority-badge ${config.class} ${size === 'sm' ? 'text-xs' : ''} ${className}`}
    >
      {config.emoji} {showLabel && config.label}
    </span>
  );
}

// Priority selector for forms
interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  className?: string;
}

export function PrioritySelector({ value, onChange, className = '' }: PrioritySelectorProps) {
  const priorities: Priority[] = [5, 4, 3, 2, 1];

  return (
    <div className={`flex gap-2 ${className}`}>
      {priorities.map((p) => {
        const config = PRIORITY_CONFIG[p];
        const isSelected = value === p;

        return (
          <button
            key={p}
            type="button"
            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onChange(p)}
            title={config.label}
          >
            {config.emoji}
          </button>
        );
      })}
    </div>
  );
}
