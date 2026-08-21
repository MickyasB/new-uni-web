import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BINGO_PATTERNS, PatternCategory, BingoPattern } from '@bingo/shared';
import { Sparkles, Star, Palette, RotateCw, Boxes, Target, Info, Check } from 'lucide-react';

interface PatternHintsModalProps {
  gameName: string;
  onClose: () => void;
}

export default function PatternHintsModal({ gameName, onClose }: PatternHintsModalProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<PatternCategory | 'all'>('all');

  const categories: { id: PatternCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Patterns', icon: <Sparkles size={14} /> },
    { id: 'standard', label: 'Standard', icon: <Star size={14} /> },
    { id: 'shapes', label: 'Shapes & Objects', icon: <Palette size={14} /> },
    { id: 'crazy', label: 'Crazy (Rotatable)', icon: <RotateCw size={14} /> },
    { id: 'anywhere', label: 'Anywhere Blocks', icon: <Boxes size={14} /> },
  ];

  const filteredPatterns = selectedCategory === 'all' 
    ? BINGO_PATTERNS 
    : BINGO_PATTERNS.filter(p => p.category === selectedCategory);

  return (
    <div className="modal-ui-overlay" onClick={onClose}>
      <div 
        className="modal-ui-container" 
        style={{ maxWidth: '480px', maxHeight: '90vh' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-ui-header">
          <div className="modal-ui-title" style={{ fontFamily: 'var(--font-heading)' }}>
            <Target size={18} style={{ color: 'var(--primary-amber)' }} />
            <span>{gameName ? `${gameName} — Patterns` : (t('game.patternHints') || 'Winning Patterns & Rules')}</span>
          </div>
          <button className="modal-ui-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-ui-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Rule Notice */}
          <div style={{
            background: 'rgba(229, 161, 0, 0.08)',
            border: '1px solid rgba(229, 161, 0, 0.25)',
            borderRadius: '12px',
            padding: '0.85rem',
            fontSize: '0.8rem',
            lineHeight: 1.45,
            color: 'var(--text-light)'
          }}>
            <div style={{ fontWeight: 800, color: 'var(--primary-amber)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-heading)' }}>
              <Info size={15} />
              <span>Winning Pattern Rules</span>
            </div>
            <span>
              The caller locks the target winning pattern <strong>before</strong> the first number is drawn. 
              Match the target shape on any of your cards to claim <strong>BINGO</strong>!
            </span>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '20px',
                  border: selectedCategory === cat.id ? '1px solid var(--primary-amber)' : '1px solid var(--card-border)',
                  background: selectedCategory === cat.id ? 'rgba(229, 161, 0, 0.15)' : 'var(--surface-raised)',
                  color: selectedCategory === cat.id ? 'var(--primary-amber)' : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Patterns Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: '0.75rem',
          }}>
            {filteredPatterns.map((pattern: BingoPattern) => (
              <div 
                key={pattern.id}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '14px',
                  padding: '0.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                {/* Pattern Title & Badge */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-light)', fontFamily: 'var(--font-heading)' }}>
                    {pattern.name}
                  </div>
                  {pattern.isCrazy && (
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      color: '#a855f7',
                      background: 'rgba(168, 85, 247, 0.15)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      marginTop: '2px'
                    }}>
                      <RotateCw size={10} /> 90° Rotations
                    </span>
                  )}
                  {pattern.isAnywhereBlock && (
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      color: '#3b82f6',
                      background: 'rgba(59, 130, 246, 0.15)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      marginTop: '2px'
                    }}>
                      <Boxes size={10} /> Anywhere
                    </span>
                  )}
                </div>

                {/* 5x5 Lighted Board Mini-Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '2px',
                  width: '90px',
                  height: '90px',
                  background: 'var(--surface-raised)',
                  padding: '4px',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)'
                }}>
                  {pattern.grid.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      const isFree = rIdx === 2 && cIdx === 2;
                      const isActive = cell;
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          style={{
                            borderRadius: '3px',
                            background: isActive
                              ? 'linear-gradient(135deg, #E5A100 0%, #B37400 100%)'
                              : isFree
                              ? 'rgba(229, 161, 0, 0.25)'
                              : 'var(--cell-bg)',
                            border: isActive
                              ? '1px solid #FFD055'
                              : '1px solid var(--cell-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.55rem',
                            color: '#ffffff',
                            fontWeight: 800,
                            boxShadow: isActive ? '0 0 6px rgba(229, 161, 0, 0.6)' : 'none'
                          }}
                        >
                          {isFree && !isActive ? <Sparkles size={8} /> : ''}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pattern Description */}
                <div style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.3
                }}>
                  {pattern.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-ui-footer">
          <button 
            className="btn-ui btn-ui-primary btn-ui-md btn-ui-full" 
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <Check size={16} />
            <span>{t('common.close') || 'Got It — Back to Game'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
