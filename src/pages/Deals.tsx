import { useState } from 'react';
import {
  useCRMStore,
  useDealsByStage,
  useDealStats,
  useContacts,
} from '../stores/crmStore';
import { useWorkspaces } from '../stores/taskStore';
import type { Deal, DealStage } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

import {
  DollarSign,
  TrendingUp,
  Award,
  Plus,
  ArrowRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Briefcase,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

// ── Stage definitions ─────────────────────────────────────────────────────────
interface StageConfig {
  id: DealStage;
  name: string;
  color: string;       // Tailwind bg class for column accent
  badgeClass: string;  // Badge color override
  dotClass: string;    // Dot indicator
}

const STAGES: StageConfig[] = [
  {
    id: 'lead',
    name: 'Lead',
    color: 'border-t-slate-400',
    badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    dotClass: 'bg-slate-400',
  },
  {
    id: 'contacted',
    name: 'Contacted',
    color: 'border-t-blue-400',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    dotClass: 'bg-blue-400',
  },
  {
    id: 'proposal',
    name: 'Proposal',
    color: 'border-t-violet-400',
    badgeClass: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    dotClass: 'bg-violet-400',
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    color: 'border-t-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-400',
  },
  {
    id: 'won',
    name: 'Won',
    color: 'border-t-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-400',
  },
  {
    id: 'lost',
    name: 'Lost',
    color: 'border-t-red-400',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/20',
    dotClass: 'bg-red-400',
  },
];

function getStageConfig(id: DealStage): StageConfig {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

// ── Currency formatter ────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
  subtext?: string;
}

function StatCard({ label, value, icon, accent, subtext }: StatCardProps) {
  return (
    <Card className="border-[var(--border-default)] bg-[var(--bg-secondary)]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {label}
            </p>
            <p className={cn('mt-1 text-2xl font-bold', accent ?? 'text-[var(--text-primary)]')}>
              {value}
            </p>
            {subtext && (
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtext}</p>
            )}
          </div>
          <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Deal form ─────────────────────────────────────────────────────────────────
interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Deal | null;
  contacts: { id: string; name: string; company?: string }[];
  workspaceId: string;
  onSubmit: (data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

function DealForm({
  open,
  onOpenChange,
  editing,
  contacts,
  workspaceId,
  onSubmit,
}: DealFormProps) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [value, setValue] = useState(editing?.value?.toString() ?? '');
  const [contactId, setContactId] = useState(editing?.contactId ?? '');
  const [stage, setStage] = useState<DealStage>(editing?.stage ?? 'lead');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    editing?.expectedCloseDate
      ? new Date(editing.expectedCloseDate).toISOString().split('T')[0]
      : ''
  );
  const [saving, setSaving] = useState(false);

  const resetForm = (d: Deal | null) => {
    setTitle(d?.title ?? '');
    setValue(d?.value?.toString() ?? '');
    setContactId(d?.contactId ?? '');
    setStage(d?.stage ?? 'lead');
    setNotes(d?.notes ?? '');
    setExpectedCloseDate(
      d?.expectedCloseDate
        ? new Date(d.expectedCloseDate).toISOString().split('T')[0]
        : ''
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm(null);
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        workspaceId,
        title: title.trim(),
        value: value ? parseFloat(value) : undefined,
        contactId: contactId || undefined,
        stage,
        notes: notes.trim() || undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        probability: editing?.probability,
        closedAt: editing?.closedAt,
      });
      handleOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Deal' : 'New Deal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="df-title">
              Title <span className="text-[var(--danger)]">*</span>
            </Label>
            <Input
              id="df-title"
              placeholder="e.g., Website Redesign Project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Value / Stage */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="df-value">Value ($)</Label>
              <Input
                id="df-value"
                type="number"
                min="0"
                step="any"
                placeholder="10000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="df-stage">Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
                <SelectTrigger id="df-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact / Close Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="df-contact">Contact</Label>
              <Select
                value={contactId || '__none__'}
                onValueChange={(v) => setContactId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger id="df-contact">
                  <SelectValue placeholder="No contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No contact</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` (${c.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="df-close-date">Expected Close</Label>
              <Input
                id="df-close-date"
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="df-notes">Notes</Label>
            <Textarea
              id="df-notes"
              placeholder="Add any notes about this deal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Deal detail dialog ────────────────────────────────────────────────────────
interface DealDetailProps {
  deal: Deal | null;
  onClose: () => void;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  onMoveStage: (id: string, stage: DealStage) => Promise<void>;
  getContactName: (contactId?: string) => string | null;
}

function DealDetail({
  deal,
  onClose,
  onEdit,
  onDelete,
  onMoveStage,
  getContactName,
}: DealDetailProps) {
  const [localStage, setLocalStage] = useState<DealStage | null>(null);
  const effectiveStage = localStage ?? deal?.stage ?? 'lead';
  const stageConfig = getStageConfig(effectiveStage);

  if (!deal) return null;

  const handleMove = async (newStage: DealStage) => {
    setLocalStage(newStage);
    await onMoveStage(deal.id, newStage);
  };

  const otherStages = STAGES.filter((s) => s.id !== effectiveStage);

  return (
    <Dialog
      open={!!deal}
      onOpenChange={(open) => {
        if (!open) {
          setLocalStage(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6">{deal.title}</DialogTitle>
        </DialogHeader>

        {/* Value + stage */}
        <div className="flex items-center gap-3">
          {deal.value !== undefined && (
            <span className="text-2xl font-bold text-emerald-400">
              {formatCurrencyFull(deal.value)}
            </span>
          )}
          <Badge
            variant="outline"
            className={cn('border font-medium', stageConfig.badgeClass)}
          >
            <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', stageConfig.dotClass)} />
            {stageConfig.name}
          </Badge>
        </div>

        <Separator />

        {/* Move to stage */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Move to stage
          </p>
          <div className="flex flex-wrap gap-1.5">
            {otherStages.map((s) => (
              <Button
                key={s.id}
                variant="outline"
                size="sm"
                className={cn(
                  'h-7 gap-1.5 text-xs',
                  s.id === 'won' &&
                    'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
                  s.id === 'lost' &&
                    'border-red-500/30 text-red-400 hover:bg-red-500/10'
                )}
                onClick={() => handleMove(s.id)}
              >
                <ArrowRight className="h-3 w-3" />
                {s.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Meta */}
        <div className="flex flex-col gap-2.5">
          {getContactName(deal.contactId) && (
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <User className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span>{getContactName(deal.contactId)}</span>
            </div>
          )}
          {deal.expectedCloseDate && (
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <CalendarDays className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span>
                Expected close:{' '}
                {new Date(deal.expectedCloseDate).toLocaleDateString()}
              </span>
            </div>
          )}
          {deal.closedAt && (
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              {effectiveStage === 'won' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
              )}
              <span>Closed: {new Date(deal.closedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {deal.notes && (
          <>
            <Separator />
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Notes
              </p>
              <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                {deal.notes}
              </p>
            </div>
          </>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          Created {formatDistanceToNow(deal.createdAt, { addSuffix: true })}
        </p>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(deal.id)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setLocalStage(null);
              onClose();
              onEdit(deal);
            }}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Deal card ─────────────────────────────────────────────────────────────────
interface DealCardProps {
  deal: Deal;
  contactName: string | null;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveStage: (stage: DealStage) => void;
}

function DealCard({
  deal,
  contactName,
  onClick,
  onEdit,
  onDelete,
  onMoveStage,
}: DealCardProps) {
  const nextStageIndex = STAGES.findIndex((s) => s.id === deal.stage) + 1;
  const nextStage = nextStageIndex < STAGES.length ? STAGES[nextStageIndex] : null;

  return (
    <Card
      className="group cursor-pointer border-[var(--border-default)] bg-[var(--bg-primary)] transition-all hover:border-[var(--border-hover)] hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 flex-1 text-sm font-medium text-[var(--text-primary)]">
            {deal.title}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {nextStage && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveStage(nextStage.id);
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                  Move to {nextStage.name}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[var(--danger)] focus:text-[var(--danger)]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {deal.value !== undefined && (
          <p className="mt-1.5 text-sm font-bold text-emerald-400">
            {formatCurrencyFull(deal.value)}
          </p>
        )}

        {contactName && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{contactName}</span>
          </div>
        )}

        {deal.expectedCloseDate && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function Deals() {
  const workspaces = useWorkspaces();
  const defaultWorkspaceId = workspaces?.[0]?.id ?? '';
  const dealsByStage = useDealsByStage(defaultWorkspaceId);
  const stats = useDealStats(defaultWorkspaceId);
  const contacts = useContacts(defaultWorkspaceId);
  const { createDeal, updateDeal, deleteDeal, moveDealToStage } = useCRMStore();

  const [isFormOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showClosedDeals, setShowClosedDeals] = useState(false);

  const activeStages = showClosedDeals
    ? STAGES
    : STAGES.filter((s) => s.id !== 'won' && s.id !== 'lost');

  const getContactName = (contactId?: string): string | null => {
    if (!contactId) return null;
    return contacts?.find((c) => c.id === contactId)?.name ?? null;
  };

  const openForm = (deal?: Deal) => {
    setEditingDeal(deal ?? null);
    setFormOpen(true);
  };

  const handleSubmit = async (
    data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingDeal) {
      await updateDeal(editingDeal.id, data);
    } else {
      await createDeal(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this deal?')) return;
    await deleteDeal(id);
    setSelectedDeal(null);
  };

  const handleMoveStage = async (dealId: string, newStage: DealStage) => {
    await moveDealToStage(dealId, newStage);
    // Keep modal open with updated stage (the live query will re-render the card)
  };

  const pipelineValue = stats?.pipelineValue ?? 0;
  const wonValue = stats?.wonValue ?? 0;
  const winRate = stats?.winRate ?? 0;
  const activeDeals = stats?.open ?? 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Deal Pipeline</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {activeDeals} active deal{activeDeals !== 1 ? 's' : ''} in pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="show-closed"
              checked={showClosedDeals}
              onCheckedChange={setShowClosedDeals}
            />
            <Label
              htmlFor="show-closed"
              className="cursor-pointer text-sm text-[var(--text-secondary)]"
            >
              Show closed
            </Label>
          </div>
          <Button onClick={() => openForm()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(pipelineValue)}
          icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
          subtext={`${activeDeals} open deals`}
        />
        <StatCard
          label="Won Total"
          value={formatCurrency(wonValue)}
          icon={<Award className="h-5 w-5 text-emerald-400" />}
          accent="text-emerald-400"
          subtext={`${stats?.won ?? 0} deals closed`}
        />
        <StatCard
          label="Active Deals"
          value={String(activeDeals)}
          icon={<Briefcase className="h-5 w-5 text-violet-400" />}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          icon={<DollarSign className="h-5 w-5 text-amber-400" />}
          accent={winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}
          subtext={`${stats?.won ?? 0}W / ${stats?.lost ?? 0}L`}
        />
      </div>

      {/* Win rate progress bar */}
      {(stats?.won ?? 0) + (stats?.lost ?? 0) > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Pipeline health</span>
            <span>{winRate}% win rate</span>
          </div>
          <Progress value={winRate} className="h-1.5" />
        </div>
      )}

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {activeStages.map((stageInfo) => {
          const stageDeals = dealsByStage?.[stageInfo.id] ?? [];
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);

          return (
            <div key={stageInfo.id} className="w-64 shrink-0 sm:w-72">
              <Card
                className={cn(
                  'flex h-full flex-col border-[var(--border-default)] bg-[var(--bg-secondary)] border-t-2',
                  stageInfo.color
                )}
              >
                {/* Column header */}
                <CardHeader className="pb-2 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn('h-2 w-2 rounded-full', stageInfo.dotClass)}
                      />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {stageInfo.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {stageDeals.length}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingDeal(null);
                        setFormOpen(true);
                      }}
                      title={`Add deal to ${stageInfo.name}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatCurrencyFull(stageValue)}
                    </p>
                  )}
                </CardHeader>

                {/* Deal cards */}
                <CardContent className="flex flex-1 flex-col gap-2 p-2 pt-0">
                  {stageDeals.length > 0 ? (
                    stageDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        contactName={getContactName(deal.contactId)}
                        onClick={() => setSelectedDeal(deal)}
                        onEdit={() => openForm(deal)}
                        onDelete={() => handleDelete(deal.id)}
                        onMoveStage={(newStage) =>
                          handleMoveStage(deal.id, newStage)
                        }
                      />
                    ))
                  ) : (
                    <div className="flex flex-1 items-center justify-center py-8">
                      <p className="text-xs text-[var(--text-muted)]">No deals</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Deal form dialog */}
      <DealForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingDeal(null);
        }}
        editing={editingDeal}
        contacts={contacts ?? []}
        workspaceId={defaultWorkspaceId}
        onSubmit={handleSubmit}
      />

      {/* Deal detail dialog */}
      <DealDetail
        deal={selectedDeal}
        onClose={() => setSelectedDeal(null)}
        onEdit={(d) => {
          setSelectedDeal(null);
          openForm(d);
        }}
        onDelete={handleDelete}
        onMoveStage={handleMoveStage}
        getContactName={getContactName}
      />
    </div>
  );
}
