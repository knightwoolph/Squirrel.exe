import { useState } from 'react';
import { useCRMStore, useContacts } from '../stores/crmStore';
import { useWorkspaces } from '../stores/taskStore';
import { Modal } from '../components/common/Modal';
import { Input, Textarea } from '../components/common/Input';
import type { Contact } from '../types';
import { formatDistanceToNow } from 'date-fns';

export function Contacts() {
  const workspaces = useWorkspaces();
  const defaultWorkspaceId = workspaces?.[0]?.id || '';
  const contacts = useContacts(defaultWorkspaceId);
  const { createContact, updateContact, deleteContact } = useCRMStore();

  const [isFormOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

  const filteredContacts = contacts?.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.company?.toLowerCase().includes(query)
    );
  });

  const openForm = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setName(contact.name);
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
      setCompany(contact.company || '');
      setRole(contact.role || '');
      setNotes(contact.notes || '');
    } else {
      setEditingContact(null);
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setRole('');
      setNotes('');
    }
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !defaultWorkspaceId) return;

    const contactData = {
      workspaceId: defaultWorkspaceId,
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      role: role.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (editingContact) {
      await updateContact(editingContact.id, contactData);
    } else {
      await createContact(contactData);
    }

    closeForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this contact? This will also delete associated deals.')) {
      await deleteContact(id);
      setSelectedContact(null);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl">Contacts</h2>
        <button className="btn btn-primary" onClick={() => openForm()}>
          + Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="mb-4" style={{ maxWidth: '400px' }}>
        <Input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Contacts Grid */}
      {filteredContacts && filteredContacts.length > 0 ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="card cursor-pointer hover:bg-hover transition-colors"
              onClick={() => setSelectedContact(contact)}
            >
              <div className="card-body">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{contact.name}</div>
                    {contact.company && (
                      <div className="text-sm text-muted truncate">
                        {contact.role ? `${contact.role} at ` : ''}{contact.company}
                      </div>
                    )}
                    {contact.email && (
                      <div className="text-sm text-muted truncate">{contact.email}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center p-8">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-muted mb-4">
              {searchQuery
                ? 'No contacts match your search.'
                : 'No contacts yet. Add your first contact to start building relationships!'}
            </p>
            {!searchQuery && (
              <button className="btn btn-primary" onClick={() => openForm()}>
                Add Your First Contact
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Input
              label="Company"
              placeholder="Acme Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <Input
              label="Role"
              placeholder="CEO"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <Textarea
            label="Notes"
            placeholder="Add any notes about this contact..."
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
              disabled={!name.trim()}
            >
              {editingContact ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Contact Detail Modal */}
      <Modal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title="Contact Details"
        size="md"
      >
        {selectedContact && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'var(--accent-primary)' }}
              >
                {selectedContact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedContact.name}</h3>
                {selectedContact.company && (
                  <div className="text-muted">
                    {selectedContact.role ? `${selectedContact.role} at ` : ''}{selectedContact.company}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              {selectedContact.email && (
                <div className="flex items-center gap-3">
                  <span className="text-muted">📧</span>
                  <a href={`mailto:${selectedContact.email}`} className="text-accent">
                    {selectedContact.email}
                  </a>
                </div>
              )}
              {selectedContact.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-muted">📞</span>
                  <a href={`tel:${selectedContact.phone}`} className="text-accent">
                    {selectedContact.phone}
                  </a>
                </div>
              )}
              {selectedContact.notes && (
                <div className="card bg-muted">
                  <div className="card-body">
                    <div className="text-sm text-muted mb-1">Notes</div>
                    <p className="whitespace-pre-wrap">{selectedContact.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-muted mb-4">
              Added {formatDistanceToNow(selectedContact.createdAt, { addSuffix: true })}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(selectedContact.id)}
              >
                Delete
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedContact(null);
                  openForm(selectedContact);
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
