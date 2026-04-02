import { create } from 'zustand';
import { db, generateId } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Contact, Deal, DealStage } from '../types';
import { toast } from './toastStore';
import { useConfetti } from '../components/common/Confetti';

interface CRMState {
  // Contact actions
  createContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // Deal actions
  createDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  moveDealToStage: (id: string, stage: DealStage) => Promise<void>;
}

export const useCRMStore = create<CRMState>(() => ({
  // Contact actions
  createContact: async (contactData) => {
    const id = generateId();
    const now = new Date();

    await db.contacts.add({
      ...contactData,
      id,
      createdAt: now,
      updatedAt: now,
    });

    toast.success('Contact created!');
    return id;
  },

  updateContact: async (id, updates) => {
    await db.contacts.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  deleteContact: async (id) => {
    // Also delete associated deals
    await db.deals.where('contactId').equals(id).delete();
    await db.contacts.delete(id);
    toast.info('Contact deleted');
  },

  // Deal actions
  createDeal: async (dealData) => {
    const id = generateId();
    const now = new Date();

    await db.deals.add({
      ...dealData,
      id,
      createdAt: now,
      updatedAt: now,
    });

    toast.success('Deal created!');
    return id;
  },

  updateDeal: async (id, updates) => {
    await db.deals.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  deleteDeal: async (id) => {
    await db.deals.delete(id);
    toast.info('Deal deleted');
  },

  moveDealToStage: async (id, stage) => {
    const deal = await db.deals.get(id);
    if (!deal) return;

    const updates: Partial<Deal> = {
      stage,
      updatedAt: new Date(),
    };

    // Set closed date for won/lost stages
    if (stage === 'won' || stage === 'lost') {
      updates.closedAt = new Date();
    } else {
      updates.closedAt = undefined;
    }

    await db.deals.update(id, updates);

    if (stage === 'won') {
      toast.success('Deal won!', 'Congratulations on closing this deal!');
      useConfetti.getState().trigger();
    } else if (stage === 'lost') {
      toast.info('Deal lost', 'Better luck next time');
    }
  },
}));

// ============================================
// REACT HOOKS FOR LIVE DATA
// ============================================

export function useContacts(workspaceId?: string) {
  return useLiveQuery(
    () =>
      workspaceId
        ? db.contacts.where('workspaceId').equals(workspaceId).sortBy('name')
        : db.contacts.orderBy('name').toArray(),
    [workspaceId]
  );
}

export function useContact(id: string | null) {
  return useLiveQuery(() => (id ? db.contacts.get(id) : undefined), [id]);
}

export function useDeals(workspaceId?: string, stage?: DealStage) {
  return useLiveQuery(
    async () => {
      let deals = workspaceId
        ? await db.deals.where('workspaceId').equals(workspaceId).toArray()
        : await db.deals.toArray();

      if (stage) {
        deals = deals.filter((d) => d.stage === stage);
      }

      // Sort by value descending
      return deals.sort((a, b) => (b.value || 0) - (a.value || 0));
    },
    [workspaceId, stage]
  );
}

export function useDeal(id: string | null) {
  return useLiveQuery(() => (id ? db.deals.get(id) : undefined), [id]);
}

export function useDealsByStage(workspaceId?: string) {
  return useLiveQuery(async () => {
    const deals = workspaceId
      ? await db.deals.where('workspaceId').equals(workspaceId).toArray()
      : await db.deals.toArray();

    const stages: DealStage[] = ['lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];
    const result: Record<DealStage, Deal[]> = {
      lead: [],
      contacted: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    };

    for (const deal of deals) {
      result[deal.stage].push(deal);
    }

    // Sort each stage by value
    for (const stage of stages) {
      result[stage].sort((a, b) => (b.value || 0) - (a.value || 0));
    }

    return result;
  }, [workspaceId]);
}

export function useDealStats(workspaceId?: string) {
  return useLiveQuery(async () => {
    const deals = workspaceId
      ? await db.deals.where('workspaceId').equals(workspaceId).toArray()
      : await db.deals.toArray();

    const total = deals.length;
    const open = deals.filter((d) => !['won', 'lost'].includes(d.stage)).length;
    const won = deals.filter((d) => d.stage === 'won').length;
    const lost = deals.filter((d) => d.stage === 'lost').length;

    const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
    const wonValue = deals.filter((d) => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0);
    const pipelineValue = deals.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((sum, d) => sum + (d.value || 0), 0);

    const winRate = total > 0 ? Math.round((won / (won + lost || 1)) * 100) : 0;

    return { total, open, won, lost, totalValue, wonValue, pipelineValue, winRate };
  }, [workspaceId]);
}
