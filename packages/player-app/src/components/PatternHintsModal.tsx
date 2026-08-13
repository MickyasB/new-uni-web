import { useTranslation } from 'react-i18next';

interface PatternHintsModalProps {
  gameName: string;
  onClose: () => void;
}

// Predefined patterns showing valid and invalid BINGO patterns
// Each pattern is a 5x5 grid where true = highlighted cell
const CORRECT_PATTERNS: { label: string; grid: boolean[][] }[] = [
  {
    label: 'Horizontal Line',
    grid: [
      [true, true, true, true, true],
      [false, false, false, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
  },
  {
    label: 'Vertical Line',
    grid: [
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, true, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false],
    ],
  },
  {
    label: 'Diagonal',
    grid: [
      [true, false, false, false, false],
      [false, true, false, false, false],
      [false, false, true, false, false],
      [false, false, false, true, false],
      [false, false, false, false, true],
    ],
  },
  {
    label: 'Four Corners',
    grid: [
      [true, false, false, false, true],
      [false, false, false, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [true, false, false, false, true],
    ],
  },
  {
    label: 'Full House',
    grid: [
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
    ],
  },
];

const WRONG_PATTERNS: { label: string; grid: boolean[][] }[] = [
  {
    label: 'L-Shape',
    grid: [
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, true, false, false],
      [true, false, false, false, false],
      [true, true, true, true, true],
    ],
  },
  {
    label: 'Random',
    grid: [
      [true, false, true, false, false],
      [false, false, false, true, false],
      [false, true, true, false, false],
      [true, false, false, false, true],
      [false, false, true, false, false],
    ],
  },
];

export default function PatternHintsModal({ gameName, onClose }: PatternHintsModalProps) {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span style={{ fontSize: '1.3rem' }}>💡</span>
          <span>{t('game.patternHints') || 'Pattern Hints'}</span>
        </div>

        <p className="modal-subtitle">
          {t('game.patternHintsDesc') || `Valid and invalid BINGO patterns for "${gameName}". The first player to complete any valid pattern wins!`}
        </p>

        {/* Valid Patterns */}
        <div className="pattern-section-label correct">
          ✓ {t('game.validPatterns') || 'Valid Patterns'}
        </div>
        <div className="patterns-grid">
          {CORRECT_PATTERNS.map((pattern, i) => (
            <div key={`correct-${i}`} className="pattern-card">
              <span className="pattern-label correct">{pattern.label}</span>
              <div className="pattern-mini-grid">
                {pattern.grid.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const isFree = rIdx === 2 && cIdx === 2;
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`pattern-mini-cell ${cell ? 'active-correct' : ''} ${isFree ? 'free-marker' : ''}`}
                      >
                        {isFree && !cell ? '★' : ''}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Invalid Patterns */}
        <div className="pattern-section-label wrong" style={{ marginTop: '1rem' }}>
          ✗ {t('game.invalidPatterns') || 'Invalid Patterns'}
        </div>
        <div className="patterns-grid">
          {WRONG_PATTERNS.map((pattern, i) => (
            <div key={`wrong-${i}`} className="pattern-card">
              <span className="pattern-label wrong">{pattern.label}</span>
              <div className="pattern-mini-grid">
                {pattern.grid.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const isFree = rIdx === 2 && cIdx === 2;
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`pattern-mini-cell ${cell ? 'active-wrong' : ''} ${isFree ? 'free-marker' : ''}`}
                      >
                        {isFree && !cell ? '★' : ''}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          {t('common.close') || 'Close'}
        </button>
      </div>
    </div>
  );
}
