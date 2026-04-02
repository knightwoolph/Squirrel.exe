import { useState } from 'react';
import { SKINS, type Skin } from '../types';
import { useProfile, useStreakMultiplier, useUnlockedSkins, useGamificationStore } from '../stores/gamificationStore';
import { useTaskStats } from '../stores/taskStore';
import { TreePine, Crown, Lock, Star, Flame, Target, Award, TrendingUp, ShoppingCart, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { cn } from '../lib/utils';

const STREAK_TIERS = [
  { days: 0, label: 'Seedling', multiplier: 1, color: 'text-[var(--text-muted)]', bgColor: 'bg-[var(--bg-tertiary)]', emoji: '🌱' },
  { days: 7, label: 'Sapling', multiplier: 1.5, color: 'text-[var(--success)]', bgColor: 'bg-[var(--success)]/10', emoji: '🌿' },
  { days: 14, label: 'Oak', multiplier: 2, color: 'text-[var(--warning)]', bgColor: 'bg-[var(--warning)]/10', emoji: '🌳' },
  { days: 30, label: 'Ancient Oak', multiplier: 3, color: 'text-amber-500', bgColor: 'bg-amber-500/10', emoji: '🏆' },
];

function getCurrentTier(streak: number) {
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (streak >= STREAK_TIERS[i].days) return STREAK_TIERS[i];
  }
  return STREAK_TIERS[0];
}

function getNextTier(streak: number) {
  return STREAK_TIERS.find((t) => t.days > streak) || null;
}

export function VictoryOak() {
  const profile = useProfile();
  const multiplier = useStreakMultiplier();
  const unlockedSkins = useUnlockedSkins();
  const stats = useTaskStats();
  const { unlockSkin, setActiveSkin } = useGamificationStore();

  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const skinList = Object.values(SKINS);
  const unlockedSkinIds = new Set(unlockedSkins?.map((s) => s.skinId) || []);
  unlockedSkinIds.add('default');

  const currentStreak = profile?.currentStreak || 0;
  const currentTier = getCurrentTier(currentStreak);
  const nextTier = getNextTier(currentStreak);

  const currentSkinEmoji = profile?.currentSkin
    ? SKINS[profile.currentSkin as keyof typeof SKINS]?.emoji || '🐿️'
    : '🐿️';

  const canAfford = selectedSkin ? (profile?.totalNuts || 0) >= selectedSkin.cost : false;
  const nutsShortfall = selectedSkin ? Math.max(0, selectedSkin.cost - (profile?.totalNuts || 0)) : 0;

  const handleSkinClick = (skin: Skin) => {
    if (unlockedSkinIds.has(skin.id)) {
      setActiveSkin(skin.id);
    } else {
      setSelectedSkin(skin);
    }
  };

  const handlePurchase = async () => {
    if (!selectedSkin) return;
    setIsPurchasing(true);
    const success = await unlockSkin(selectedSkin.id, selectedSkin.cost);
    setIsPurchasing(false);
    if (success) {
      setSelectedSkin(null);
      await setActiveSkin(selectedSkin.id);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
          <TreePine className="w-5 h-5 text-[var(--accent-primary)]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Victory Oak</h1>
          <p className="text-sm text-[var(--text-muted)]">Your squirrel's progress and rewards</p>
        </div>
      </div>

      {/* Hero: Tree + Squirrel + Balance */}
      <Card className="mb-6 bg-[var(--bg-card)] border-[var(--border-subtle)] overflow-hidden">
        <CardContent className="p-0">
          <div className="relative flex flex-col items-center pt-8 pb-6 px-4">
            {/* Tree visual */}
            <div className="relative mb-2 select-none pointer-events-none">
              <div className="text-7xl leading-none filter drop-shadow-sm">🌳</div>
              <div
                className={cn(
                  'absolute -bottom-1 left-1/2 -translate-x-1/2',
                  'text-4xl leading-none transition-all duration-300',
                  'animate-[bounce_3s_ease-in-out_infinite]'
                )}
                style={{ animationDuration: '3s' }}
              >
                {currentSkinEmoji}
              </div>
            </div>

            {/* Squirrel name */}
            <div className="mt-5 text-center">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                {profile?.squirrelName || profile?.displayName || 'Your Squirrel'}
              </p>
              <Badge
                className={cn('mt-1 gap-1', currentTier.bgColor, currentTier.color, 'border-0')}
              >
                <span>{currentTier.emoji}</span>
                {currentTier.label}
              </Badge>
            </div>

            <Separator className="my-5 bg-[var(--border-subtle)] w-full" />

            {/* Nut balance */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
              <div className="text-3xl">🥜</div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)] leading-none">
                  {(profile?.totalNuts || 0).toLocaleString()}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Nuts Stashed</p>
              </div>
              {multiplier > 1 && (
                <Badge className="ml-2 gap-1 bg-amber-500/15 text-amber-600 border-amber-500/20">
                  <Flame className="w-3 h-3" />
                  {multiplier}x
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-[var(--bg-card)] border-[var(--border-subtle)]">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Target className="w-3.5 h-3.5" />
              <span className="text-xs">Completed</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats?.completed || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">tasks done</p>
          </CardContent>
        </Card>

        <Card className={cn(
          'border',
          currentStreak > 0
            ? 'bg-[var(--warning)]/5 border-[var(--warning)]/20'
            : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'
        )}>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Flame className={cn('w-3.5 h-3.5', currentStreak > 0 && 'text-[var(--warning)]')} />
              <span className="text-xs">Streak</span>
            </div>
            <p className={cn(
              'text-2xl font-bold',
              currentStreak > 0 ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'
            )}>
              {currentStreak}
            </p>
            <p className="text-xs text-[var(--text-muted)]">day{currentStreak !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--bg-card)] border-[var(--border-subtle)]">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Award className="w-3.5 h-3.5" />
              <span className="text-xs">Best Streak</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{profile?.longestStreak || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">days</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--bg-card)] border-[var(--border-subtle)]">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs">Completion</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats?.completionRate || 0}%</p>
            <p className="text-xs text-[var(--text-muted)]">rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Streak Tier Progress */}
      <Card className="mb-6 bg-[var(--bg-card)] border-[var(--border-subtle)]">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Streak Tiers</span>
            </div>
            {multiplier > 1 && (
              <Badge className="gap-1 bg-amber-500/15 text-amber-600 border-amber-500/20">
                <Flame className="w-3 h-3" />
                {multiplier}x Bonus Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            {STREAK_TIERS.map((tier, i) => (
              <div key={tier.days} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all',
                  currentStreak >= tier.days
                    ? cn(tier.bgColor, 'ring-2 ring-offset-1 ring-[var(--border-default)]')
                    : 'bg-[var(--bg-tertiary)] opacity-40'
                )}>
                  {tier.emoji}
                </div>
                <span className={cn(
                  'text-xs font-medium text-center leading-tight',
                  currentStreak >= tier.days ? tier.color : 'text-[var(--text-muted)]'
                )}>
                  {tier.label}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {tier.days === 0 ? 'Start' : `${tier.days}d`}
                </span>
                {i < STREAK_TIERS.length - 1 && (
                  <div className={cn(
                    'absolute hidden'
                  )} />
                )}
              </div>
            ))}
          </div>
          {nextTier && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Progress to {nextTier.label}</span>
                <span>{currentStreak}/{nextTier.days} days</span>
              </div>
              <Progress
                value={(currentStreak / nextTier.days) * 100}
                className="h-2"
              />
              <p className="text-xs text-[var(--text-muted)]">
                {nextTier.days - currentStreak} more day{nextTier.days - currentStreak !== 1 ? 's' : ''} to unlock {nextTier.multiplier}x nut multiplier
              </p>
            </div>
          )}
          {!nextTier && (
            <div className="flex items-center gap-2 text-amber-600">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">Maximum tier reached! Legendary status achieved.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skin Shop */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Squirrel Skins</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            {unlockedSkinIds.size}/{skinList.length} unlocked
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Earn nuts by completing tasks, then spend them on new looks. Click an owned skin to equip it.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {skinList.map((skin) => {
            const isOwned = unlockedSkinIds.has(skin.id);
            const isActive = profile?.currentSkin === skin.id || (skin.id === 'default' && !profile?.currentSkin);
            const affordable = (profile?.totalNuts || 0) >= skin.cost;

            return (
              <button
                key={skin.id}
                onClick={() => handleSkinClick(skin)}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-150 text-left',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                  isActive
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/8 shadow-sm'
                    : isOwned
                    ? 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-tertiary)]'
                    : affordable
                    ? 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-default)] hover:bg-[var(--bg-tertiary)] cursor-pointer'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-card)] opacity-70 cursor-not-allowed'
                )}
              >
                {/* Status indicator top-right */}
                <div className="absolute top-2 right-2">
                  {isActive ? (
                    <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                      <Check className="w-3 h-3 text-[var(--text-on-accent)]" />
                    </div>
                  ) : isOwned ? (
                    <div className="w-5 h-5 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[var(--success)]" />
                    </div>
                  ) : (
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center',
                      affordable ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--bg-tertiary)]'
                    )}>
                      <Lock className={cn('w-3 h-3', affordable ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]')} />
                    </div>
                  )}
                </div>

                {/* Skin emoji */}
                <div className={cn(
                  'text-4xl leading-none select-none',
                  !isOwned && !affordable && 'grayscale opacity-50'
                )}>
                  {skin.emoji}
                </div>

                {/* Skin info */}
                <div className="text-center space-y-0.5 w-full">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{skin.name}</p>
                  {isActive ? (
                    <Badge className="text-xs gap-1 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/20">
                      Equipped
                    </Badge>
                  ) : isOwned ? (
                    <p className="text-xs text-[var(--success)] font-medium">Tap to equip</p>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs">🥜</span>
                      <span className={cn(
                        'text-xs font-semibold',
                        affordable ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                      )}>
                        {skin.cost.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={!!selectedSkin} onOpenChange={(open) => { if (!open) setSelectedSkin(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Unlock Skin</DialogTitle>
            <DialogDescription>
              Spend your nuts to unlock this squirrel look.
            </DialogDescription>
          </DialogHeader>

          {selectedSkin && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-24 h-24 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-center">
                <span className="text-5xl">{selectedSkin.emoji}</span>
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-[var(--text-primary)]">{selectedSkin.name}</h3>
                {selectedSkin.description && (
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">{selectedSkin.description}</p>
                )}
              </div>

              <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Cost</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                    <span>🥜</span>
                    <span>{selectedSkin.cost.toLocaleString()}</span>
                  </div>
                </div>
                <Separator className="bg-[var(--border-subtle)]" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Your balance</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                    <span>🥜</span>
                    <span>{(profile?.totalNuts || 0).toLocaleString()}</span>
                  </div>
                </div>
                {!canAfford && (
                  <>
                    <Separator className="bg-[var(--border-subtle)]" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--danger)]">Shortfall</span>
                      <div className="flex items-center gap-1.5 font-semibold text-[var(--danger)]">
                        <span>🥜</span>
                        <span>{nutsShortfall.toLocaleString()} more needed</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!canAfford && (
                <p className="text-xs text-[var(--text-muted)] text-center">
                  Complete more tasks to earn the remaining {nutsShortfall.toLocaleString()} nuts.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSelectedSkin(null)}
              className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!canAfford || isPurchasing}
              className="gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--text-on-accent)] disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              {isPurchasing ? 'Buying...' : `Buy for ${selectedSkin?.cost.toLocaleString()} 🥜`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
