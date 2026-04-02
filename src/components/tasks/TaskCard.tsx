import { useState } from 'react';
import { TaskCheckbox } from '../common/Checkbox';
import { PriorityBadge } from '../common/PriorityBadge';
import type { Task, Subtask } from '../../types';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  subtasks?: Subtask[];
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onSubtaskComplete?: (subtaskId: string) => void;
}

export function TaskCard({
  task,
  subtasks = [],
  onComplete,
  onEdit,
  onDelete,
  onSubtaskComplete,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === 'completed';
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  // Determine card state class
  const getStateClass = () => {
    if (isCompleted) return 'task-card-completed';
    if (task.status === 'in_progress') return 'task-card-in-progress';
    if (task.dueDate) {
      if (isPast(task.dueDate) && !isToday(task.dueDate)) return 'task-card-overdue';
      if (isToday(task.dueDate) || isTomorrow(task.dueDate)) return 'task-card-due-soon';
    }
    return '';
  };

  // Format due date display
  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    if (isToday(task.dueDate)) return 'Due Today';
    if (isTomorrow(task.dueDate)) return 'Due Tomorrow';
    if (isPast(task.dueDate)) return `Overdue (${format(task.dueDate, 'MMM d')})`;
    return format(task.dueDate, 'MMM d');
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task.id);
  };

  return (
    <div
      className={`task-card ${getStateClass()} ${expanded ? 'task-card-expanded' : ''}`}
      onClick={() => onEdit(task)}
    >
      <TaskCheckbox
        checked={isCompleted}
        onChange={() => {}}
        onClick={handleCheckboxClick}
      />

      <div className="task-card-content">
        <div className="task-card-title">{task.title}</div>
        <div className="task-card-meta">
          {task.dueDate && (
            <span className="task-card-meta-item">
              {isPast(task.dueDate) && !isToday(task.dueDate) ? '⚠️' : '📅'} {getDueDateDisplay()}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="task-card-meta-item">
              ⏱️ {task.estimatedMinutes}m
            </span>
          )}
          {subtasks.length > 0 && (
            <span
              className="task-card-meta-item cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              ☑️ {completedSubtasks}/{subtasks.length}
            </span>
          )}
        </div>

        {/* Subtasks (when expanded) */}
        {expanded && subtasks.length > 0 && (
          <div className="task-card-subtasks" onClick={(e) => e.stopPropagation()}>
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className={`subtask-item ${subtask.completed ? 'subtask-item-completed' : ''}`}
              >
                <TaskCheckbox
                  checked={subtask.completed}
                  onChange={() => onSubtaskComplete?.(subtask.id)}
                />
                <span>{subtask.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <PriorityBadge priority={task.priority} />

      {/* Actions (shown on hover) */}
      <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => onEdit(task)}
          title="Edit"
        >
          ✏️
        </button>
        {onDelete && (
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => onDelete(task.id)}
            title="Delete"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
