import { useTheme } from '../useTheme';

interface GameHeaderProps {
  gameName: string;
  tier?: string;
  potEtb?: number;
  drawnCount?: number;
  onBack: () => void;
  onShowInfo?: () => void;
  isLive?: boolean;
}

export default function GameHeader({ gameName, tier, potEtb, drawnCount, onBack, onShowInfo, isLive }: GameHeaderProps) {
  const { theme, toggle } = useTheme();
  const tierEmoji = tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : tier === 'bronze' ? '🥉' : '🎱';

  return (
    <div className="game-header-v2">
      {/* Top Row: Back, Title, Tier & Actions */}
      <div className="game-header-main-row">
        <div className="game-header-brand">
          <button className="game-header-btn" onClick={onBack} aria-label="Back">
            ‹
          </button>
          <span className="game-header-title">{gameName}</span>
          {tier && (
            <span className="game-header-badge">{tierEmoji} {tier}</span>
          )}
        </div>

        <div className="game-header-actions">
          {onShowInfo && (
            <button className="game-header-btn" onClick={onShowInfo} aria-label="Info">ℹ</button>
          )}
          <button className="game-header-btn" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Sub Row: Prize, Live status & Progress */}
      {(potEtb !== undefined || isLive || drawnCount !== undefined) && (
        <div className="game-header-sub-row">
          {potEtb !== undefined && (
            <span className="header-prize-pill">
              🏆 {(potEtb * 0.85).toFixed(0)} ETB PRIZE
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
            {drawnCount !== undefined && drawnCount > 0 && (
              <span className="header-drawn-pill">
                🎱 {drawnCount}/75
              </span>
            )}

            {isLive && (
              <span className="header-live-pill">
                <span className="live-dot" />
                LIVE
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
