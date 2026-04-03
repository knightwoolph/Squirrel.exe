import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ShortcutRow {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  heading: string;
  shortcuts: ShortcutRow[];
}

// ─── Shortcut data ─────────────────────────────────────────────────────────────

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    heading: 'Navigation',
    shortcuts: [
      { keys: ['T'], description: 'Go to Timer' },
    ],
  },
  {
    heading: 'Actions',
    shortcuts: [
      { keys: ['N'], description: 'New task form' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Quick stash (Brain Dump)' },
    ],
  },
  {
    heading: 'Search',
    shortcuts: [
      { keys: ['/'], description: 'Focus search on current page' },
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
    ],
  },
  {
    heading: 'General',
    shortcuts: [
      { keys: ['Esc'], description: 'Close modal or palette' },
    ],
  },
];

// ─── Kbd chip ──────────────────────────────────────────────────────────────────

function Kbd({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-[1.5rem] items-center justify-center',
        'rounded border border-border bg-muted px-1.5 py-0.5',
        'text-xs font-mono text-muted-foreground leading-none select-none'
      )}
    >
      {children}
    </kbd>
  );
}

// ─── Dialog content ────────────────────────────────────────────────────────────

function ShortcutsContent() {
  return (
    <div className="flex flex-col gap-5">
      {SHORTCUT_GROUPS.map((group) => (
        <div key={group.heading}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.heading}
          </p>
          <div className="flex flex-col gap-1.5">
            {group.shortcuts.map((row) => (
              <div
                key={row.description}
                className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors"
              >
                <span className="text-sm text-foreground">{row.description}</span>
                <div className="flex shrink-0 items-center gap-1">
                  {row.keys.map((k, i) => (
                    <span key={k} className="flex items-center gap-1">
                      {i > 0 && (
                        <span className="text-xs text-muted-foreground">+</span>
                      )}
                      <Kbd>{k}</Kbd>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-muted-foreground border-t border-border pt-3">
        Single-key shortcuts (N, T, /) only fire when no input field is focused.
      </p>
    </div>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-muted-foreground hover:bg-accent hover:text-foreground',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Keyboard shortcuts</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <ShortcutsContent />
        </DialogContent>
      </Dialog>
    </>
  );
}
