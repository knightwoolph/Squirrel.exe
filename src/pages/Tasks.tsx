import { useState } from 'react';
import { ClipboardList, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { useTaskStore, useTasks, useTaskLists, useSubtasks, useTaskStats } from '../stores/taskStore';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import type { Task, TaskStatus } from '../types';

type FilterTab = 'all' | TaskStatus;

// ─── Subtask loader wrapper ────────────────────────────────────────────────────
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
  const { completeSubtask, createSubtask, deleteSubtask } = useTaskStore();

  return (
    <TaskCard
      task={task}
      subtasks={subtasks}
      onComplete={onComplete}
      onEdit={onEdit}
      onDelete={onDelete}
      onSubtaskComplete={completeSubtask}
      onSubtaskCreate={createSubtask}
      onSubtaskDelete={deleteSubtask}
    />
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({
  filter,
  onCreateTask,
}: {
  filter: FilterTab;
  onCreateTask: () => void;
}) {
  const config: Record<FilterTab, { icon: React.ReactNode; label: string; showCreate: boolean }> = {
    all: {
      icon: <ClipboardList className="h-10 w-10 text-muted-foreground/40" />,
      label: 'No tasks yet. Create your first task to get started!',
      showCreate: true,
    },
    pending: {
      icon: <Clock className="h-10 w-10 text-muted-foreground/40" />,
      label: 'No pending tasks.',
      showCreate: false,
    },
    in_progress: {
      icon: <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />,
      label: 'No tasks in progress.',
      showCreate: false,
    },
    completed: {
      icon: <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />,
      label: 'No completed tasks yet.',
      showCreate: false,
    },
  };

  const { icon, label, showCreate } = config[filter];

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      {icon}
      <p className="text-sm text-muted-foreground">{label}</p>
      {showCreate && (
        <Button variant="default" size="sm" onClick={onCreateTask}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Task
        </Button>
      )}
    </div>
  );
}

// ─── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = useTaskStats();
  if (!stats) return null;

  const items = [
    { label: 'Total', value: stats.total, className: 'text-foreground' },
    { label: 'Due today', value: stats.dueToday, className: 'text-warning' },
    { label: 'Overdue', value: stats.overdue, className: 'text-danger' },
    { label: 'Done', value: `${stats.completionRate}%`, className: 'text-success' },
  ];

  return (
    <div className="mb-5 flex flex-wrap gap-x-6 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="text-xs text-muted-foreground">
          {item.label}:{' '}
          <span className={`font-semibold ${item.className}`}>{item.value}</span>
        </span>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function Tasks() {
  const [filter, setFilter] = useState<FilterTab>('all');

  const {
    isFormOpen,
    editingTask,
    openTaskForm,
    closeTaskForm,
    createTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
  } = useTaskStore();

  const taskLists = useTaskLists();
  const allTasks = useTasks();

  const counts: Record<FilterTab, number> = {
    all: allTasks?.length ?? 0,
    pending: allTasks?.filter((t) => t.status === 'pending').length ?? 0,
    in_progress: allTasks?.filter((t) => t.status === 'in_progress').length ?? 0,
    completed: allTasks?.filter((t) => t.status === 'completed').length ?? 0,
  };

  const filteredTasks =
    filter === 'all' ? allTasks : allTasks?.filter((t) => t.status === filter);

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
      await createTask(
        taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'position' | 'status'>
      );
    }
  };

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage and track your work</p>
        </div>
        <Button onClick={() => openTaskForm()} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterTab)}
        className="flex flex-1 flex-col"
      >
        <TabsList className="mb-4 w-full justify-start sm:w-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              {tab.label}
              <Badge
                variant="secondary"
                className="h-4 min-w-[1.25rem] rounded-full px-1 py-0 text-[10px] leading-4"
              >
                {counts[tab.value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="flex-1">
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
              <EmptyState filter={tab.value} onCreateTask={() => openTaskForm()} />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Task Form Dialog */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={closeTaskForm}
        onSubmit={handleSubmit}
        task={editingTask}
        taskLists={taskLists ?? []}
        defaultTaskListId={taskLists?.[0]?.id}
      />
    </div>
  );
}
