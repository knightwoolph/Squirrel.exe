import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'nut';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  icon?: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const DEFAULT_DURATION = 4000;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? DEFAULT_DURATION;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, message, icon: '✓' }),

  error: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, message, icon: '✕' }),

  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, message, icon: '⚠️' }),

  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, message, icon: 'ℹ' }),

  nut: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'nut', title, message, icon: '🥜', duration: 3000 }),
};
