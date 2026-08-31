import { useState } from 'react';
import { Wifi, RotateCw, Sliders } from 'lucide-react';

interface TopNavBarProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  isOnline?: boolean;
}

export default function TopNavBar({
  title = 'Dadeway Bingo',
  subtitle,
  onRefresh,
  onOpenSettings,
  isOnline = true,
}: TopNavBarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="top-app-bar">
      <div className="top-bar-left">
        <div className="app-logo-badge">
          <span className="logo-emoji">👑</span>
        </div>
        <div className="app-title-group">
          <h1 className="app-title-text">{title}</h1>
          <div className="app-title-accent-bar" />
          {subtitle && <span className="app-subtitle-text">{subtitle}</span>}
        </div>
      </div>

      <div className="top-bar-right">
        {/* Live Network Beacon */}
        <div className={`connection-pill ${isOnline ? 'online' : 'offline'}`} title={isOnline ? 'Connected' : 'Offline'}>
          <Wifi size={15} strokeWidth={2.5} />
        </div>

        {/* Quick Refresh Button */}
        <button
          className={`top-bar-icon-btn ${isRefreshing ? 'spin' : ''}`}
          onClick={handleRefreshClick}
          aria-label="Refresh Data"
          title="Refresh"
        >
          <RotateCw size={17} />
        </button>

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            className="top-bar-icon-btn"
            onClick={onOpenSettings}
            aria-label="Settings"
            title="Open Settings"
          >
            <Sliders size={17} />
          </button>
        )}
      </div>
    </header>
  );
}
