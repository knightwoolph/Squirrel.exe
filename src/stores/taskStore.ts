import { create } from 'zustand';
import { db, generateId } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Task, TaskList, Subtask, Workspace } from '../types';
import { useGamificationStore } from './gamificationStore';
import { toast } from './toastStore';

interface TaskState {
  selectedTaskId: string | null;
  editingTask: Task | null;
  isFormOpen: boolean;

  // Task actions
  selectTask: (id: string | null) => void;
  openTaskForm: (task?: Task) => void;
  closeTaskForm: () => void;

  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'position' | 'status'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  uncompleteTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Subtask actions
  createSubtask: (taskId: string, title: string) => Promise<string>;
  updateSubtask: (id: string, updates: Partial<Subtask>) => Promise<void>;
  completeSubtask: (id: string) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;

  // TaskList actions
  createTaskList: (workspaceId: string, name: string, description?: string) => Promise<string>;
  updateTaskList: (id: string, updates: Partial<TaskList>) => Promise<void>;
  deleteTaskList: (id: string) => Promise<void>;

  // Workspace actions
  createWorkspace: (name: string, icon?: string, color?: string) => Promise<string>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  selectedTaskId: null,
  editingTask: null,
  isFormOpen: false,

  selectTask: (id) => set({ selectedTaskId: id }),

  openTaskForm: (task) => set({ editingTask: task || null, isFormOpen: true }),
  closeTaskForm: () => set({ editingTask: null, isFormOpen: false }),

  createTask: async (taskData) => {
    const id = generateId();
    const now = new Date();

    // Get position (at end of list)
    const existingTasks = await db.tasks
      .where('taskListId')
      .equals(taskData.taskListId)
      .count();

    await db.tasks.add({
      ...taskData,
      id,
      status: 'pending',
      position: existingTasks,
      createdAt: now,
      updatedAt: now,
    });

    // Award nut for creating task
    await useGamificationStore.getState().onTaskCreate();

    toast.success('Task created!', '+1 nut earned');

    return id;
  },

  updateTask: async (id, updates) => {
    await db.tasks.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  completeTask: async (id) => {
    const task = await db.tasks.get(id);
    if (!task || task.status === 'completed') return;

    await db.tasks.update(id, {
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    });

    // Award nuts for completing task
    await useGamificationStore.getState().onTaskComplete(task.priority);
  },

  uncompleteTask: async (id) => {
    await db.tasks.update(id, {
      status: 'pending',
      completedAt: undefined,
      updatedAt: new Date(),
    });
  },

  deleteTask: async (id) => {
    // Delete subtasks first
    await db.subtasks.where('taskId').equals(id).delete();
    // Delete task
    await db.tasks.delete(id);

    toast.info('Task deleted');
  },

  // Subtask actions
  createSubtask: async (taskId, title) => {
    const id = generateId();
    const existingSubtasks = await db.subtasks
      .where('taskId')
      .equals(taskId)
      .count();

    await db.subtasks.add({
      id,
      taskId,
      title,
      completed: false,
      position: existingSubtasks,
      createdAt: new Date(),
    });

    return id;
  },

  updateSubtask: async (id, updates) => {
    await db.subtasks.update(id, updates);
  },

  completeSubtask: async (id) => {
    const subtask = await db.subtasks.get(id);
    if (!subtask || subtask.completed) return;

    await db.subtasks.update(id, { completed: true });

    // Award nut for completing subtask
    await useGamificationStore.getState().onSubtaskComplete();
  },

  deleteSubtask: async (id) => {
    await db.subtasks.delete(id);
  },

  // TaskList actions
  createTaskList: async (workspaceId, name, description) => {
    const id = generateId();
    const now = new Date();

    const existingLists = await db.taskLists
      .where('workspaceId')
      .equals(workspaceId)
      .count();

    await db.taskLists.add({
      id,
      workspaceId,
      name,
      description,
      position: existingLists,
      createdAt: now,
      updatedAt: now,
    });

    toast.success('Project created!');

    return id;
  },

  updateTaskList: async (id, updates) => {
    await db.taskLists.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  deleteTaskList: async (id) => {
    // This will cascade delete tasks due to schema, but let's be explicit
    const tasks = await db.tasks.where('taskListId').equals(id).toArray();
    for (const task of tasks) {
      await db.subtasks.where('taskId').equals(task.id).delete();
    }
    await db.tasks.where('taskListId').equals(id).delete();
    await db.taskLists.delete(id);

    toast.info('Project deleted');
  },

  // Workspace actions
  createWorkspace: async (name, icon = '📁', color = '#d4a574') => {
    const id = generateId();
    const now = new Date();

    await db.workspaces.add({
      id,
      name,
      icon,
      color,
      createdAt: now,
      updatedAt: now,
    });

    // Create default inbox list
    await db.taskLists.add({
      id: generateId(),
      workspaceId: id,
      name: 'Inbox',
      description: 'Quick capture for new tasks',
      position: 0,
      createdAt: now,
      updatedAt: now,
    });

    toast.success('Workspace created!');

    return id;
  },

  updateWorkspace: async (id, updates) => {
    await db.workspaces.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  deleteWorkspace: async (id) => {
    // Cascade delete everything
    const taskLists = await db.taskLists.where('workspaceId').equals(id).toArray();
    for (const list of taskLists) {
      const tasks = await db.tasks.where('taskListId').equals(list.id).toArray();
      for (const task of tasks) {
        await db.subtasks.where('taskId').equals(task.id).delete();
      }
      await db.tasks.where('taskListId').equals(list.id).delete();
    }
    await db.taskLists.where('workspaceId').equals(id).delete();
    await db.workspaces.delete(id);

    toast.info('Workspace deleted');
  },
}));

// ============================================
// REACT HOOKS FOR LIVE DATA
// ============================================

export function useWorkspaces() {
  return useLiveQuery(() => db.workspaces.orderBy('createdAt').toArray());
}

export function useTaskLists(workspaceId?: string) {
  return useLiveQuery(
    () =>
      workspaceId
        ? db.taskLists.where('workspaceId').equals(workspaceId).sortBy('position')
        : db.taskLists.orderBy('position').toArray(),
    [workspaceId]
  );
}

export function useTasks(taskListId?: string, includeCompleted = true) {
  return useLiveQuery(
    () => {
      let query = taskListId
        ? db.tasks.where('taskListId').equals(taskListId)
        : db.tasks.orderBy('position');

      return query.toArray().then((tasks) => {
        if (!includeCompleted) {
          tasks = tasks.filter((t) => t.status !== 'completed');
        }
        return tasks.sort((a, b) => {
          // Sort by: status (pending first), then priority (high first), then position
          if (a.status !== b.status) {
            return a.status === 'completed' ? 1 : -1;
          }
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return a.position - b.position;
        });
      });
    },
    [taskListId, includeCompleted]
  );
}

export function useTask(taskId: string | null) {
  return useLiveQuery(
    () => (taskId ? db.tasks.get(taskId) : undefined),
    [taskId]
  );
}

export function useSubtasks(taskId: string) {
  return useLiveQuery(
    () => db.subtasks.where('taskId').equals(taskId).sortBy('position'),
    [taskId]
  );
}

export function useTaskStats() {
  return useLiveQuery(async () => {
    const allTasks = await db.tasks.toArray();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === 'completed').length;
    const pending = allTasks.filter((t) => t.status === 'pending').length;
    const overdue = allTasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < today
    ).length;
    const dueToday = allTasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.dueDate &&
        new Date(t.dueDate).toDateString() === today.toDateString()
    ).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, overdue, dueToday, completionRate };
  });
}
