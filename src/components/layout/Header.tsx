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

  return (
    <header className="header">
      <div className="header-left">
        {/* Mobile menu button */}
        <button
          className="btn btn-ghost btn-icon hide-lg"
          onClick={toggleMobileSidebar}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        {/* Quick stash button */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={openQuickStash}
          title="Quick Stash (Ctrl+Shift+S)"
          aria-label="Quick stash"
        >
          🧠
        </button>

        {/* Command palette button */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleCommandPalette}
          title="Command Palette (Ctrl+K)"
          aria-label="Command palette"
        >
          ⌘
        </button>

        {/* Streak indicator */}
        <div
          className="streak-indicator"
          title={`${streak} day streak${multiplier > 1 ? ` (${multiplier}x bonus!)` : ''}`}
        >
          <span className={`streak-fire ${streak > 0 ? 'animate-pulse' : ''}`}>
            {streak > 0 ? '🔥' : '💨'}
          </span>
          <span className="streak-count">{streak}</span>
          {multiplier > 1 && (
            <span className="text-xs text-warning ml-1">×{multiplier}</span>
          )}
        </div>

        {/* Nut counter */}
        <div className="nut-counter" title={`${nuts.toLocaleString()} nuts`}>
          <span className="nut-counter-icon">🥜</span>
          <span className="nut-counter-value">{nuts.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
