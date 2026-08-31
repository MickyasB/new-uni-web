import { X, Sliders, Volume2, Bell, Info, Trash2, Check, Sparkles } from 'lucide-react';

export const MARKER_COLORS = [
  { id: 'gold', name: 'Sunburst Yellow', hex: '#EAB308' },
  { id: 'blue', name: 'Soft Blue', hex: '#2563EB' },
  { id: 'coral', name: 'Coral Blush', hex: '#FB7185' },
  { id: 'green', name: 'Emerald', hex: '#059669' },
  { id: 'purple', name: 'Amethyst', hex: '#7C3AED' },
  { id: 'amber', name: 'Amber', hex: '#F59E0B' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoDaub?: boolean;
  onToggleAutoDaub?: () => void;
  onRemoveAllCards?: () => void;
  hasCards?: boolean;
  isSoundEnabled?: boolean;
  onToggleSound?: () => void;
  selectedMarkerColor?: string;
  onSelectMarkerColor?: (color: string) => void;
  onOpenAbout?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  isAutoDaub = false,
  onToggleAutoDaub,
  onRemoveAllCards,
  hasCards = false,
  isSoundEnabled = true,
  onToggleSound,
  selectedMarkerColor = 'gold',
  onSelectMarkerColor,
  onOpenAbout,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div
        className="settings-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Drag Handle Indicator */}
        <div className="sheet-drag-handle" />

        {/* Sheet Header */}
        <div className="sheet-header">
          <div className="sheet-title-group">
            <div className="sheet-icon-badge">
              <Sliders size={18} />
            </div>
            <h2 className="sheet-title">Settings</h2>
          </div>
          <button
            className="sheet-close-btn"
            onClick={onClose}
            aria-label="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sheet Content Body */}
        <div className="sheet-body">
          {/* Section: Gameplay Automation */}
          {onToggleAutoDaub && (
            <div className="sheet-section-card">
              <div className="sheet-row">
                <div className="sheet-row-left">
                  <div className="sheet-row-icon orange">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="sheet-row-label">
                      Automatically marks called numbers
                    </span>
                    <span className="sheet-row-sub">
                      Auto-daub cards as balls are called
                    </span>
                  </div>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={isAutoDaub}
                    onChange={onToggleAutoDaub}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              {hasCards && onRemoveAllCards && (
                <div
                  className="sheet-row sheet-row-action danger"
                  onClick={onRemoveAllCards}
                >
                  <div className="sheet-row-left">
                    <div className="sheet-row-icon red">
                      <Trash2 size={16} />
                    </div>
                    <div>
                      <span className="sheet-row-label danger-text">
                        Remove All Cards
                      </span>
                      <span className="sheet-row-sub">
                        Clear current active cards from table
                      </span>
                    </div>
                  </div>
                  <span className="sheet-chevron">›</span>
                </div>
              )}
            </div>
          )}

          {/* Section: General Settings */}
          <div className="sheet-group-label">SETTINGS</div>
          <div className="sheet-section-card">
            {/* Sound Toggle */}
            <div className="sheet-row">
              <div className="sheet-row-left">
                <div className="sheet-row-icon blue">
                  <Volume2 size={16} />
                </div>
                <div>
                  <span className="sheet-row-label">Sound Effects</span>
                  <span className="sheet-row-sub">
                    Daub sounds, ball voice, victory chimes
                  </span>
                </div>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={isSoundEnabled}
                  onChange={onToggleSound}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Notifications */}
            <div className="sheet-row">
              <div className="sheet-row-left">
                <div className="sheet-row-icon purple">
                  <Bell size={16} />
                </div>
                <div>
                  <span className="sheet-row-label">Notifications</span>
                  <span className="sheet-row-sub">Game start and win alerts</span>
                </div>
              </div>
              <span className="sheet-badge-val">Always ›</span>
            </div>
          </div>

          {/* Section: Appearance (Marker Color Swatches) */}
          <div className="sheet-group-label">APPEARANCE</div>
          <div className="sheet-section-card">
            <div className="sheet-marker-picker">
              <div className="sheet-marker-label">
                <span>🎨 Marker Daub Color</span>
                <span className="marker-name-active">
                  {MARKER_COLORS.find((c) => c.id === selectedMarkerColor)?.name || 'Rich Gold'}
                </span>
              </div>

              <div className="marker-swatches">
                {MARKER_COLORS.map((c) => (
                  <button
                    key={c.id}
                    className={`marker-color-btn ${selectedMarkerColor === c.id ? 'active' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => {
                      onSelectMarkerColor?.(c.id);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('bingo_marker_color', c.id);
                      }
                    }}
                    title={c.name}
                    aria-label={`Select ${c.name} marker color`}
                  >
                    {selectedMarkerColor === c.id && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Management / About */}
          <div className="sheet-group-label">MANAGEMENT</div>
          <div className="sheet-section-card">
            <div
              className="sheet-row sheet-row-action"
              onClick={onOpenAbout}
            >
              <div className="sheet-row-left">
                <div className="sheet-row-icon slate">
                  <Info size={16} />
                </div>
                <div>
                  <span className="sheet-row-label">About Bingo Platform</span>
                  <span className="sheet-row-sub">
                    Provably Fair RNG, Rules & Version v2.4
                  </span>
                </div>
              </div>
              <span className="sheet-chevron">›</span>
            </div>
          </div>
        </div>

        {/* Sheet Footer Action Button */}
        <div className="sheet-footer">
          <button className="sheet-action-btn" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
