import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, FontMode, AnimationMode } from '../types';

interface AppState {
  // Sidebar state
  sidebarExpanded: boolean;
  sidebarMobileOpen: boolean;

  // Theme & appearance
  theme: Theme;
  fontMode: FontMode;
  animationMode: AnimationMode;

  // UI state
  commandPaletteOpen: boolean;
  quickStashOpen: boolean;

  // Current context
  currentWorkspaceId: string | null;
  currentTaskListId: string | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;

  setTheme: (theme: Theme) => void;
  setFontMode: (fontMode: FontMode) => void;
  setAnimationMode: (animationMode: AnimationMode) => void;

  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  openQuickStash: () => void;
  closeQuickStash: () => void;

  setCurrentWorkspace: (workspaceId: string | null) => void;
  setCurrentTaskList: (taskListId: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarExpanded: false,
      sidebarMobileOpen: false,
      theme: 'warm-forest',
      fontMode: 'default',
      animationMode: 'full',
      commandPaletteOpen: false,
      quickStashOpen: false,
      currentWorkspaceId: null,
      currentTaskListId: null,

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
      toggleMobileSidebar: () => set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),
      closeMobileSidebar: () => set({ sidebarMobileOpen: false }),

      // Theme actions
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      setFontMode: (fontMode) => {
        document.documentElement.setAttribute('data-font-mode', fontMode);
        set({ fontMode });
      },
      setAnimationMode: (animationMode) => {
        document.documentElement.setAttribute('data-animations', animationMode);
        set({ animationMode });
      },

      // Command palette actions
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      // Quick stash actions
      openQuickStash: () => set({ quickStashOpen: true }),
      closeQuickStash: () => set({ quickStashOpen: false }),

      // Context actions
      setCurrentWorkspace: (workspaceId) => set({ currentWorkspaceId: workspaceId }),
      setCurrentTaskList: (taskListId) => set({ currentTaskListId: taskListId }),
    }),
    {
      name: 'sqrl-app-store',
      partialize: (state) => ({
        theme: state.theme,
        fontMode: state.fontMode,
        animationMode: state.animationMode,
        sidebarExpanded: state.sidebarExpanded,
        currentWorkspaceId: state.currentWorkspaceId,
        currentTaskListId: state.currentTaskListId,
      }),
    }
  )
);

// Initialize theme from stored preferences on app load
export function initializeAppearance(): void {
  const stored = localStorage.getItem('sqrl-app-store');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state.theme) {
        document.documentElement.setAttribute('data-theme', state.theme);
      }
      if (state.fontMode) {
        document.documentElement.setAttribute('data-font-mode', state.fontMode);
      }
      if (state.animationMode) {
        document.documentElement.setAttribute('data-animations', state.animationMode);
      }
    } catch {
      // Use defaults if parsing fails
    }
  }
}
