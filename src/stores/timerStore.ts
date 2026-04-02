import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, generateId } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useGamificationStore } from './gamificationStore';
import { toast } from './toastStore';
import type { TimerMode } from '../types';

export type { TimerMode };

interface TimerState {
  // Timer settings
  focusDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;

  // Current session state
  mode: TimerMode;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  sessionsCompleted: number;
  currentTaskId: string | null;

  // Actions
  setFocusDuration: (minutes: number) => void;
  setShortBreakDuration: (minutes: number) => void;
  setLongBreakDuration: (minutes: number) => void;
  setSessionsUntilLongBreak: (count: number) => void;
  setAutoStartBreaks: (enabled: boolean) => void;
  setAutoStartFocus: (enabled: boolean) => void;

  setCurrentTask: (taskId: string | null) => void;
  setMode: (mode: TimerMode) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  completeSession: () => Promise<void>;
}

const DEFAULT_FOCUS = 25;
const DEFAULT_SHORT_BREAK = 5;
const DEFAULT_LONG_BREAK = 15;
const DEFAULT_SESSIONS = 4;

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Settings
      focusDuration: DEFAULT_FOCUS,
      shortBreakDuration: DEFAULT_SHORT_BREAK,
      longBreakDuration: DEFAULT_LONG_BREAK,
      sessionsUntilLongBreak: DEFAULT_SESSIONS,
      autoStartBreaks: false,
      autoStartFocus: false,

      // Session state
      mode: 'focus',
      timeRemaining: DEFAULT_FOCUS * 60,
      isRunning: false,
      isPaused: false,
      sessionsCompleted: 0,
      currentTaskId: null,

      // Setting actions
      setFocusDuration: (minutes) => {
        set({ focusDuration: minutes });
        if (get().mode === 'focus' && !get().isRunning) {
          set({ timeRemaining: minutes * 60 });
        }
      },

      setShortBreakDuration: (minutes) => {
        set({ shortBreakDuration: minutes });
        if (get().mode === 'short-break' && !get().isRunning) {
          set({ timeRemaining: minutes * 60 });
        }
      },

      setLongBreakDuration: (minutes) => {
        set({ longBreakDuration: minutes });
        if (get().mode === 'long-break' && !get().isRunning) {
          set({ timeRemaining: minutes * 60 });
        }
      },

      setSessionsUntilLongBreak: (count) => set({ sessionsUntilLongBreak: count }),
      setAutoStartBreaks: (enabled) => set({ autoStartBreaks: enabled }),
      setAutoStartFocus: (enabled) => set({ autoStartFocus: enabled }),

      setCurrentTask: (taskId) => set({ currentTaskId: taskId }),

      setMode: (mode) => {
        const state = get();
        let duration: number;

        switch (mode) {
          case 'focus':
            duration = state.focusDuration;
            break;
          case 'short-break':
            duration = state.shortBreakDuration;
            break;
          case 'long-break':
            duration = state.longBreakDuration;
            break;
        }

        set({
          mode,
          timeRemaining: duration * 60,
          isRunning: false,
          isPaused: false,
        });
      },

      start: () => set({ isRunning: true, isPaused: false }),
      pause: () => set({ isRunning: false, isPaused: true }),
      resume: () => set({ isRunning: true, isPaused: false }),

      reset: () => {
        const state = get();
        let duration: number;

        switch (state.mode) {
          case 'focus':
            duration = state.focusDuration;
            break;
          case 'short-break':
            duration = state.shortBreakDuration;
            break;
          case 'long-break':
            duration = state.longBreakDuration;
            break;
        }

        set({
          timeRemaining: duration * 60,
          isRunning: false,
          isPaused: false,
        });
      },

      skip: () => {
        const state = get();

        if (state.mode === 'focus') {
          // Skip to break
          const newSessionsCompleted = state.sessionsCompleted + 1;
          const isLongBreak = newSessionsCompleted % state.sessionsUntilLongBreak === 0;

          set({
            mode: isLongBreak ? 'long-break' : 'short-break',
            timeRemaining: (isLongBreak ? state.longBreakDuration : state.shortBreakDuration) * 60,
            sessionsCompleted: newSessionsCompleted,
            isRunning: false,
            isPaused: false,
          });
        } else {
          // Skip to focus
          set({
            mode: 'focus',
            timeRemaining: state.focusDuration * 60,
            isRunning: false,
            isPaused: false,
          });
        }
      },

      tick: () => {
        const state = get();
        if (!state.isRunning) return;

        const newTime = state.timeRemaining - 1;

        if (newTime <= 0) {
          // Timer completed
          get().completeSession();
        } else {
          set({ timeRemaining: newTime });
        }
      },

      completeSession: async () => {
        const state = get();

        if (state.mode === 'focus') {
          // Save the session to database
          const sessionId = generateId();
          const duration = state.focusDuration;

          await db.timerSessions.add({
            id: sessionId,
            taskId: state.currentTaskId || undefined,
            mode: 'focus',
            durationSeconds: duration * 60,
            completed: true,
            startedAt: new Date(Date.now() - duration * 60 * 1000),
            endedAt: new Date(),
          });

          // Award nuts for completing a timer session
          await useGamificationStore.getState().onTimerComplete();

          toast.success('Focus session complete!', '+2 nuts earned');

          // Determine next break
          const newSessionsCompleted = state.sessionsCompleted + 1;
          const isLongBreak = newSessionsCompleted % state.sessionsUntilLongBreak === 0;
          const nextMode: TimerMode = isLongBreak ? 'long-break' : 'short-break';
          const nextDuration = isLongBreak ? state.longBreakDuration : state.shortBreakDuration;

          set({
            mode: nextMode,
            timeRemaining: nextDuration * 60,
            sessionsCompleted: newSessionsCompleted,
            isRunning: state.autoStartBreaks,
            isPaused: false,
          });

          // Play notification sound (browser notification)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus session complete!', {
              body: isLongBreak ? 'Time for a long break!' : 'Time for a short break!',
              icon: '/favicon.ico',
            });
          }
        } else {
          // Break completed
          toast.info('Break over!', 'Ready to focus again?');

          set({
            mode: 'focus',
            timeRemaining: state.focusDuration * 60,
            isRunning: state.autoStartFocus,
            isPaused: false,
          });

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Break over!', {
              body: 'Ready to focus again?',
              icon: '/favicon.ico',
            });
          }
        }
      },
    }),
    {
      name: 'sqrl-timer',
      partialize: (state) => ({
        focusDuration: state.focusDuration,
        shortBreakDuration: state.shortBreakDuration,
        longBreakDuration: state.longBreakDuration,
        sessionsUntilLongBreak: state.sessionsUntilLongBreak,
        autoStartBreaks: state.autoStartBreaks,
        autoStartFocus: state.autoStartFocus,
      }),
    }
  )
);

// Hook for timer sessions history
export function useTimerSessions(limit = 10) {
  return useLiveQuery(() =>
    db.timerSessions.orderBy('completedAt').reverse().limit(limit).toArray()
  );
}

// Hook for today's sessions count
export function useTodaysSessions() {
  return useLiveQuery(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await db.timerSessions
      .where('startedAt')
      .aboveOrEqual(today)
      .toArray();

    return {
      count: sessions.filter((s) => s.completed && s.mode === 'focus').length,
      totalMinutes: Math.floor(
        sessions
          .filter((s) => s.completed && s.mode === 'focus')
          .reduce((sum, s) => sum + s.durationSeconds, 0) / 60
      ),
    };
  });
}
