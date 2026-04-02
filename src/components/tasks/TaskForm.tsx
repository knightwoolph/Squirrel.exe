import { useState, useEffect, useId } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { Task, Priority, TaskList } from '../../types';

// ─── Priority option config ────────────────────────────────────────────────────
interface PriorityOption {
  value: Priority;
  label: string;
  dotClass: string;
  pillClass: string;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 5,
    label: 'Critical',
    dotClass: 'bg-priority-critical',
    pillClass:
      'border-priority-critical/30 bg-priority-critical/10 text-priority-critical hover:bg-priority-critical/20',
  },
  {
    value: 4,
    label: 'High',
    dotClass: 'bg-priority-high',
    pillClass:
      'border-priority-high/30 bg-priority-high/10 text-priority-high hover:bg-priority-high/20',
  },
  {
    value: 3,
    label: 'Medium',
    dotClass: 'bg-priority-medium',
    pillClass:
      'border-priority-medium/30 bg-priority-medium/10 text-priority-medium hover:bg-priority-medium/20',
  },
  {
    value: 2,
    label: 'Low',
    dotClass: 'bg-priority-low',
    pillClass:
      'border-priority-low/30 bg-priority-low/10 text-priority-low hover:bg-priority-low/20',
  },
  {
    value: 1,
    label: 'Someday',
    dotClass: 'bg-priority-someday',
    pillClass:
      'border-priority-someday/30 bg-priority-someday/10 text-priority-someday hover:bg-priority-someday/20',
  },
];

// ─── Priority selector ─────────────────────────────────────────────────────────
function PrioritySelector({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Priority">
      {PRIORITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
            opt.pillClass,
            value === opt.value
              ? 'ring-2 ring-offset-1 ring-offset-background ring-current'
              : 'opacity-70'
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', opt.dotClass)} />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Subtask draft row ─────────────────────────────────────────────────────────
function SubtaskDraftRow({
  title,
  onRemove,
}: {
  title: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
      <span className="flex-1 text-sm text-foreground">{title}</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-danger"
        aria-label="Remove subtask"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Form state ────────────────────────────────────────────────────────────────
interface FormFields {
  title: string;
  description: string;
  priority: Priority;
  taskListId: string;
  dueDate: string;
  estimatedMinutes: string;
}

const DEFAULT_FIELDS: FormFields = {
  title: '',
  description: '',
  priority: 3,
  taskListId: '',
  dueDate: '',
  estimatedMinutes: '',
};

// ─── TaskForm ──────────────────────────────────────────────────────────────────
interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => Promise<void> | void;
  task?: Task | null;
  taskLists: TaskList[];
  defaultTaskListId?: string;
}

export function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  task,
  taskLists,
  defaultTaskListId,
}: TaskFormProps) {
  const formId = useId();
  const isEditing = !!task;

  const [fields, setFields] = useState<FormFields>(DEFAULT_FIELDS);
  const [subtaskDrafts, setSubtaskDrafts] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');

  // Sync fields when task or open state changes
  useEffect(() => {
    if (!isOpen) return;
    if (task) {
      setFields({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        taskListId: task.taskListId,
        dueDate: task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '',
        estimatedMinutes: task.estimatedMinutes?.toString() ?? '',
      });
    } else {
      setFields({
        ...DEFAULT_FIELDS,
        taskListId: defaultTaskListId ?? taskLists[0]?.id ?? '',
      });
    }
    setSubtaskDrafts([]);
    setSubtaskInput('');
    setTitleError('');
  }, [task, isOpen, defaultTaskListId, taskLists]);

  const set = <K extends keyof FormFields>(key: K) =>
    (value: FormFields[K]) => setFields((prev) => ({ ...prev, [key]: value }));

  const addSubtaskDraft = () => {
    const trimmed = subtaskInput.trim();
    if (!trimmed) return;
    setSubtaskDrafts((prev) => [...prev, trimmed]);
    setSubtaskInput('');
  };

  const removeSubtaskDraft = (index: number) =>
    setSubtaskDrafts((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Commit any pending subtask input
    const pendingSubtask = subtaskInput.trim();
    const allSubtasks = pendingSubtask
      ? [...subtaskDrafts, pendingSubtask]
      : subtaskDrafts;

    if (!fields.title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setTitleError('');

    setSubmitting(true);
    try {
      await onSubmit({
        ...(task && { id: task.id }),
        title: fields.title.trim(),
        description: fields.description.trim() || undefined,
        priority: fields.priority,
        taskListId: fields.taskListId,
        dueDate: fields.dueDate ? new Date(fields.dueDate) : undefined,
        estimatedMinutes: fields.estimatedMinutes
          ? parseInt(fields.estimatedMinutes, 10)
          : undefined,
        // Subtask drafts are passed as a separate field for the caller to handle
        // (only relevant for new tasks; existing tasks have subtasks managed in TaskCard)
        ...((!isEditing && allSubtasks.length > 0) && { _subtaskDrafts: allSubtasks as unknown as undefined }),
      });

      // If creating a new task we also need to persist drafts — caller manages this
      // via onSubtaskCreate; we bubble the drafts through a known mechanism below.
      if (!isEditing && allSubtasks.length > 0) {
        // Store drafts for post-create wiring (handled by parent if needed)
        (window as unknown as Record<string, unknown>).__pendingSubtasks = allSubtasks;
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const noLists = taskLists.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base">
            {isEditing ? 'Edit Task' : 'New Task'}
          </DialogTitle>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex flex-col gap-4 px-5 py-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-title`}>
                Task title <span className="text-danger">*</span>
              </Label>
              <Input
                id={`${formId}-title`}
                autoFocus
                placeholder="What needs to be done?"
                value={fields.title}
                onChange={(e) => {
                  set('title')(e.target.value);
                  if (titleError) setTitleError('');
                }}
                aria-describedby={titleError ? `${formId}-title-error` : undefined}
                className={cn(titleError && 'border-danger focus-visible:ring-danger/30')}
              />
              {titleError && (
                <p id={`${formId}-title-error`} className="text-xs text-danger">
                  {titleError}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-desc`}>Description</Label>
              <Textarea
                id={`${formId}-desc`}
                placeholder="Add details, context, or notes…"
                rows={3}
                value={fields.description}
                onChange={(e) => set('description')(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <PrioritySelector value={fields.priority} onChange={set('priority')} />
            </div>

            {/* Project (task list) */}
            {!noLists && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-list`}>Project</Label>
                <Select
                  value={fields.taskListId}
                  onValueChange={set('taskListId')}
                >
                  <SelectTrigger id={`${formId}-list`}>
                    <SelectValue placeholder="Select a project…" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Due date + time estimate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-due`}>Due date</Label>
                <Input
                  id={`${formId}-due`}
                  type="date"
                  value={fields.dueDate}
                  onChange={(e) => set('dueDate')(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-est`}>Estimate (min)</Label>
                <Input
                  id={`${formId}-est`}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 30"
                  value={fields.estimatedMinutes}
                  onChange={(e) => set('estimatedMinutes')(e.target.value)}
                />
              </div>
            </div>

            {/* Subtasks — only shown for new tasks (editing manages them inline in TaskCard) */}
            {!isEditing && (
              <div className="flex flex-col gap-1.5">
                <Label>Subtasks</Label>

                {subtaskDrafts.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {subtaskDrafts.map((title, i) => (
                      <SubtaskDraftRow
                        key={i}
                        title={title}
                        onRemove={() => removeSubtaskDraft(i)}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add a subtask…"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubtaskDraft();
                      }
                    }}
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addSubtaskDraft}
                    disabled={!subtaskInput.trim()}
                    aria-label="Add subtask"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Press Enter or click + to add. Subtasks can also be added after creating the task.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="border-t border-border px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={submitting || !fields.title.trim()}
            >
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {isEditing ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
