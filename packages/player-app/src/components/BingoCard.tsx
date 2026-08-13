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
  rank?: number; // 1 = best card, 2, 3...
  chanceScore?: number; // 0-1, how close to winning
}

const COLUMN_LETTERS = ['B', 'I', 'N', 'G', 'O'];

function getColumnClass(colIndex: number): string {
  const classes = ['col-b', 'col-i', 'col-n', 'col-g', 'col-o'];
  return classes[colIndex] || '';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'bingo': return '🎉 Bingo!';
    case 'checking': return '⏳ Checking...';
    case 'not-registered': return '⏳ Ready';
    case 'finished': return '— Game Over';
    case 'playing': return '';
    default: return '';
  }
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
  chanceScore
}: BingoCardProps) {
  const shortId = cardId.length > 6 ? cardId.substring(0, 5) : cardId;
  const statusLabel = getStatusLabel(status);

  // Count marked cells for progress indicator
  let markedCount = 1; // free cell
  if (markedGrid) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 2 && c === 2) continue;
        if (markedGrid[r]?.[c]) markedCount++;
      }
    }
  }
  const progress = Math.round((markedCount / 25) * 100);

  // Urgency detection — check if 1 away from any win
  let isOneAway = false;
  if (markedGrid && status === 'playing' && !isBlocked) {
    // Check horizontal lines
    for (let r = 0; r < 5; r++) {
      const rowMarked = markedGrid[r]?.filter(Boolean).length || 0;
      if (rowMarked === 4) isOneAway = true;
    }
    // Check vertical lines
    for (let c = 0; c < 5; c++) {
      let colMarked = 0;
      for (let r = 0; r < 5; r++) {
        if (markedGrid[r]?.[c]) colMarked++;
      }
      if (colMarked === 4) isOneAway = true;
    }
    // Check diagonals
    let diag1 = 0, diag2 = 0;
    for (let i = 0; i < 5; i++) {
      if (markedGrid[i]?.[i]) diag1++;
      if (markedGrid[i]?.[4 - i]) diag2++;
    }
    if (diag1 === 4 || diag2 === 4) isOneAway = true;
    // Check corners (3/4)
    const corners = [
      markedGrid[0]?.[0], markedGrid[0]?.[4],
      markedGrid[4]?.[0], markedGrid[4]?.[4]
    ].filter(Boolean).length;
    if (corners === 3) isOneAway = true;
  }

  const canInteract = status === 'playing' && !isBlocked;

  return (
    <div className={`bingo-card-v2 ${isOneAway ? 'one-away' : ''} ${claimableTiers && claimableTiers.length > 0 ? 'has-claim' : ''} ${isBlocked ? 'card-blocked' : ''}`}>
      {/* Header strip */}
      <div className="card-header-strip">
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Rank badge */}
          {rank !== undefined && rank >= 1 && status === 'playing' && (
            <span className={`card-rank-badge ${rank === 1 ? 'rank-best' : ''}`}>
              {rank === 1 ? '⭐' : `#${rank}`}
            </span>
          )}
          <span style={{ opacity: 0.6 }}>⊞</span>
          <span>{shortId}</span>
        </span>
        <span style={{
          fontSize: '0.6rem',
          color: 'rgba(165,180,252,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            display: 'inline-block',
            width: `${progress}%`,
            maxWidth: '40px',
            minWidth: '4px',
            height: '3px',
            background: 'linear-gradient(90deg, #818cf8, #a5b4fc)',
            borderRadius: '2px',
            transition: 'width 0.4s ease'
          }} />
          {progress}%
        </span>
        {onClose && (
          <button className="card-close-btn" onClick={onClose} aria-label="Close card">✕</button>
        )}
      </div>

      {/* Blocked card banner */}
      {isBlocked && (
        <div className="card-blocked-badge">
          🚫 BLOCKED — False Claim
        </div>
      )}

      {/* 1 AWAY Urgency Badge */}
      {isOneAway && !isBlocked && (
        <div className="one-away-badge">
          🔥 1 AWAY!
        </div>
      )}

      {/* Chance meter — shows how close to nearest win */}
      {chanceScore !== undefined && chanceScore > 0 && status === 'playing' && !isBlocked && (
        <div className="chance-meter-bar">
          <div className="chance-meter-fill" style={{ width: `${Math.round(chanceScore * 100)}%` }} />
          <span className="chance-meter-label">
            {Math.round(chanceScore * 100)}% to win
          </span>
        </div>
      )}

      {/* Status badge */}
      {statusLabel && (
        <div className={`card-status-badge ${status}`}>
          {statusLabel}
        </div>
      )}

      {/* BINGO Column Headers */}
      <div className="bingo-col-headers">
        {COLUMN_LETTERS.map((letter, i) => (
          <div key={letter} className={`bingo-col-header ${getColumnClass(i)}`}>
            {letter}
          </div>
        ))}
      </div>

      {/* Number Grid — tappable for manual daubing */}
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
                  ★
                </div>
              );
            }

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`card-cell ${isAutoMarked ? `marked ${colClass}` : ''} ${isManuallyMarked ? `manual-marked ${colClass}` : ''} ${isFlashing ? 'flash-cell' : ''} ${isBlocked ? 'cell-blocked' : ''}`}
                onClick={canInteract && onCellTap && !isAutoMarked ? () => onCellTap(rIdx, cIdx) : undefined}
                role={canInteract && onCellTap && !isAutoMarked ? 'button' : undefined}
                aria-label={canInteract && onCellTap && !isAutoMarked ? `${isManuallyMarked ? 'Unmark' : 'Mark'} number ${num}` : undefined}
                tabIndex={canInteract && onCellTap && !isAutoMarked ? 0 : undefined}
              >
                {num}
              </div>
            );
          })
        )}
      </div>

      {/* Single BINGO Claim Button — hidden when blocked */}
      {claimableTiers && claimableTiers.length > 0 && !isBlocked && (
        <div style={{
          padding: '0.6rem 0.5rem',
          borderTop: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(245,158,11,0.05), rgba(245,158,11,0.15))'
        }}>
          <button
            onClick={() => onClaimBingo?.(claimableTiers[0])}
            disabled={claimLoading}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              border: '2px solid #fbbf24',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '0.9rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: claimLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              animation: 'goldGlowPulse 1.2s ease-in-out infinite alternate',
              opacity: claimLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {claimLoading ? (
              <>⏳ VERIFYING BINGO...</>
            ) : (
              <>🔥 BINGO! (CLAIM GRAND POT)</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
