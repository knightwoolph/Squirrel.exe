import { useTaskStore, useTasks, useTaskStats, useTaskLists } from '../stores/taskStore';
import { useProfile, useStreakMultiplier, useNutTransactions } from '../stores/gamificationStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import type { Task } from '../types';
import { formatDistanceToNow } from 'date-fns';

export function Dashboard() {
  const stats = useTaskStats();
  const profile = useProfile();
  const multiplier = useStreakMultiplier();
  const transactions = useNutTransactions(5);
  const allTasks = useTasks();
  const taskLists = useTaskLists();

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

  // Get today's tasks (due today or overdue, not completed)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysTasks = allTasks?.filter((task) => {
    if (task.status === 'completed') return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < tomorrow;
  }) || [];

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

  const formatReason = (reason: string) => {
    return reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="p-4">
      {/* Quick Stats */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-card-value">{stats?.dueToday || 0}</div>
          <div className="stat-card-label">Tasks Today</div>
          {stats?.overdue ? (
            <div className="text-xs text-danger mt-1">{stats.overdue} overdue</div>
          ) : null}
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-card-value">{stats?.completionRate || 0}%</div>
          <div className="stat-card-label">Completion Rate</div>
          <div className="text-xs text-muted mt-1">
            {stats?.completed || 0} / {stats?.total || 0} tasks
          </div>
        </div>

        <div className="nut-card">
          <div className="nut-card-icon">🥜</div>
          <div className="nut-card-content">
            <div className="nut-card-value">{profile?.totalNuts || 0}</div>
            <div className="nut-card-label">Total Nuts</div>
          </div>
        </div>

        <div className="streak-card">
          <div className="streak-card-fire">🔥</div>
          <div>
            <div className="streak-card-days">{profile?.currentStreak || 0}</div>
            <div className="streak-card-label">Day Streak</div>
            {multiplier > 1 && (
              <div className="streak-badge">{multiplier}x</div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Tasks Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">Today's Tasks</h2>
          <button className="btn btn-primary btn-sm" onClick={() => openTaskForm()}>
            + Quick Task
          </button>
        </div>

        {todaysTasks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {todaysTasks.map((task) => (
              <TaskCard
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
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-muted mb-4">
                {allTasks?.length === 0
                  ? "No tasks yet! Create your first task to start earning nuts."
                  : "All caught up! No tasks due today."}
              </p>
              <button className="btn btn-nut" onClick={() => openTaskForm()}>
                🥜 Create Task (+1 nut)
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-xl mb-4">Quick Actions</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <button
            className="card p-4 text-center hover:bg-hover transition-colors cursor-pointer"
            onClick={() => openTaskForm()}
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium">New Task</div>
            <div className="text-xs text-muted">+1 nut</div>
          </button>

          <a
            href="/tasks"
            className="card p-4 text-center hover:bg-hover transition-colors no-underline"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">All Tasks</div>
            <div className="text-xs text-muted">{stats?.pending || 0} pending</div>
          </a>

          <a
            href="/victory-oak"
            className="card p-4 text-center hover:bg-hover transition-colors no-underline"
          >
            <div className="text-2xl mb-2">🌳</div>
            <div className="font-medium">Victory Oak</div>
            <div className="text-xs text-muted">{profile?.totalNuts || 0} nuts</div>
          </a>

          <a
            href="/stash"
            className="card p-4 text-center hover:bg-hover transition-colors no-underline"
          >
            <div className="text-2xl mb-2">🧠</div>
            <div className="font-medium">Brain Dump</div>
            <div className="text-xs text-muted">Quick capture</div>
          </a>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl mb-4">Recent Nut Activity</h2>
        {transactions && transactions.length > 0 ? (
          <div className="card">
            <div className="card-body p-0">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className={tx.amount > 0 ? 'text-success' : 'text-danger'}>
                      {tx.amount > 0 ? '🥜' : '💸'}
                    </span>
                    <div>
                      <div className="font-medium">
                        {tx.amount > 0 ? '+' : ''}{tx.amount} nuts
                      </div>
                      <div className="text-xs text-muted">{formatReason(tx.reason)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted">
                    {formatDistanceToNow(tx.createdAt, { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body text-center p-8">
              <div className="text-4xl mb-4">🐿️</div>
              <p className="text-muted">Complete tasks to see your nut earnings here!</p>
            </div>
          </div>
        )}
      </section>

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
