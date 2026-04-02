import { Menu, Search, Brain, Flame, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAppStore } from '../../stores/appStore';
import { useProfile, useStreakMultiplier } from '../../stores/gamificationStore';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const {
    toggleMobileSidebar,
    toggleCommandPalette,
    openQuickStash,
  } = useAppStore();

  const profile = useProfile();
  const multiplier = useStreakMultiplier();

  const nuts = profile?.totalNuts ?? 0;
  const streak = profile?.currentStreak ?? 0;
  const hasStreak = streak > 0;

  return (
    <TooltipProvider>
      <header
        className={cn(
          'sticky top-0 z-sticky flex h-header shrink-0 items-center gap-3',
          'border-b border-border bg-card/80 backdrop-blur-sm px-4'
        )}
      >
        {/* Left side */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Mobile menu toggle */}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleMobileSidebar}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md lg:hidden',
                  'text-muted-foreground hover:bg-accent hover:text-foreground',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Menu</TooltipContent>
          </Tooltip>

          {/* Page title */}
          <h1 className="truncate text-base font-semibold text-foreground leading-none">
            {title}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Quick stash */}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={openQuickStash}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md',
                  'text-muted-foreground hover:bg-accent hover:text-foreground',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
                aria-label="Quick stash (Ctrl+Shift+S)"
              >
                <Brain className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Quick Stash
              <kbd className="ml-1.5 rounded border border-border bg-muted px-1 py-0.5 text-xs font-mono text-muted-foreground">
                Ctrl+Shift+S
              </kbd>
            </TooltipContent>
          </Tooltip>

          {/* Command palette */}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleCommandPalette}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-md px-2',
                  'text-muted-foreground hover:bg-accent hover:text-foreground',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
                aria-label="Open command palette (Ctrl+K)"
              >
                <Search className="h-3.5 w-3.5" />
                <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground leading-none">
                  ⌘K
                </kbd>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Command Palette
              <kbd className="ml-1.5 rounded border border-border bg-muted px-1 py-0.5 text-xs font-mono text-muted-foreground">
                Ctrl+K
              </kbd>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5" />

          {/* Streak indicator */}
          <Tooltip
            delayDuration={200}
          >
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex h-8 cursor-default items-center gap-1.5 rounded-md px-2',
                  'text-sm font-medium transition-colors duration-150',
                  hasStreak
                    ? 'text-streak-fire hover:bg-accent'
                    : 'text-muted-foreground hover:bg-accent'
                )}
                role="status"
                aria-label={`${streak} day streak`}
              >
                {hasStreak ? (
                  <Flame
                    className={cn(
                      'h-4 w-4 text-streak-fire',
                      streak > 0 && 'animate-pulse'
                    )}
                  />
                ) : (
                  <Wind className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="tabular-nums leading-none">{streak}</span>
                {multiplier > 1 && (
                  <Badge
                    variant="outline"
                    className="h-4 border-warning/50 bg-warning/10 px-1 py-0 text-xs font-semibold text-warning leading-none"
                  >
                    ×{multiplier}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {streak > 0
                ? `${streak} day streak${multiplier > 1 ? ` · ${multiplier}x bonus active` : ''}`
                : 'No active streak — complete a task to start one'}
            </TooltipContent>
          </Tooltip>

          {/* Nut counter */}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex h-8 cursor-default items-center gap-1.5 rounded-md px-2',
                  'text-sm font-medium text-nut-gold hover:bg-accent',
                  'transition-colors duration-150'
                )}
                role="status"
                aria-label={`${nuts.toLocaleString()} nuts`}
              >
                <span className="text-base leading-none select-none" role="img" aria-hidden="true">
                  🥜
                </span>
                <span className="tabular-nums leading-none">{nuts.toLocaleString()}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {nuts.toLocaleString()} nuts collected
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
