// ============================================
// CORE TYPES
// ============================================

export type Theme = 'warm-forest' | 'modern-minimal' | 'cozy-dark';
export type FontMode = 'default' | 'simple' | 'fancy';
export type AnimationMode = 'full' | 'reduced' | 'none';

export type Priority = 1 | 2 | 3 | 4 | 5; // 1=someday, 5=critical
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type TimerMode = 'focus' | 'short-break' | 'long-break';

export type DealStage = 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost';

export type NutReason =
  | 'task_complete'
  | 'subtask_complete'
  | 'task_create'
  | 'timer_session'
  | 'streak_bonus'
  | 'comeback'
  | 'purchase'
  | 'bonus';

// ============================================
// WORKSPACE & TASK ENTITIES
// ============================================

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskList {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  taskListId: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: Date;
  completedAt?: Date;
  estimatedMinutes?: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
}

// ============================================
// GAMIFICATION ENTITIES
// ============================================

export interface UserProfile {
  id: string; // Always 'default' for single-user local app
  displayName?: string;
  squirrelName?: string;
  currentSkin: string;
  totalNuts: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string; // YYYY-MM-DD format
  theme?: Theme;
  fontMode?: FontMode;
  animationsEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutTransaction {
  id: string;
  amount: number;
  reason: NutReason;
  multiplier: number;
  sourceType: 'task' | 'subtask' | 'timer' | 'comeback' | 'bonus' | 'purchase';
  sourceId?: string;
  createdAt: Date;
}

export interface UnlockedSkin {
  id: string;
  skinId: string;
  unlockedAt: Date;
  nutsCost: number;
}

// ============================================
// TIMER ENTITIES
// ============================================

export interface TimerSession {
  id: string;
  taskId?: string;
  mode: TimerMode;
  durationSeconds: number;
  completed: boolean;
  startedAt: Date;
  endedAt?: Date;
  nutsEarned?: number;
}

// ============================================
// STASH (BRAIN DUMP) ENTITIES
// ============================================

export interface StashItem {
  id: string;
  content: string;
  createdAt: Date;
  processedAt?: Date;
  convertedToTaskId?: string;
}

// ============================================
// CRM ENTITIES
// ============================================

export interface Contact {
  id: string;
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  notes?: string;
  tags?: string[];
  lastContactDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  workspaceId: string;
  contactId?: string;
  title: string;
  value?: number;
  stage: DealStage;
  probability?: number;
  expectedCloseDate?: Date;
  closedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SKIN DEFINITIONS
// ============================================

export interface Skin {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description?: string;
}

// Alias for backwards compatibility
export type SkinDefinition = Skin;

export const SKINS: Record<string, SkinDefinition> = {
  default: { id: 'default', name: 'Default Squirrel', emoji: '🐿️', cost: 0, description: 'The classic nutty friend' },
  business: { id: 'business', name: 'Business Squirrel', emoji: '🎩', cost: 100, description: 'Ready for the boardroom' },
  cozy: { id: 'cozy', name: 'Cozy Squirrel', emoji: '🧣', cost: 150, description: 'Wrapped up warm' },
  'night-owl': { id: 'night-owl', name: 'Night Owl', emoji: '🦉', cost: 200, description: 'Burns the midnight oil' },
  golden: { id: 'golden', name: 'Golden Squirrel', emoji: '✨', cost: 500, description: 'Absolutely radiant' },
  ninja: { id: 'ninja', name: 'Ninja Squirrel', emoji: '🥷', cost: 500, description: 'Silent but deadly productive' },
  astronaut: { id: 'astronaut', name: 'Astro Squirrel', emoji: '🚀', cost: 1000, description: 'Reaching for the stars' },
};
