import { formatDistanceToNow } from 'date-fns';
import {
  Brain,
  CheckCircle2,
  Flame,
  ListTodo,
  Nut,
  Plus,
  Target,
  TreePine,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';
import {
  useNutTransactions,
  useProfile,
  useStreakMultiplier,
} from '../stores/gamificationStore';
import { useTaskStore, useTaskLists, useTaskStats, useTasks } from '../stores/taskStore';
import type { Task } from '../types';

// ── Streak tier helpers ──────────────────────────────────────────────────────

function getStreakTierLabel(streak: number): string {
  if (streak >= 30) return 'Legendary';
  if (streak >= 14) return '2x bonus';
  if (streak >= 7) return '1.5x bonus';
  return 'Keep going';
}

function getStreakTierColor(streak: number): string {
  if (streak >= 30) return 'text-[var(--nut-gold)]';
  if (streak >= 14) return 'text-[var(--streak-fire)]';
  if (streak >= 7) return 'text-[var(--warning)]';
  return 'text-[var(--text-muted)]';
}

// ── NutTransaction reason formatter ─────────────────────────────────────────

function formatReason(reason: string): string {
  return reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  accent?: string;
  className?: string;
}

function StatCard({ icon, label, value, sub, accent, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">{icon}</span>
          {accent && (
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
              )}
            >
              {accent}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <p className="text-2xl font-bold text-[var(--text-primary)] leading-none mb-1">
          {value}
        </p>
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        {sub && <div className="mt-1.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ── Quick Action Card ────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick?: () => void;
  to?: string;
  iconBg?: string;
}

function QuickActionCard({ icon, label, sub, onClick, to, iconBg }: QuickActionProps) {
  const inner = (
    <div className="flex flex-col items-center gap-2 py-1">
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)]',
          iconBg ?? 'bg-[var(--bg-tertiary)]'
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      <span className="text-xs text-[var(--text-muted)]">{sub}</span>
    </div>
  );

  const sharedClass =
    'flex flex-col items-center p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer no-underline';

  if (to) {
    return (
      <Link to={to} className={sharedClass}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={sharedClass} onClick={onClick}>
      {inner}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

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

  // Today's tasks — due today or overdue, not completed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysTasks: Task[] =
    allTasks?.filter((task) => {
      if (task.status === 'completed') return false;
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < tomorrow;
    }) ?? [];

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

  const currentStreak = profile?.currentStreak ?? 0;
  const completionRate = stats?.completionRate ?? 0;

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 max-w-5xl mx-auto">

      {/* ── Stats grid ── */}
      <section aria-label="Quick stats">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          {/* Tasks Today */}
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label="Tasks Today"
            value={stats?.dueToday ?? 0}
            sub={
              stats?.overdue ? (
                <span className="text-xs text-[var(--danger)]">
                  {stats.overdue} overdue
                </span>
              ) : (
                <span className="text-xs text-[var(--success)]">On track</span>
              )
            }
          />

          {/* Completion Rate */}
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Completion Rate"
            value={`${completionRate}%`}
            sub={
              <div className="space-y-1">
                <Progress value={completionRate} className="h-1.5" />
                <span className="text-xs text-[var(--text-muted)]">
                  {stats?.completed ?? 0} / {stats?.total ?? 0} tasks
                </span>
              </div>
            }
          />

          {/* Total Nuts */}
          <StatCard
            icon={<Nut className="w-4 h-4 text-[var(--nut-gold)]" />}
            label="Total Nuts"
            value={profile?.totalNuts ?? 0}
            className="border-[var(--nut-gold)]/20"
            sub={
              multiplier > 1 && (
                <Badge
                  variant="warning"
                  className="text-xs px-1.5 py-0"
                >
                  {multiplier}x active
                </Badge>
              )
            }
          />

          {/* Day Streak */}
          <StatCard
            icon={<Flame className="w-4 h-4 text-[var(--streak-fire)]" />}
            label="Day Streak"
            value={currentStreak}
            className="border-[var(--streak-fire)]/20"
            sub={
              <span
                className={cn(
                  'text-xs font-medium',
                  getStreakTierColor(currentStreak)
                )}
              >
                {getStreakTierLabel(currentStreak)}
              </span>
            }
          />

        </div>
      </section>

      {/* ── Today's Tasks ── */}
      <section aria-label="Today's tasks">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Today's Tasks
          </h2>
          <Button size="sm" onClick={() => openTaskForm()}>
            <Plus className="w-3.5 h-3.5" />
            Quick Task
          </Button>
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-tertiary)]">
                <CheckCircle2 className="w-6 h-6 text-[var(--success)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {(allTasks?.length ?? 0) === 0
                    ? 'No tasks yet'
                    : 'All caught up!'}
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {(allTasks?.length ?? 0) === 0
                    ? 'Create your first task to start earning nuts.'
                    : 'No tasks due today. Nice work.'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openTaskForm()}>
                <Nut className="w-3.5 h-3.5" />
                Create Task (+1 nut)
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Quick Actions + Recent Activity (two-column on md+) ── */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Quick Actions */}
        <section aria-label="Quick actions">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              icon={<Plus className="w-5 h-5 text-[var(--accent-primary)]" />}
              iconBg="bg-[var(--accent-primary)]/10"
              label="New Task"
              sub="+1 nut"
              onClick={() => openTaskForm()}
            />
            <QuickActionCard
              icon={<ListTodo className="w-5 h-5 text-[var(--text-secondary)]" />}
              label="All Tasks"
              sub={`${stats?.pending ?? 0} pending`}
              to="/tasks"
            />
            <QuickActionCard
              icon={<TreePine className="w-5 h-5 text-[var(--oak-leaves)]" />}
              iconBg="bg-[var(--oak-leaves)]/10"
              label="Victory Oak"
              sub={`${profile?.totalNuts ?? 0} nuts`}
              to="/victory-oak"
            />
            <QuickActionCard
              icon={<Brain className="w-5 h-5 text-[var(--text-secondary)]" />}
              label="Brain Dump"
              sub="Quick capture"
              to="/stash"
            />
          </div>
        </section>

        {/* Recent Nut Activity */}
        <section aria-label="Recent nut activity">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Recent Nut Activity
          </h2>

          {transactions && transactions.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                {transactions.map((tx, idx) => (
                  <div key={tx.id}>
                    <div className="flex items-center justify-between px-4 py-3">
                      {/* Amount + reason */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-full shrink-0',
                            tx.amount > 0
                              ? 'bg-[var(--success)]/15'
                              : 'bg-[var(--danger)]/15'
                          )}
                        >
                          <Nut
                            className={cn(
                              'w-3.5 h-3.5',
                              tx.amount > 0
                                ? 'text-[var(--success)]'
                                : 'text-[var(--danger)]'
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              'text-sm font-semibold leading-none',
                              tx.amount > 0
                                ? 'text-[var(--success)]'
                                : 'text-[var(--danger)]'
                            )}
                          >
                            {tx.amount > 0 ? '+' : ''}
                            {tx.amount} nuts
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                            {formatReason(tx.reason)}
                          </p>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-[var(--text-muted)] shrink-0 ml-3">
                        {formatDistanceToNow(tx.createdAt, { addSuffix: true })}
                      </span>
                    </div>

                    {idx < transactions.length - 1 && (
                      <Separator className="mx-4 w-auto" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-tertiary)]">
                  <Nut className="w-6 h-6 text-[var(--nut-gold)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Complete tasks to see your nut earnings here.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

      </div>

      {/* ── Task Form Modal ── */}
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
