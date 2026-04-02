import { useState } from 'react';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { useTaskStore, useTasks, useTaskLists, useSubtasks } from '../stores/taskStore';
import type { Task, TaskStatus } from '../types';

type FilterStatus = 'all' | TaskStatus;

export function Tasks() {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const { isFormOpen, editingTask, openTaskForm, closeTaskForm, createTask, updateTask, completeTask, uncompleteTask, deleteTask } = useTaskStore();

  const taskLists = useTaskLists();
  const allTasks = useTasks();

  // Filter tasks based on status
  const filteredTasks = allTasks?.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const handleComplete = async (taskId: string) => {
    const task = allTasks?.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === 'completed') {
      await uncompleteTask(taskId);
    } else {
      await completeTask(taskId);
    }
  };

  const handleSubmit = async (taskData: Partial<Task>) => {
    if (taskData.id) {
      await updateTask(taskData.id, taskData);
    } else {
      await createTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'position' | 'status'>);
    }
  };

  const filterButtons: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl">All Tasks</h2>
        <button className="btn btn-primary" onClick={() => openTaskForm()}>
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            className={`btn btn-sm ${filter === btn.value ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setFilter(btn.value)}
          >
            {btn.label}
            {btn.value !== 'all' && filteredTasks && (
              <span className="ml-1 text-muted">
                ({allTasks?.filter((t) => t.status === btn.value).length || 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks && filteredTasks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filteredTasks.map((task) => (
            <TaskCardWithSubtasks
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onEdit={openTaskForm}
              onDelete={deleteTask}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center p-8">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-muted mb-4">
              {filter === 'all'
                ? 'No tasks yet. Create your first task to get started!'
                : `No ${filter.replace('_', ' ')} tasks.`}
            </p>
            {filter === 'all' && (
              <button className="btn btn-nut" onClick={() => openTaskForm()}>
                🥜 Create Task (+1 nut)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={closeTaskForm}
        onSubmit={handleSubmit}
        task={editingTask}
        taskLists={taskLists || []}
        defaultTaskListId={taskLists?.[0]?.id}
      />
    </div>
  );
}

// Wrapper to load subtasks for each task
function TaskCardWithSubtasks({
  task,
  onComplete,
  onEdit,
  onDelete,
}: {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const subtasks = useSubtasks(task.id);
  const { completeSubtask } = useTaskStore();

  return (
    <TaskCard
      task={task}
      subtasks={subtasks}
      onComplete={onComplete}
      onEdit={onEdit}
      onDelete={onDelete}
      onSubtaskComplete={completeSubtask}
    />
  );
}
