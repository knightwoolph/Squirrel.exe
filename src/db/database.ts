import Dexie, { type Table } from 'dexie';
import type {
  Workspace,
  TaskList,
  Task,
  Subtask,
  UserProfile,
  NutTransaction,
  UnlockedSkin,
  TimerSession,
  StashItem,
  Contact,
  Deal,
} from '../types';

export class SqrlDatabase extends Dexie {
  // Tables
  workspaces!: Table<Workspace>;
  taskLists!: Table<TaskList>;
  tasks!: Table<Task>;
  subtasks!: Table<Subtask>;
  userProfile!: Table<UserProfile>;
  nutTransactions!: Table<NutTransaction>;
  unlockedSkins!: Table<UnlockedSkin>;
  timerSessions!: Table<TimerSession>;
  stashItems!: Table<StashItem>;
  contacts!: Table<Contact>;
  deals!: Table<Deal>;

  constructor() {
    super('sqrl-exe');

    this.version(1).stores({
      // Workspace & Task Management
      workspaces: 'id, name, createdAt',
      taskLists: 'id, workspaceId, name, position, createdAt',
      tasks: 'id, taskListId, status, priority, dueDate, position, createdAt, completedAt',
      subtasks: 'id, taskId, position, createdAt',

      // Gamification
      userProfile: 'id',
      nutTransactions: 'id, reason, sourceType, createdAt',
      unlockedSkins: 'id, skinId, unlockedAt',

      // Timer
      timerSessions: 'id, taskId, mode, startedAt, completed',

      // Stash (Brain Dump)
      stashItems: 'id, createdAt, processedAt',

      // CRM
      contacts: 'id, workspaceId, name, email, company, createdAt',
      deals: 'id, workspaceId, contactId, stage, createdAt',
    });
  }
}

export const db = new SqrlDatabase();

// ============================================
// DATABASE INITIALIZATION
// ============================================

export async function initializeDatabase(): Promise<void> {
  // Check if user profile exists, create default if not
  const profile = await db.userProfile.get('default');

  if (!profile) {
    const now = new Date();
    await db.userProfile.add({
      id: 'default',
      displayName: 'Nutkin',
      currentSkin: 'default',
      totalNuts: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      theme: 'warm-forest',
      fontMode: 'default',
      animationsEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    // Unlock default skin
    await db.unlockedSkins.add({
      id: crypto.randomUUID(),
      skinId: 'default',
      unlockedAt: now,
      nutsCost: 0,
    });
  }

  // Check if default workspace exists
  const workspaces = await db.workspaces.count();

  if (workspaces === 0) {
    const now = new Date();
    const workspaceId = crypto.randomUUID();

    await db.workspaces.add({
      id: workspaceId,
      name: 'Personal',
      icon: '🏠',
      color: '#d4a574',
      createdAt: now,
      updatedAt: now,
    });

    // Create default task list
    await db.taskLists.add({
      id: crypto.randomUUID(),
      workspaceId: workspaceId,
      name: 'Inbox',
      description: 'Quick capture for new tasks',
      position: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generateId(): string {
  return crypto.randomUUID();
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
