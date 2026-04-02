import { create } from 'zustand';
import { db, generateId } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTaskStore } from './taskStore';
import { toast } from './toastStore';

interface StashState {
  isQuickStashOpen: boolean;
  editingItemId: string | null;

  openQuickStash: () => void;
  closeQuickStash: () => void;

  addStashItem: (content: string) => Promise<string>;
  updateStashItem: (id: string, content: string) => Promise<void>;
  deleteStashItem: (id: string) => Promise<void>;
  markAsProcessed: (id: string) => Promise<void>;
  convertToTask: (id: string, taskListId: string) => Promise<string>;
}

export const useStashStore = create<StashState>((set) => ({
  isQuickStashOpen: false,
  editingItemId: null,

  openQuickStash: () => set({ isQuickStashOpen: true }),
  closeQuickStash: () => set({ isQuickStashOpen: false, editingItemId: null }),

  addStashItem: async (content) => {
    const id = generateId();

    await db.stashItems.add({
      id,
      content,
      createdAt: new Date(),
    });

    toast.success('Stashed!', 'Brain dump saved for later');

    return id;
  },

  updateStashItem: async (id, content) => {
    await db.stashItems.update(id, { content });
  },

  deleteStashItem: async (id) => {
    await db.stashItems.delete(id);
    toast.info('Deleted', 'Stash item removed');
  },

  markAsProcessed: async (id) => {
    await db.stashItems.update(id, {
      processedAt: new Date(),
    });
    toast.success('Processed!', 'Item marked as done');
  },

  convertToTask: async (id, taskListId) => {
    const item = await db.stashItems.get(id);
    if (!item) throw new Error('Stash item not found');

    // Create a task with the stash content as title
    const taskId = await useTaskStore.getState().createTask({
      taskListId,
      title: item.content.slice(0, 100), // Truncate if too long
      description: item.content.length > 100 ? item.content : undefined,
      priority: 3, // Medium priority
    });

    // Mark the stash item as converted
    await db.stashItems.update(id, {
      processedAt: new Date(),
      convertedToTaskId: taskId,
    });

    toast.success('Converted!', 'Brain dump is now a task');

    return taskId;
  },
}));

// ============================================
// REACT HOOKS FOR LIVE DATA
// ============================================

export function useStashItems(includeProcessed = false) {
  return useLiveQuery(async () => {
    let items = await db.stashItems.orderBy('createdAt').reverse().toArray();

    if (!includeProcessed) {
      items = items.filter((item) => !item.processedAt);
    }

    return items;
  }, [includeProcessed]);
}

export function useUnprocessedStashCount() {
  return useLiveQuery(async () => {
    const count = await db.stashItems
      .filter((item) => !item.processedAt)
      .count();
    return count;
  });
}

export function useProcessedStashItems(limit = 20) {
  return useLiveQuery(() =>
    db.stashItems
      .filter((item) => !!item.processedAt)
      .limit(limit)
      .toArray()
  );
}
