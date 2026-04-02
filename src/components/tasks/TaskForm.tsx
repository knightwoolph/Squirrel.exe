import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { PrioritySelector } from '../common/PriorityBadge';
import type { Task, Priority, TaskList } from '../../types';
import { format } from 'date-fns';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
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
  const isEditing = !!task;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(3);
  const [taskListId, setTaskListId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setTaskListId(task.taskListId);
      setDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');
      setEstimatedMinutes(task.estimatedMinutes?.toString() || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority(3);
      setTaskListId(defaultTaskListId || taskLists[0]?.id || '');
      setDueDate('');
      setEstimatedMinutes('');
    }
  }, [task, defaultTaskListId, taskLists]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    onSubmit({
      ...(task && { id: task.id }),
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      taskListId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
    });

    onClose();
  };

  const taskListOptions = taskLists.map((list) => ({
    value: list.id,
    label: list.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'New Task'}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            className={isEditing ? 'btn btn-primary' : 'btn btn-nut'}
          >
            {isEditing ? 'Save Changes' : '🥜 Create Task (+1 nut)'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit}>
        <Input
          label="Task Title"
          required
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <Textarea
          label="Description"
          placeholder="Add more details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="form-group">
          <label className="form-label">Priority</label>
          <PrioritySelector value={priority} onChange={setPriority} />
        </div>

        <Select
          label="Project"
          options={taskListOptions}
          value={taskListId}
          onChange={(e) => setTaskListId(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Input
            label="Time Estimate"
            type="number"
            placeholder="minutes"
            min="1"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            hint="Estimated time in minutes"
          />
        </div>
      </form>
    </Modal>
  );
}
