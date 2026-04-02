import { useState } from 'react';
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { Task, Subtask, Priority } from '../../types';

// ─── Priority config ───────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; className: string; dotClass: string }
> = {
  5: {
    label: 'Critical',
    className:
      'border-priority-critical/30 bg-priority-critical/10 text-priority-critical',
    dotClass: 'bg-priority-critical',
  },
  4: {
    label: 'High',
    className:
      'border-priority-high/30 bg-priority-high/10 text-priority-high',
    dotClass: 'bg-priority-high',
  },
  3: {
    label: 'Medium',
    className:
      'border-priority-medium/30 bg-priority-medium/10 text-priority-medium',
    dotClass: 'bg-priority-medium',
  },
  2: {
    label: 'Low',
    className:
      'border-priority-low/30 bg-priority-low/10 text-priority-low',
    dotClass: 'bg-priority-low',
  },
  1: {
    label: 'Someday',
    className:
      'border-priority-someday/30 bg-priority-someday/10 text-priority-someday',
    dotClass: 'bg-priority-someday',
  },
};

// ─── Priority badge ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <Badge
      variant="outline"
      className={cn('gap-1 border text-[10px] font-medium leading-none', cfg.className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dotClass)} />
      {cfg.label}
    </Badge>
  );
}

// ─── Due date display helpers ──────────────────────────────────────────────────
function getDueDateText(dueDate: Date): string {
  if (isToday(dueDate)) return 'Due today';
  if (isTomorrow(dueDate)) return 'Due tomorrow';
  if (isPast(dueDate)) return `Overdue · ${format(dueDate, 'MMM d')}`;
  return format(dueDate, 'MMM d');
}

function isOverdue(dueDate: Date): boolean {
  return isPast(dueDate) && !isToday(dueDate);
}

// ─── Subtask row ───────────────────────────────────────────────────────────────
function SubtaskRow({
  subtask,
  onComplete,
  onDelete,
}: {
  subtask: Subtask;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded py-0.5 pl-1">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={onComplete}
        className="h-3.5 w-3.5 shrink-0"
      />
      <span
        className={cn(
          'flex-1 text-xs',
          subtask.completed
            ? 'text-muted-foreground line-through'
            : 'text-foreground'
        )}
      >
        {subtask.title}
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="invisible shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-danger group-hover:visible"
        aria-label="Remove subtask"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Add subtask input ─────────────────────────────────────────────────────────
function AddSubtaskInput({
  taskId,
  onAdd,
}: {
  taskId: string;
  onAdd: (taskId: string, title: string) => Promise<string>;
}) {
  const [value, setValue] = useState('');
  const [adding, setAdding] = useState(false);

  const commit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    await onAdd(taskId, trimmed);
    setValue('');
  };

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-1 flex items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
        Add subtask
      </button>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-1">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setValue('');
            setAdding(false);
          }
        }}
        onBlur={commit}
        placeholder="Subtask title…"
        className="h-6 flex-1 rounded border border-border bg-background px-2 text-xs outline-none ring-0 focus:border-primary"
      />
    </div>
  );
}

// ─── TaskCard ──────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  subtasks?: Subtask[];
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onSubtaskComplete?: (subtaskId: string) => void;
  onSubtaskCreate?: (taskId: string, title: string) => Promise<string>;
  onSubtaskDelete?: (subtaskId: string) => void;
}

export function TaskCard({
  task,
  subtasks = [],
  onComplete,
  onEdit,
  onDelete,
  onSubtaskComplete,
  onSubtaskCreate,
  onSubtaskDelete,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const completedCount = subtasks.filter((s) => s.completed).length;
  const hasSubtasks = subtasks.length > 0;
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  // Border accent by state
  const cardBorderClass = cn(
    'group relative border transition-colors',
    isCompleted && 'border-border opacity-60',
    !isCompleted && isInProgress && 'border-l-2 border-l-primary',
    !isCompleted && overdue && 'border-l-2 border-l-danger',
    !isCompleted && !isInProgress && !overdue && 'border-border hover:border-primary/40'
  );

  return (
    <Card className={cardBorderClass}>
      <div className="flex items-start gap-3 p-3">
        {/* Completion checkbox */}
        <div className="mt-0.5 shrink-0">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onComplete(task.id)}
            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
            className={cn(
              'h-4 w-4',
              isCompleted && 'data-[state=checked]:bg-success data-[state=checked]:border-success'
            )}
          />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              className={cn(
                'flex-1 text-left text-sm font-medium leading-snug transition-colors',
                isCompleted
                  ? 'text-muted-foreground line-through'
                  : 'text-foreground hover:text-primary'
              )}
              onClick={() => onEdit(task)}
            >
              {task.title}
            </button>

            {/* Actions dropdown — visible on hover */}
            <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Task actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(task.id)}
                        className="text-danger focus:text-danger"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Description preview */}
          {task.description && !isCompleted && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />

            {task.dueDate && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[11px]',
                  overdue
                    ? 'font-medium text-danger'
                    : isToday(task.dueDate)
                    ? 'font-medium text-warning'
                    : 'text-muted-foreground'
                )}
              >
                {overdue ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                {getDueDateText(task.dueDate)}
              </span>
            )}

            {task.estimatedMinutes && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.estimatedMinutes}m
              </span>
            )}

            {hasSubtasks && (
              <button
                type="button"
                onClick={() => setExpanded((p) => !p)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <CheckCircle2 className="h-3 w-3" />
                {completedCount}/{subtasks.length}
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
          </div>

          {/* Subtask progress bar */}
          {hasSubtasks && completedCount > 0 && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all duration-300"
                style={{ width: `${(completedCount / subtasks.length) * 100}%` }}
              />
            </div>
          )}

          {/* Subtask list (expanded) */}
          {expanded && (
            <div className="mt-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2">
              <div className="flex flex-col gap-0.5">
                {subtasks.map((subtask) => (
                  <SubtaskRow
                    key={subtask.id}
                    subtask={subtask}
                    onComplete={() => onSubtaskComplete?.(subtask.id)}
                    onDelete={() => onSubtaskDelete?.(subtask.id)}
                  />
                ))}
              </div>
              {onSubtaskCreate && (
                <AddSubtaskInput taskId={task.id} onAdd={onSubtaskCreate} />
              )}
            </div>
          )}

          {/* Show add subtask button even when collapsed (if no subtasks yet) */}
          {!hasSubtasks && !expanded && onSubtaskCreate && (
            <div className="mt-1">
              <AddSubtaskInput taskId={task.id} onAdd={onSubtaskCreate} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
