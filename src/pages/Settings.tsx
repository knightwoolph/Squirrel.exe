import { useState, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { useProfile } from '../stores/gamificationStore';
import { useTaskStats } from '../stores/taskStore';
import { db } from '../db/database';
import { toast } from '../stores/toastStore';
import type { Theme, FontMode, AnimationMode } from '../types';
import { Modal } from '../components/common/Modal';

export function Settings() {
  const { theme, fontMode, animationMode, setTheme, setFontMode, setAnimationMode } = useAppStore();
  const profile = useProfile();
  const stats = useTaskStats();
  const [squirrelName, setSquirrelName] = useState(profile?.squirrelName || 'Nutkin');
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themes: { value: Theme; label: string; description: string }[] = [
    { value: 'warm-forest', label: '🌲 Warm Forest', description: 'Cozy dark theme with forest vibes' },
    { value: 'modern-minimal', label: '⬜ Modern Minimal', description: 'Clean light theme for daytime' },
    { value: 'cozy-dark', label: '🌙 Cozy Dark', description: 'True dark theme for night owls' },
  ];

  const fontModes: { value: FontMode; label: string; description: string }[] = [
    { value: 'default', label: 'Default', description: 'Inter - Modern and readable' },
    { value: 'simple', label: 'Simple', description: 'JetBrains Mono - Monospace' },
    { value: 'fancy', label: 'Fancy', description: 'Playfair Display - Elegant serif' },
  ];

  const animationModes: { value: AnimationMode; label: string; description: string }[] = [
    { value: 'full', label: 'Full', description: 'All animations enabled' },
    { value: 'reduced', label: 'Reduced', description: 'Minimal animations' },
    { value: 'none', label: 'None', description: 'No animations' },
  ];

  const handleSaveName = async () => {
    if (!squirrelName.trim()) return;

    await db.userProfile.update('default', {
      squirrelName: squirrelName.trim(),
      updatedAt: new Date(),
    });

    toast.success('Name saved!', `Your squirrel is now named ${squirrelName}`);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        workspaces: await db.workspaces.toArray(),
        taskLists: await db.taskLists.toArray(),
        tasks: await db.tasks.toArray(),
        subtasks: await db.subtasks.toArray(),
        userProfile: await db.userProfile.get('default'),
        nutTransactions: await db.nutTransactions.toArray(),
        unlockedSkins: await db.unlockedSkins.toArray(),
        timerSessions: await db.timerSessions.toArray(),
        stashItems: await db.stashItems.toArray(),
        contacts: await db.contacts.toArray(),
        deals: await db.deals.toArray(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sqrl-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Export complete!', 'Your data has been saved');
    } catch (error) {
      toast.error('Export failed', 'Could not export data');
      console.error(error);
    }

    setIsExporting(false);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version) {
        toast.error('Invalid file', 'This doesn\'t appear to be a SQRL backup file');
        return;
      }

      // Clear existing data
      await db.workspaces.clear();
      await db.taskLists.clear();
      await db.tasks.clear();
      await db.subtasks.clear();
      await db.nutTransactions.clear();
      await db.unlockedSkins.clear();
      await db.timerSessions.clear();
      await db.stashItems.clear();
      await db.contacts.clear();
      await db.deals.clear();

      // Import new data
      if (data.workspaces?.length) await db.workspaces.bulkAdd(data.workspaces);
      if (data.taskLists?.length) await db.taskLists.bulkAdd(data.taskLists);
      if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks);
      if (data.subtasks?.length) await db.subtasks.bulkAdd(data.subtasks);
      if (data.nutTransactions?.length) await db.nutTransactions.bulkAdd(data.nutTransactions);
      if (data.unlockedSkins?.length) await db.unlockedSkins.bulkAdd(data.unlockedSkins);
      if (data.timerSessions?.length) await db.timerSessions.bulkAdd(data.timerSessions);
      if (data.stashItems?.length) await db.stashItems.bulkAdd(data.stashItems);
      if (data.contacts?.length) await db.contacts.bulkAdd(data.contacts);
      if (data.deals?.length) await db.deals.bulkAdd(data.deals);

      if (data.userProfile) {
        await db.userProfile.put({ ...data.userProfile, id: 'default' });
      }

      toast.success('Import complete!', 'Your data has been restored');
      window.location.reload();
    } catch (error) {
      toast.error('Import failed', 'Could not read the backup file');
      console.error(error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    try {
      // Clear all tables
      await db.workspaces.clear();
      await db.taskLists.clear();
      await db.tasks.clear();
      await db.subtasks.clear();
      await db.nutTransactions.clear();
      await db.unlockedSkins.clear();
      await db.timerSessions.clear();
      await db.stashItems.clear();
      await db.contacts.clear();
      await db.deals.clear();

      // Reset profile
      await db.userProfile.put({
        id: 'default',
        totalNuts: 0,
        currentStreak: 0,
        longestStreak: 0,
        currentSkin: 'default',
        squirrelName: 'Nutkin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success('Reset complete', 'All data has been cleared');
      setResetModalOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error('Reset failed', 'Could not clear data');
      console.error(error);
    }
  };

  return (
    <div className="p-4" style={{ maxWidth: '600px' }}>
      <h2 className="text-xl mb-6">Settings</h2>

      {/* Stats Overview */}
      <section className="mb-8">
        <div className="card bg-accent">
          <div className="card-body">
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="text-center">
                <div className="text-2xl font-bold">{profile?.totalNuts || 0}</div>
                <div className="text-sm text-muted">Total Nuts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{profile?.longestStreak || 0}</div>
                <div className="text-sm text-muted">Best Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.completed || 0}</div>
                <div className="text-sm text-muted">Tasks Done</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="mb-8">
        <h3 className="text-lg mb-4">Appearance</h3>

        {/* Theme */}
        <div className="form-group mb-4">
          <label className="input-label">Theme</label>
          <div className="flex flex-col gap-2">
            {themes.map((t) => (
              <label
                key={t.value}
                className={`card cursor-pointer p-3 transition-colors ${theme === t.value ? 'bg-accent' : 'hover:bg-hover'}`}
                style={{
                  borderColor: theme === t.value ? 'var(--accent-primary)' : undefined,
                  borderWidth: theme === t.value ? '2px' : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="theme"
                    className="radio"
                    checked={theme === t.value}
                    onChange={() => setTheme(t.value)}
                  />
                  <div>
                    <div className="font-medium">{t.label}</div>
                    <div className="text-sm text-muted">{t.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Font Mode */}
        <div className="form-group mb-4">
          <label className="input-label">Font Style</label>
          <div className="flex gap-2 flex-wrap">
            {fontModes.map((f) => (
              <button
                key={f.value}
                className={`btn ${fontMode === f.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFontMode(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="text-sm text-muted mt-2">
            {fontModes.find((f) => f.value === fontMode)?.description}
          </div>
        </div>

        {/* Animation Mode */}
        <div className="form-group">
          <label className="input-label">Animations</label>
          <div className="flex gap-2 flex-wrap">
            {animationModes.map((a) => (
              <button
                key={a.value}
                className={`btn ${animationMode === a.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAnimationMode(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="text-sm text-muted mt-2">
            {animationModes.find((a) => a.value === animationMode)?.description}
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="mb-8">
        <h3 className="text-lg mb-4">Profile</h3>
        <div className="form-group">
          <label className="input-label">Squirrel Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              value={squirrelName}
              onChange={(e) => setSquirrelName(e.target.value)}
              placeholder="Enter your squirrel's name"
            />
            <button
              className="btn btn-primary"
              onClick={handleSaveName}
              disabled={!squirrelName.trim() || squirrelName === profile?.squirrelName}
            >
              Save
            </button>
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="mb-8">
        <h3 className="text-lg mb-4">Data</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
        <div className="text-sm text-muted mt-2">
          Export your tasks, contacts, and settings as JSON. Import to restore from a backup.
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h3 className="text-lg mb-4 text-danger">Danger Zone</h3>
        <button
          className="btn btn-danger"
          onClick={() => setResetModalOpen(true)}
        >
          Reset All Data
        </button>
        <div className="text-sm text-muted mt-2">
          This will delete all your tasks, contacts, deals, and reset your nuts to 0
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset All Data?"
        size="sm"
      >
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="mb-4">
            This will <strong>permanently delete</strong> all your:
          </p>
          <ul className="text-left mb-4 text-muted">
            <li>• {stats?.total || 0} tasks</li>
            <li>• {profile?.totalNuts || 0} nuts</li>
            <li>• {profile?.longestStreak || 0} day best streak</li>
            <li>• All contacts and deals</li>
            <li>• All unlocked skins</li>
          </ul>
          <p className="text-danger font-bold mb-6">This cannot be undone!</p>

          <div className="flex gap-2 justify-center">
            <button
              className="btn btn-ghost"
              onClick={() => setResetModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleReset}
            >
              Yes, Reset Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
