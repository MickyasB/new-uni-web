import { Sparkles, Flame, Trophy, XCircle, CheckCircle2 } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface BingoCardProps {
  cardId: string;
  numbers: number[][];
  markedGrid: boolean[][] | null;
  manualMarks?: boolean[][];
  status: 'bingo' | 'checking' | 'not-registered' | 'finished' | 'playing';
  flashNumber?: number | null;
  claimableTiers?: string[];
  onClaimBingo?: (tier: string) => void;
  claimLoading?: boolean;
  onClose?: () => void;
  onCellTap?: (row: number, col: number) => void;
  isBlocked?: boolean;
  rank?: number;
  chanceScore?: number;
}

const COLUMN_LETTERS = ['B', 'I', 'N', 'G', 'O'];

function getColumnClass(colIndex: number): string {
  return ['col-b', 'col-i', 'col-n', 'col-g', 'col-o'][colIndex] || '';
}

export default function BingoCard({
  cardId,
  numbers,
  markedGrid,
  manualMarks,
  status,
  flashNumber,
  claimableTiers,
  onClaimBingo,
  claimLoading,
  onClose,
  onCellTap,
  isBlocked,
  rank,
}: BingoCardProps) {
  const shortId = cardId.length > 6 ? cardId.substring(0, 6) : cardId;

  // Count marked cells
  let markedCount = 1; // free cell
  if (markedGrid) {
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        if (r === 2 && c === 2) continue;
        if (markedGrid[r]?.[c]) markedCount++;
      }
  }
  const progress = Math.round((markedCount / 25) * 100);

  // Urgency — 1 away from win
  let isOneAway = false;
  if (markedGrid && status === 'playing' && !isBlocked) {
    for (let r = 0; r < 5; r++) {
      if ((markedGrid[r]?.filter(Boolean).length || 0) === 4) isOneAway = true;
    }
    for (let c = 0; c < 5; c++) {
      let colMarked = 0;
      for (let r = 0; r < 5; r++) if (markedGrid[r]?.[c]) colMarked++;
      if (colMarked === 4) isOneAway = true;
    }
    let d1 = 0, d2 = 0;
    for (let i = 0; i < 5; i++) {
      if (markedGrid[i]?.[i]) d1++;
      if (markedGrid[i]?.[4 - i]) d2++;
    }
    if (d1 === 4 || d2 === 4) isOneAway = true;
    const corners = [markedGrid[0]?.[0], markedGrid[0]?.[4], markedGrid[4]?.[0], markedGrid[4]?.[4]].filter(Boolean).length;
    if (corners === 3) isOneAway = true;
  }

  const canInteract = status === 'playing' && !isBlocked;
  const hasDetectedWin = claimableTiers && claimableTiers.length > 0 && !isBlocked;

  const handleCellClick = (r: number, c: number) => {
    soundFX.playDaub();
    if (onCellTap) onCellTap(r, c);
  };

  return (
    <div className={`bingo-card-v2 ${isOneAway ? 'one-away' : ''} ${hasDetectedWin ? 'has-claim' : ''} ${isBlocked ? 'card-blocked' : ''}`}>
      {/* Top Header Strip */}
      <div className="card-header-strip">
        <div className="card-header-left">
          {rank !== undefined && rank >= 1 && status === 'playing' && (
            <span className={`card-rank-badge ${rank === 1 ? 'rank-best' : ''}`}>
              {rank === 1 ? <Trophy size={10} /> : `#${rank}`}
            </span>
          )}
          <span className="card-id-label">Card #{shortId}</span>
        </div>

        <div className="card-header-right">
          {/* Marked count badge */}
          <span className="card-marked-count">
            {markedCount}/24
          </span>
          {onClose && (
            <button className="card-close-btn" onClick={onClose} aria-label="Close card">✕</button>
          )}
        </div>
      </div>

      {/* Claim / Status Banner — Always clickable during active play unless blocked */}
      {isBlocked ? (
        <div className="card-blocked-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <XCircle size={13} />
          <span>MISCALLED — BLOCKED THIS ROUND</span>
        </div>
      ) : status === 'playing' ? (
        <button
          className={`card-claim-banner ${hasDetectedWin ? 'active pulse-win' : 'manual-ready'}`}
          onClick={() => {
            if (hasDetectedWin) {
              soundFX.playBingoVictory();
            } else {
              soundFX.playDaub();
            }
            onClaimBingo?.(claimableTiers?.[0] || 'line');
          }}
          disabled={claimLoading}
          title="Click to claim Bingo whenever you complete a pattern!"
        >
          {claimLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} className="spin" /> Verifying BINGO...
            </span>
          ) : hasDetectedWin ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 900 }}>
              <CheckCircle2 size={16} /> 🎯 BINGO! — CLAIM PRIZE
            </span>
          ) : isOneAway ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Flame size={14} /> 1-AWAY! CALL BINGO
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Trophy size={13} /> CALL BINGO!
            </span>
          )}
        </button>
      ) : null}

      {/* B I N G O Column Header Row */}
      <div className="bingo-col-headers">
        {COLUMN_LETTERS.map((letter, i) => (
          <div key={letter} className={`bingo-col-pill ${getColumnClass(i)}`}>
            {letter}
          </div>
        ))}
      </div>

      {/* 5x5 Number Grid */}
      <div className={`card-number-grid ${canInteract ? 'interactive' : ''}`}>
        {numbers.map((row, rIdx) =>
          row.map((num, cIdx) => {
            const isFree = rIdx === 2 && cIdx === 2;
            const isAutoMarked = isFree || (markedGrid ? markedGrid[rIdx]?.[cIdx] : false);
            const isManuallyMarked = !isAutoMarked && (manualMarks ? manualMarks[rIdx]?.[cIdx] : false);
            const colClass = getColumnClass(cIdx);
            const isFlashing = num === flashNumber;

            if (isFree) {
              return (
                <div key={`${rIdx}-${cIdx}`} className="card-cell free-cell">
                  <div className="free-medallion">
                    <Sparkles size={14} />
                    <span className="free-text">FREE</span>
                  </div>
                </div>
              );
            }

            const isMarked = isAutoMarked || isManuallyMarked;

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`card-cell ${isMarked ? `marked ${colClass}` : ''} ${isFlashing ? 'flash-cell' : ''} ${isBlocked ? 'cell-blocked' : ''}`}
                onClick={canInteract ? () => handleCellClick(rIdx, cIdx) : undefined}
                role={canInteract ? 'button' : undefined}
                tabIndex={canInteract ? 0 : undefined}
                title={canInteract ? 'Tap to mark/daub number' : undefined}
              >
                {isMarked && <span className="daub-ink-stamp" />}
                <span className="cell-number-val">{num}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Mini Progress Bar at bottom */}
      <div className="card-bottom-bar">
        <div className="card-progress-track">
          <div className="card-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
