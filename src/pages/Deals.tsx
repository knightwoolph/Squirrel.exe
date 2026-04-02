import { useState } from 'react';
import { useCRMStore, useDealsByStage, useDealStats, useContacts } from '../stores/crmStore';
import { useWorkspaces } from '../stores/taskStore';
import { Modal } from '../components/common/Modal';
import { Input, Textarea } from '../components/common/Input';
import type { Deal, DealStage } from '../types';
import { formatDistanceToNow } from 'date-fns';

const STAGES: { id: DealStage; name: string; emoji: string }[] = [
  { id: 'lead', name: 'Lead', emoji: '🎯' },
  { id: 'contacted', name: 'Contacted', emoji: '📞' },
  { id: 'proposal', name: 'Proposal', emoji: '📝' },
  { id: 'negotiation', name: 'Negotiation', emoji: '🤝' },
  { id: 'won', name: 'Won', emoji: '🎉' },
  { id: 'lost', name: 'Lost', emoji: '❌' },
];

export function Deals() {
  const workspaces = useWorkspaces();
  const defaultWorkspaceId = workspaces?.[0]?.id || '';
  const dealsByStage = useDealsByStage(defaultWorkspaceId);
  const stats = useDealStats(defaultWorkspaceId);
  const contacts = useContacts(defaultWorkspaceId);
  const { createDeal, updateDeal, deleteDeal, moveDealToStage } = useCRMStore();

  const [isFormOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showClosedDeals, setShowClosedDeals] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [contactId, setContactId] = useState('');
  const [stage, setStage] = useState<DealStage>('lead');
  const [notes, setNotes] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const openForm = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setTitle(deal.title);
      setValue(deal.value?.toString() || '');
      setContactId(deal.contactId || '');
      setStage(deal.stage);
      setNotes(deal.notes || '');
      setExpectedCloseDate(deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '');
    } else {
      setEditingDeal(null);
      setTitle('');
      setValue('');
      setContactId('');
      setStage('lead');
      setNotes('');
      setExpectedCloseDate('');
    }
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingDeal(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !defaultWorkspaceId) return;

    const dealData = {
      workspaceId: defaultWorkspaceId,
      title: title.trim(),
      value: value ? parseFloat(value) : undefined,
      contactId: contactId || undefined,
      stage,
      notes: notes.trim() || undefined,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
    };

    if (editingDeal) {
      await updateDeal(editingDeal.id, dealData);
    } else {
      await createDeal(dealData);
    }

    closeForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this deal?')) {
      await deleteDeal(id);
      setSelectedDeal(null);
    }
  };

  const handleMoveStage = async (dealId: string, newStage: DealStage) => {
    await moveDealToStage(dealId, newStage);
  };

  const getContactName = (contactId?: string) => {
    if (!contactId) return null;
    const contact = contacts?.find((c) => c.id === contactId);
    return contact?.name;
  };

  // Filter to only show active pipeline stages (not won/lost)
  const activeStages = showClosedDeals ? STAGES : STAGES.filter((s) => !['won', 'lost'].includes(s.id));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl">Deal Pipeline</h2>
        <div className="flex gap-2">
          <button
            className={`btn ${showClosedDeals ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setShowClosedDeals(!showClosedDeals)}
          >
            {showClosedDeals ? 'Hide' : 'Show'} Closed
          </button>
          <button className="btn btn-primary" onClick={() => openForm()}>
            + New Deal
          </button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-card-value">{formatCurrency(stats?.pipelineValue || 0)}</div>
          <div className="stat-card-label">Pipeline Value</div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-card-value">{formatCurrency(stats?.wonValue || 0)}</div>
          <div className="stat-card-label">Won Total</div>
        </div>
        <div className="stat-card stat-card-warning">
          <div className="stat-card-value">{stats?.open || 0}</div>
          <div className="stat-card-label">Active Deals</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats?.winRate || 0}%</div>
          <div className="stat-card-label">Win Rate</div>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeStages.map((stageInfo) => {
          const stageDeals = dealsByStage?.[stageInfo.id] || [];
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div key={stageInfo.id} className="flex-shrink-0" style={{ width: '280px' }}>
              <div className="card h-full">
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span>{stageInfo.emoji}</span>
                    {stageInfo.name}
                    <span className="text-muted">({stageDeals.length})</span>
                  </h3>
                  {stageValue > 0 && (
                    <div className="text-xs text-muted mt-1">
                      {formatCurrency(stageValue)}
                    </div>
                  )}
                </div>
                <div className="card-body p-2" style={{ minHeight: '200px' }}>
                  {stageDeals.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="card bg-muted cursor-pointer hover:bg-hover transition-colors"
                          onClick={() => setSelectedDeal(deal)}
                        >
                          <div className="card-body p-3">
                            <div className="font-medium truncate">{deal.title}</div>
                            {deal.value && (
                              <div className="text-sm text-success font-bold">
                                {formatCurrency(deal.value)}
                              </div>
                            )}
                            {getContactName(deal.contactId) && (
                              <div className="text-xs text-muted truncate">
                                👤 {getContactName(deal.contactId)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted text-sm py-8">
                      No deals
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingDeal ? 'Edit Deal' : 'New Deal'}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Deal Title"
            placeholder="e.g., Website Redesign Project"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Input
              label="Value ($)"
              type="number"
              placeholder="10000"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div>
              <label className="input-label">Stage</label>
              <select
                className="select"
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="input-label">Contact</label>
              <select
                className="select"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
              >
                <option value="">No contact</option>
                {contacts?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Expected Close Date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </div>

          <Textarea
            label="Notes"
            placeholder="Add any notes about this deal..."
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            rows={3}
          />

          <div className="flex gap-2 justify-end pt-2">
            <button className="btn btn-ghost" onClick={closeForm}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              {editingDeal ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deal Detail Modal */}
      <Modal
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        title="Deal Details"
        size="md"
      >
        {selectedDeal && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{selectedDeal.title}</h3>
              {selectedDeal.value && (
                <div className="text-2xl text-success font-bold mb-2">
                  {formatCurrency(selectedDeal.value)}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm">Stage:</span>
                <span className="badge">
                  {STAGES.find((s) => s.id === selectedDeal.stage)?.emoji}{' '}
                  {STAGES.find((s) => s.id === selectedDeal.stage)?.name}
                </span>
              </div>
            </div>

            {/* Move to Stage */}
            <div className="mb-6">
              <label className="input-label">Move to Stage</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.filter((s) => s.id !== selectedDeal.stage).map((s) => (
                  <button
                    key={s.id}
                    className={`btn btn-sm ${s.id === 'won' ? 'btn-success' : s.id === 'lost' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => {
                      handleMoveStage(selectedDeal.id, s.id);
                      setSelectedDeal({ ...selectedDeal, stage: s.id });
                    }}
                  >
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
            </div>

            {getContactName(selectedDeal.contactId) && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-muted">👤</span>
                <span>{getContactName(selectedDeal.contactId)}</span>
              </div>
            )}

            {selectedDeal.expectedCloseDate && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-muted">📅</span>
                <span>Expected close: {new Date(selectedDeal.expectedCloseDate).toLocaleDateString()}</span>
              </div>
            )}

            {selectedDeal.closedAt && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-muted">✓</span>
                <span>Closed: {new Date(selectedDeal.closedAt).toLocaleDateString()}</span>
              </div>
            )}

            {selectedDeal.notes && (
              <div className="card bg-muted mb-4">
                <div className="card-body">
                  <div className="text-sm text-muted mb-1">Notes</div>
                  <p className="whitespace-pre-wrap">{selectedDeal.notes}</p>
                </div>
              </div>
            )}

            <div className="text-xs text-muted mb-4">
              Created {formatDistanceToNow(selectedDeal.createdAt, { addSuffix: true })}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(selectedDeal.id)}
              >
                Delete
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedDeal(null);
                  openForm(selectedDeal);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
