import { create } from 'zustand';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { NutReason, Priority } from '../types';
import {
  NUT_REWARDS,
  calculateNutsEarned,
  calculateStreakMultiplier,
  getTodayDateString,
  isStreakBroken,
} from '../utils/gamification';
import { toast } from './toastStore';
import { useConfetti } from '../components/common/Confetti';

interface GamificationState {
  // Computed getters (from hooks)
  // Actions
  earnNuts: (amount: number, reason: NutReason, sourceId?: string) => Promise<number>;
  spendNuts: (amount: number, reason: NutReason, sourceId?: string) => Promise<boolean>;
  checkStreak: () => Promise<{ isBroken: boolean; wasStreak: number }>;
  updateStreak: () => Promise<void>;
  unlockSkin: (skinId: string, cost: number) => Promise<boolean>;
  setActiveSkin: (skinId: string) => Promise<void>;

  // Task-related nut actions
  onTaskCreate: () => Promise<void>;
  onTaskComplete: (priority: Priority) => Promise<void>;
  onSubtaskComplete: () => Promise<void>;
  onTimerComplete: () => Promise<void>;
  onComebackComplete: () => Promise<void>;
}

export const useGamificationStore = create<GamificationState>(() => ({
  earnNuts: async (amount, reason, sourceId) => {
    const profile = await db.userProfile.get('default');
    if (!profile) return 0;

    const { nuts, multiplier } = calculateNutsEarned(amount, profile.currentStreak);

    // Update profile
    await db.userProfile.update('default', {
      totalNuts: profile.totalNuts + nuts,
      updatedAt: new Date(),
    });

    // Record transaction
    await db.nutTransactions.add({
      id: crypto.randomUUID(),
      amount: nuts,
      reason,
      multiplier,
      sourceType: reason === 'task_complete' ? 'task' :
                  reason === 'subtask_complete' ? 'subtask' :
                  reason === 'timer_session' ? 'timer' :
                  reason === 'comeback' ? 'comeback' : 'bonus',
      sourceId,
      createdAt: new Date(),
    });

    // Show toast
    const multiplierText = multiplier > 1 ? ` (${multiplier}x streak bonus!)` : '';
    toast.nut(`+${nuts} Nuts!`, `${reason.replace('_', ' ')}${multiplierText}`);

    return nuts;
  },

  spendNuts: async (amount, reason, sourceId) => {
    const profile = await db.userProfile.get('default');
    if (!profile || profile.totalNuts < amount) return false;

    // Update profile
    await db.userProfile.update('default', {
      totalNuts: profile.totalNuts - amount,
      updatedAt: new Date(),
    });

    // Record transaction (negative amount)
    await db.nutTransactions.add({
      id: crypto.randomUUID(),
      amount: -amount,
      reason,
      multiplier: 1,
      sourceType: 'purchase',
      sourceId,
      createdAt: new Date(),
    });

    return true;
  },

  checkStreak: async () => {
    const profile = await db.userProfile.get('default');
    if (!profile) return { isBroken: false, wasStreak: 0 };

    const isBroken = isStreakBroken(profile.lastActiveDate);

    return {
      isBroken,
      wasStreak: isBroken ? profile.currentStreak : 0,
    };
  },

  updateStreak: async () => {
    const profile = await db.userProfile.get('default');
    if (!profile) return;

    const today = getTodayDateString();

    // Already active today
    if (profile.lastActiveDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak: number;

    if (profile.lastActiveDate === yesterdayStr) {
      // Consecutive day - increment streak
      newStreak = profile.currentStreak + 1;
    } else if (!profile.lastActiveDate) {
      // First ever activity
      newStreak = 1;
    } else {
      // Streak broken (handled elsewhere), start fresh
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, profile.longestStreak);

    await db.userProfile.update('default', {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
      updatedAt: new Date(),
    });

    // Celebrate streak milestones
    if (newStreak === 7) {
      toast.success('7 Day Streak!', 'You now earn 1.5x nuts!');
    } else if (newStreak === 14) {
      toast.success('14 Day Streak!', 'You now earn 2x nuts!');
    } else if (newStreak === 30) {
      toast.success('30 Day Streak!', 'You now earn 3x nuts! LEGENDARY!');
    }
  },

  unlockSkin: async (skinId, cost) => {
    const profile = await db.userProfile.get('default');
    if (!profile || profile.totalNuts < cost) return false;

    // Check if already unlocked
    const existing = await db.unlockedSkins.where('skinId').equals(skinId).first();
    if (existing) return false;

    // Spend nuts
    const spent = await useGamificationStore.getState().spendNuts(cost, 'purchase', skinId);
    if (!spent) return false;

    // Unlock skin
    await db.unlockedSkins.add({
      id: crypto.randomUUID(),
      skinId,
      unlockedAt: new Date(),
      nutsCost: cost,
    });

    toast.success('Skin Unlocked!', `You unlocked a new squirrel skin!`);

    return true;
  },

  setActiveSkin: async (skinId) => {
    await db.userProfile.update('default', {
      currentSkin: skinId,
      updatedAt: new Date(),
    });
  },

  // Convenience methods for common actions
  onTaskCreate: async () => {
    await useGamificationStore.getState().updateStreak();
    await useGamificationStore.getState().earnNuts(NUT_REWARDS.TASK_CREATE, 'task_create');
  },

  onTaskComplete: async (priority) => {
    await useGamificationStore.getState().updateStreak();
    const baseNuts = NUT_REWARDS.TASK_COMPLETE[priority];
    await useGamificationStore.getState().earnNuts(baseNuts, 'task_complete');

    // Trigger confetti celebration!
    useConfetti.getState().trigger();
  },

  onSubtaskComplete: async () => {
    await useGamificationStore.getState().updateStreak();
    await useGamificationStore.getState().earnNuts(NUT_REWARDS.SUBTASK_COMPLETE, 'subtask_complete');
  },

  onTimerComplete: async () => {
    await useGamificationStore.getState().updateStreak();
    await useGamificationStore.getState().earnNuts(NUT_REWARDS.TIMER_SESSION, 'timer_session');

    // Trigger confetti for completing a focus session!
    useConfetti.getState().trigger();
  },

  onComebackComplete: async () => {
    // Reset streak to 1 and award bonus
    await db.userProfile.update('default', {
      currentStreak: 1,
      lastActiveDate: getTodayDateString(),
      updatedAt: new Date(),
    });
    await useGamificationStore.getState().earnNuts(NUT_REWARDS.COMEBACK_BONUS, 'comeback');
  },
}));

// ============================================
// REACT HOOKS FOR LIVE DATA
// ============================================

export function useProfile() {
  return useLiveQuery(() => db.userProfile.get('default'));
}

export function useUnlockedSkins() {
  return useLiveQuery(() => db.unlockedSkins.toArray());
}

export function useNutTransactions(limit = 20) {
  return useLiveQuery(() =>
    db.nutTransactions.orderBy('createdAt').reverse().limit(limit).toArray()
  );
}

export function useStreakMultiplier() {
  const profile = useProfile();
  return profile ? calculateStreakMultiplier(profile.currentStreak) : 1;
}
