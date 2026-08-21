import { useTheme } from '../useTheme';
import { ChevronLeft, Info, Sun, Moon, Circle, Trophy } from 'lucide-react';

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

  return (
    <header className="game-header-v2">
      {/* Top Row: Navigation, Room Title & Quick Controls */}
      <div className="game-header-main-row">
        <div className="game-header-brand">
          <button className="game-header-btn" onClick={onBack} aria-label="Leave room" title="Back to Lobby">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="game-header-title">{gameName}</span>
              {tier && (
                <span className={`game-header-badge tier-${tier.toLowerCase()}`}>
                  {tier}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="game-header-actions">
          {onShowInfo && (
            <button className="game-header-btn" onClick={onShowInfo} aria-label="Game Info" title="Game Rules & Info">
              <Info size={17} />
            </button>
          )}
          <button className="game-header-btn" onClick={toggle} aria-label="Toggle Theme" title="Switch Dark/Light Theme">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>

      {/* Sub Row: Prize Payout, Drawn Counter & Live Beacon */}
      <div className="game-header-sub-row">
        {potEtb !== undefined && (
          <div className="header-prize-pill">
            <Trophy size={13} />
            <span>{(potEtb * 0.85).toFixed(0)} ETB PRIZE</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          {drawnCount !== undefined && drawnCount > 0 && (
            <span className="header-drawn-pill">
              {drawnCount}/75 Balls
            </span>
          )}

          {isLive && (
            <span className="header-live-pill">
              <Circle size={7} fill="currentColor" />
              LIVE
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
