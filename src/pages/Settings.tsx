import { useState, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { useProfile } from '../stores/gamificationStore';
import { useTaskStats } from '../stores/taskStore';
import { db } from '../db/database';
import { toast } from '../stores/toastStore';
import type { Theme, FontMode, AnimationMode } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { cn } from '../lib/utils';
import {
  Palette,
  Type,
  Zap,
  User,
  Download,
  Upload,
  Trash2,
  Shield,
  BarChart3,
  RefreshCcw,
  AlertTriangle,
  Loader2,
  Check,
  X,
  TreePine,
  Moon,
  Sun,
} from 'lucide-react';

// ── Theme config ───────────────────────────────────────────────────────────────

const THEMES: {
  value: Theme;
  label: string;
  description: string;
  icon: typeof TreePine;
  swatch: string[];
}[] = [
  {
    value: 'warm-forest',
    label: 'Warm Forest',
    description: 'Cozy dark theme with forest vibes',
    icon: TreePine,
    swatch: ['#2d3b2d', '#4a7c59', '#d4a853', '#f0e6d0'],
  },
  {
    value: 'modern-minimal',
    label: 'Modern Minimal',
    description: 'Clean light theme for daytime focus',
    icon: Sun,
    swatch: ['#ffffff', '#f5f5f5', '#3b82f6', '#1e293b'],
  },
  {
    value: 'cozy-dark',
    label: 'Cozy Dark',
    description: 'True dark theme for night owls',
    icon: Moon,
    swatch: ['#0f0f12', '#1c1c24', '#7c3aed', '#c4b5fd'],
  },
];

const FONT_MODES: { value: FontMode; label: string; description: string; preview: string }[] = [
  { value: 'default', label: 'Default', description: 'Inter — Modern and readable', preview: 'The quick brown fox' },
  { value: 'simple', label: 'Mono', description: 'JetBrains Mono — Monospace', preview: 'The quick brown fox' },
  { value: 'fancy', label: 'Fancy', description: 'Playfair Display — Elegant serif', preview: 'The quick brown fox' },
];

const ANIMATION_MODES: { value: AnimationMode; label: string; description: string }[] = [
  { value: 'full', label: 'Full', description: 'All animations enabled' },
  { value: 'reduced', label: 'Reduced', description: 'Minimal, accessible animations' },
  { value: 'none', label: 'None', description: 'No animations (maximum performance)' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function Settings() {
  const { theme, fontMode, animationMode, setTheme, setFontMode, setAnimationMode } = useAppStore();
  const profile = useProfile();
  const stats = useTaskStats();

  const [squirrelName, setSquirrelName] = useState(profile?.squirrelName || 'Nutkin');
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version) {
        toast.error('Invalid file', "This doesn't appear to be a SQRL backup file");
        setIsImporting(false);
        return;
      }
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
      if (data.userProfile) await db.userProfile.put({ ...data.userProfile, id: 'default' });

      toast.success('Import complete!', 'Your data has been restored');
      window.location.reload();
    } catch (error) {
      toast.error('Import failed', 'Could not read the backup file');
      console.error(error);
    }
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
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
    setIsResetting(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Customize your SQRL experience
        </p>
      </div>

      {/* Stats Bar */}
      <Card className="mb-6">
        <CardContent className="py-4 px-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {profile?.totalNuts ?? 0}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Total Nuts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {profile?.longestStreak ?? 0}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Best Streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {stats?.completed ?? 0}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Tasks Done</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="appearance">
        <TabsList className="w-full grid grid-cols-4 mb-6">
          <TabsTrigger value="appearance" className="gap-1 text-xs sm:text-sm">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Appearance</span>
            <span className="sm:hidden">Look</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1 text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            Data
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1 text-xs sm:text-sm">
            <Shield className="h-3.5 w-3.5" />
            About
          </TabsTrigger>
        </TabsList>

        {/* ── Appearance Tab ─────────────────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-8">

          {/* Theme */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-[var(--text-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Theme</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {THEMES.map((t) => {
                const ThemeIcon = t.icon;
                const isActive = theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      'group relative rounded-[var(--radius-lg)] border-2 p-4 text-left transition-all',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                      isActive
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)]'
                        : 'border-[var(--border-default)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-tertiary)]'
                    )}
                  >
                    {isActive && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)]">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                    {/* Color swatch */}
                    <div className="flex gap-1 mb-3">
                      {t.swatch.map((color, i) => (
                        <div
                          key={i}
                          className="h-4 flex-1 rounded-sm first:rounded-l-md last:rounded-r-md"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <ThemeIcon className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">{t.label}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Font Mode */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-4 w-4 text-[var(--text-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Font Style</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {FONT_MODES.map((f) => {
                const isActive = fontMode === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFontMode(f.value)}
                    className={cn(
                      'rounded-[var(--radius-lg)] border-2 p-4 text-left transition-all',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                      isActive
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)]'
                        : 'border-[var(--border-default)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-tertiary)]'
                    )}
                  >
                    <p className="text-base font-medium text-[var(--text-primary)] mb-1.5 truncate">
                      {f.preview}
                    </p>
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">{f.label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-tight">{f.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Animation Mode */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-[var(--text-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Animations</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ANIMATION_MODES.map((a) => {
                const isActive = animationMode === a.value;
                return (
                  <button
                    key={a.value}
                    onClick={() => setAnimationMode(a.value)}
                    className={cn(
                      'flex flex-col items-start gap-0.5 rounded-[var(--radius-lg)] border-2 px-4 py-3 transition-all',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                      isActive
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)]'
                        : 'border-[var(--border-default)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-tertiary)]'
                    )}
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)]">{a.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">{a.description}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </TabsContent>

        {/* ── Profile Tab ────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Squirrel Profile
              </CardTitle>
              <CardDescription>Customize your squirrel's identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="squirrelName">Squirrel Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="squirrelName"
                    value={squirrelName}
                    onChange={(e) => setSquirrelName(e.target.value)}
                    placeholder="Enter your squirrel's name"
                    className="flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={!squirrelName.trim() || squirrelName === profile?.squirrelName}
                    className="gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats detail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Nuts', value: profile?.totalNuts ?? 0 },
                  { label: 'Current Streak', value: profile?.currentStreak ?? 0, suffix: 'days' },
                  { label: 'Best Streak', value: profile?.longestStreak ?? 0, suffix: 'days' },
                  { label: 'Tasks Completed', value: stats?.completed ?? 0 },
                  { label: 'Tasks Total', value: stats?.total ?? 0 },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] px-3 py-2.5"
                  >
                    <p className="text-xl font-bold text-[var(--text-primary)]">
                      {stat.value}
                      {stat.suffix && (
                        <span className="text-sm font-normal text-[var(--text-muted)] ml-1">
                          {stat.suffix}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Data Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="data" className="space-y-5">
          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </CardTitle>
              <CardDescription>
                Save all your tasks, contacts, and settings as a JSON backup file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Exporting…</>
                ) : (
                  <><Download className="h-4 w-4" /> Export Backup</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Import */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Data
              </CardTitle>
              <CardDescription>
                Restore from a previously exported SQRL backup file. This will overwrite existing data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                ) : (
                  <><Upload className="h-4 w-4" /> Choose Backup File</>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Danger Zone */}
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions. Proceed with extreme caution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4 p-4 rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/5">
                <Trash2 className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Reset All Data</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Delete all tasks, contacts, deals, and reset your nuts to zero.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setResetModalOpen(true)}
                  className="shrink-0"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── About Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                About SQRL.EXE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Version</span>
                <Badge variant="secondary">1.0.0</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Storage</span>
                <Badge variant="outline">Local (IndexedDB)</Badge>
              </div>
              <Separator />
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                SQRL.EXE is your productivity squirrel — collecting tasks like nuts, organizing your
                work with gamified rewards, and keeping your brain clear with the brain dump stash.
                All data stays on your device.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Reset All Data?
            </DialogTitle>
            <DialogDescription>
              This will <strong>permanently delete</strong> all of your data.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[var(--radius-md)] bg-red-500/5 border border-red-500/20 p-4 space-y-1.5">
            {[
              `${stats?.total ?? 0} tasks`,
              `${profile?.totalNuts ?? 0} nuts`,
              `${profile?.longestStreak ?? 0}-day best streak`,
              'All contacts and deals',
              'All unlocked skins',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-red-600 text-center">
            This cannot be undone.
          </p>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Resetting…</>
              ) : (
                <><Trash2 className="h-3.5 w-3.5" /> Yes, Reset Everything</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

