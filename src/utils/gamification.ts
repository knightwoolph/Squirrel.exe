import type { Priority, NutReason } from '../types';

// Nut rewards for different actions
export const NUT_REWARDS = {
  TASK_CREATE: 1,
  TASK_COMPLETE: {
    1: 3, // Someday
    2: 4, // Low
    3: 5, // Medium
    4: 6, // High
    5: 8, // Critical
  } as Record<Priority, number>,
  SUBTASK_COMPLETE: 1,
  TIMER_SESSION: 2,
  COMEBACK_BONUS: 5,
} as const;

// Streak multiplier thresholds
export const STREAK_MULTIPLIERS = [
  { minDays: 30, multiplier: 3.0 },
  { minDays: 14, multiplier: 2.0 },
  { minDays: 7, multiplier: 1.5 },
  { minDays: 0, multiplier: 1.0 },
];

export function calculateStreakMultiplier(streakDays: number): number {
  for (const { minDays, multiplier } of STREAK_MULTIPLIERS) {
    if (streakDays >= minDays) {
      return multiplier;
    }
  }
  return 1.0;
}

export function calculateNutsEarned(
  baseAmount: number,
  streakDays: number
): { nuts: number; multiplier: number } {
  const multiplier = calculateStreakMultiplier(streakDays);
  return {
    nuts: Math.floor(baseAmount * multiplier),
    multiplier,
  };
}

export function getReasonLabel(reason: NutReason): string {
  const labels: Record<NutReason, string> = {
    task_complete: 'Task completed',
    subtask_complete: 'Subtask completed',
    task_create: 'Task created',
    timer_session: 'Timer session',
    streak_bonus: 'Streak bonus',
    comeback: 'Comeback challenge',
    purchase: 'Skin purchase',
    bonus: 'Bonus',
  };
  return labels[reason];
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function isStreakActive(lastActiveDate: string | undefined): boolean {
  if (!lastActiveDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = new Date(lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

  // Streak is active if last activity was today or yesterday
  return diffDays <= 1;
}

export function isStreakBroken(lastActiveDate: string | undefined): boolean {
  if (!lastActiveDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = new Date(lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

  // Streak is broken if more than 1 day has passed
  return diffDays > 1;
}
