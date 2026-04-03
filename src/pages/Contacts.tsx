import { useState } from 'react';
import { useCRMStore, useContacts } from '../stores/crmStore';
import { useWorkspaces } from '../stores/taskStore';
import type { Contact } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

import {
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

// ── Avatar color palette keyed off first char ────────────────────────────────
const AVATAR_COLORS: Record<string, string> = {
  A: 'bg-red-500/20 text-red-400',
  B: 'bg-orange-500/20 text-orange-400',
  C: 'bg-amber-500/20 text-amber-400',
  D: 'bg-yellow-500/20 text-yellow-400',
  E: 'bg-lime-500/20 text-lime-400',
  F: 'bg-green-500/20 text-green-400',
  G: 'bg-emerald-500/20 text-emerald-400',
  H: 'bg-teal-500/20 text-teal-400',
  I: 'bg-cyan-500/20 text-cyan-400',
  J: 'bg-sky-500/20 text-sky-400',
  K: 'bg-blue-500/20 text-blue-400',
  L: 'bg-indigo-500/20 text-indigo-400',
  M: 'bg-violet-500/20 text-violet-400',
  N: 'bg-purple-500/20 text-purple-400',
  O: 'bg-fuchsia-500/20 text-fuchsia-400',
  P: 'bg-pink-500/20 text-pink-400',
  Q: 'bg-rose-500/20 text-rose-400',
  R: 'bg-red-500/20 text-red-400',
  S: 'bg-orange-500/20 text-orange-400',
  T: 'bg-amber-500/20 text-amber-400',
  U: 'bg-lime-500/20 text-lime-400',
  V: 'bg-green-500/20 text-green-400',
  W: 'bg-cyan-500/20 text-cyan-400',
  X: 'bg-sky-500/20 text-sky-400',
  Y: 'bg-indigo-500/20 text-indigo-400',
  Z: 'bg-violet-500/20 text-violet-400',
};

function getAvatarColor(name: string): string {
  const key = name.charAt(0).toUpperCase();
  return AVATAR_COLORS[key] ?? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({
  query,
  onAdd,
}: {
  query: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
        <Users className="h-8 w-8 text-[var(--text-muted)]" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
        {query ? 'No contacts found' : 'No contacts yet'}
      </h3>
      <p className="mb-6 max-w-xs text-sm text-[var(--text-muted)]">
        {query
          ? `No contacts match "${query}". Try a different search.`
          : 'Add your first contact to start building relationships.'}
      </p>
      {!query && (
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add Your First Contact
        </Button>
      )}
    </div>
  );
}

// ── Contact form ──────────────────────────────────────────────────────────────
interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Contact | null;
  onSubmit: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

function ContactForm({ open, onOpenChange, editing, onSubmit }: ContactFormProps) {
  const [name, setName] = useState(editing?.name ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [company, setCompany] = useState(editing?.company ?? '');
  const [role, setRole] = useState(editing?.role ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [saving, setSaving] = useState(false);

  // Sync form when editing contact changes
  const resetTo = (c: Contact | null) => {
    setName(c?.name ?? '');
    setEmail(c?.email ?? '');
    setPhone(c?.phone ?? '');
    setCompany(c?.company ?? '');
    setRole(c?.role ?? '');
    setNotes(c?.notes ?? '');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetTo(null);
    onOpenChange(next);
  };

  // When the dialog opens with a new editing target, sync fields
  const prevEditing = editing;
  if (open && prevEditing !== editing) {
    resetTo(editing);
  }

  const isValidEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (email.trim() && !isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    setSaving(true);
    try {
      await onSubmit({
        workspaceId: editing?.workspaceId ?? '',
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        role: role.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: editing?.tags,
        lastContactDate: editing?.lastContactDate,
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
          <DialogTitle>{editing ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cf-name">
              Name <span className="text-[var(--danger)]">*</span>
            </Label>
            <Input
              id="cf-name"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-email">Email</Label>
              <Input
                id="cf-email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                error={!!emailError}
              />
              {emailError && <p className="text-xs text-[var(--danger)]">{emailError}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-phone">Phone</Label>
              <Input
                id="cf-phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Company / Role */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-company">Company</Label>
              <Input
                id="cf-company"
                placeholder="Acme Inc."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-role">Role</Label>
              <Input
                id="cf-role"
                placeholder="CEO"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cf-notes">Notes</Label>
            <Textarea
              id="cf-notes"
              placeholder="Add any notes about this contact..."
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
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Contact detail dialog ─────────────────────────────────────────────────────
interface ContactDetailProps {
  contact: Contact | null;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

function ContactDetail({ contact, onClose, onEdit, onDelete }: ContactDetailProps) {
  if (!contact) return null;

  const initials = getInitials(contact.name);
  const avatarColor = getAvatarColor(contact.name);

  return (
    <Dialog open={!!contact} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar className={cn('h-16 w-16 text-xl font-semibold', avatarColor)}>
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-bold text-[var(--text-primary)]">
              {contact.name}
            </h3>
            {(contact.role || contact.company) && (
              <p className="truncate text-sm text-[var(--text-muted)]">
                {contact.role && contact.company
                  ? `${contact.role} at ${contact.company}`
                  : contact.role ?? contact.company}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Details */}
        <div className="flex flex-col gap-3">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-3 text-sm text-[var(--text-primary)] transition-colors hover:text-[var(--accent-primary)]"
            >
              <Mail className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate">{contact.email}</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-3 text-sm text-[var(--text-primary)] transition-colors hover:text-[var(--accent-primary)]"
            >
              <Phone className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate">{contact.phone}</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
            </a>
          )}
          {contact.company && (
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <Building2 className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </>
        )}

        {/* Notes */}
        {contact.notes && (
          <>
            <Separator />
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Notes
              </p>
              <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                {contact.notes}
              </p>
            </div>
          </>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          Added {formatDistanceToNow(contact.createdAt, { addSuffix: true })}
        </p>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(contact.id)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(contact);
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

// ── Main page ─────────────────────────────────────────────────────────────────
export function Contacts() {
  const workspaces = useWorkspaces();
  const defaultWorkspaceId = workspaces?.[0]?.id ?? '';
  const contacts = useContacts(defaultWorkspaceId);
  const { createContact, updateContact, deleteContact } = useCRMStore();

  const [isFormOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filteredContacts = contacts?.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  });

  const openForm = (contact?: Contact) => {
    setEditingContact(contact ?? null);
    setFormOpen(true);
  };

  const handleSubmit = async (
    data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const payload = { ...data, workspaceId: defaultWorkspaceId };
    if (editingContact) {
      await updateContact(editingContact.id, payload);
    } else {
      await createContact(payload);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact? This will also delete associated deals.')) return;
    await deleteContact(id);
    setSelectedContact(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Contacts</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {contacts?.length ?? 0} contact{contacts?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => openForm()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          className="pl-9"
          type="text"
          placeholder="Search by name, email, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid or empty state */}
      {filteredContacts && filteredContacts.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredContacts.map((contact) => {
            const initials = getInitials(contact.name);
            const avatarColor = getAvatarColor(contact.name);

            return (
              <Card
                key={contact.id}
                className="group cursor-pointer border-[var(--border-default)] bg-[var(--bg-secondary)] transition-all hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)] hover:shadow-md"
                onClick={() => setSelectedContact(contact)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    {/* Avatar + info */}
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar className={cn('h-11 w-11 shrink-0', avatarColor)}>
                        <AvatarFallback className={cn('text-sm font-semibold', avatarColor)}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[var(--text-primary)]">
                          {contact.name}
                        </p>
                        {(contact.role || contact.company) && (
                          <p className="truncate text-xs text-[var(--text-muted)]">
                            {contact.role && contact.company
                              ? `${contact.role} at ${contact.company}`
                              : contact.role ?? contact.company}
                          </p>
                        )}
                        {contact.email && (
                          <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                            {contact.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openForm(contact);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {contact.email && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`mailto:${contact.email}`);
                            }}
                          >
                            <Mail className="h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                        )}
                        {contact.phone && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${contact.phone}`);
                            }}
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[var(--danger)] focus:text-[var(--danger)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(contact.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Tags */}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {contact.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{contact.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Quick action row */}
                  <div className="mt-3 flex items-center gap-1 border-t border-[var(--border-subtle)] pt-3">
                    {contact.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 flex-1 gap-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`mailto:${contact.email}`);
                        }}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </Button>
                    )}
                    {contact.phone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 flex-1 gap-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${contact.phone}`);
                        }}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </Button>
                    )}
                    {!contact.email && !contact.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <User className="h-3.5 w-3.5" />
                        No contact info
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState query={searchQuery} onAdd={() => openForm()} />
      )}

      {/* Contact Form Dialog */}
      <ContactForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        editing={editingContact}
        onSubmit={handleSubmit}
      />

      {/* Contact Detail Dialog */}
      <ContactDetail
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onEdit={(c) => {
          setSelectedContact(null);
          openForm(c);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
