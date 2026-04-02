import { SKINS, type Skin } from '../types';
import { useProfile, useStreakMultiplier, useUnlockedSkins, useGamificationStore } from '../stores/gamificationStore';
import { useTaskStats } from '../stores/taskStore';
import { useState } from 'react';
import { Modal } from '../components/common/Modal';

export function VictoryOak() {
  const profile = useProfile();
  const multiplier = useStreakMultiplier();
  const unlockedSkins = useUnlockedSkins();
  const stats = useTaskStats();
  const { unlockSkin, setActiveSkin } = useGamificationStore();

  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const skinList = Object.values(SKINS);
  const unlockedSkinIds = new Set(unlockedSkins?.map((s) => s.skinId) || ['default']);
  // Default skin is always owned
  unlockedSkinIds.add('default');

  const currentSkinEmoji = profile?.currentSkin
    ? SKINS[profile.currentSkin as keyof typeof SKINS]?.emoji || '🐿️'
    : '🐿️';

  const handleSkinClick = (skin: Skin) => {
    const isOwned = unlockedSkinIds.has(skin.id);

    if (isOwned) {
      // Equip the skin
      setActiveSkin(skin.id);
    } else {
      // Show purchase modal
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
      // Auto-equip the new skin
      await setActiveSkin(selectedSkin.id);
    }
  };

  const canAfford = selectedSkin ? (profile?.totalNuts || 0) >= selectedSkin.cost : false;

  return (
    <div className="p-4">
      {/* Victory Oak Tree */}
      <div className="victory-oak-container mb-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🌳</div>
          <div className="victory-oak-squirrel text-4xl mb-4">{currentSkinEmoji}</div>
          <div className="victory-oak-balance">
            <div className="nut-card" style={{ display: 'inline-flex' }}>
              <div className="nut-card-icon">🥜</div>
              <div className="nut-card-content">
                <div className="nut-card-value">{profile?.totalNuts || 0}</div>
                <div className="nut-card-label">Nuts Stashed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-card-value">{stats?.completed || 0}</div>
          <div className="stat-card-label">Tasks Completed</div>
        </div>
        <div className="streak-card">
          <div className="streak-card-fire">🔥</div>
          <div>
            <div className="streak-card-days">{profile?.currentStreak || 0}</div>
            <div className="streak-card-label">Current Streak</div>
          </div>
          {multiplier > 1 && <span className="streak-badge">{multiplier}x</span>}
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{profile?.longestStreak || 0}</div>
          <div className="stat-card-label">Best Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats?.completionRate || 0}%</div>
          <div className="stat-card-label">Completion Rate</div>
        </div>
      </div>

      {/* Streak Multiplier Info */}
      {multiplier > 1 && (
        <div className="card mb-8 bg-accent">
          <div className="card-body flex items-center gap-4">
            <div className="text-3xl">🔥</div>
            <div>
              <div className="font-bold text-lg">
                {multiplier}x Streak Bonus Active!
              </div>
              <div className="text-sm text-muted">
                {multiplier >= 3
                  ? 'LEGENDARY! 30+ day streak - maximum bonus!'
                  : multiplier >= 2
                  ? '14+ day streak - keep it going!'
                  : '7+ day streak - building momentum!'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Squirrel Skins */}
      <section>
        <h2 className="text-xl mb-4">Squirrel Skins</h2>
        <p className="text-muted mb-4">
          Unlock new looks for your squirrel by earning nuts! Click owned skins to equip them.
        </p>
        <div className="skin-grid">
          {skinList.map((skin) => {
            const isOwned = unlockedSkinIds.has(skin.id);
            const isActive = profile?.currentSkin === skin.id || (skin.id === 'default' && !profile?.currentSkin);

            return (
              <button
                key={skin.id}
                onClick={() => handleSkinClick(skin)}
                className={`skin-card ${isOwned ? 'owned' : 'locked'} ${isActive ? 'active' : ''}`}
                style={{ cursor: 'pointer', border: 'none', background: 'none' }}
              >
                <div className="skin-avatar">{skin.emoji}</div>
                <div className="skin-name">{skin.name}</div>
                <div className="skin-cost">
                  {isOwned ? (isActive ? '✓ Equipped' : 'Click to equip') : `🥜 ${skin.cost}`}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Purchase Modal */}
      <Modal
        isOpen={!!selectedSkin}
        onClose={() => setSelectedSkin(null)}
        title="Unlock Skin"
        size="sm"
      >
        {selectedSkin && (
          <div className="text-center">
            <div className="text-6xl mb-4">{selectedSkin.emoji}</div>
            <h3 className="text-xl mb-2">{selectedSkin.name}</h3>
            <p className="text-muted mb-4">{selectedSkin.description}</p>

            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-2xl">🥜</span>
              <span className="text-2xl font-bold">{selectedSkin.cost}</span>
              <span className="text-muted">nuts</span>
            </div>

            {!canAfford && (
              <p className="text-danger mb-4">
                You need {selectedSkin.cost - (profile?.totalNuts || 0)} more nuts!
              </p>
            )}

            <div className="flex gap-2 justify-center">
              <button
                className="btn btn-ghost"
                onClick={() => setSelectedSkin(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-nut"
                onClick={handlePurchase}
                disabled={!canAfford || isPurchasing}
              >
                {isPurchasing ? 'Purchasing...' : `Buy for ${selectedSkin.cost} 🥜`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
