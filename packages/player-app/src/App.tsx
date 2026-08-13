import React, { useEffect } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useLocation,
  Outlet
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from './store';
import { useTheme } from './useTheme';

import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import SplashScreen from './components/SplashScreen';
import './index.css';

// Guard for authenticated users
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAppStore();

  if (!initialized || loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Guard for auth screens (login, register)
function AuthRoute({ children, mode }: { children: React.ReactNode; mode: 'login' | 'register' }) {
  const { user, loading, initialized } = useAppStore();

  if (!initialized || loading) {
    return <SplashScreen />;
  }

  if (mode === 'login') {
    if (user) {
      return <Navigate to="/lobby" replace />;
    }
  } else if (mode === 'register') {
    if (user) {
      return <Navigate to="/lobby" replace />;
    }
  }

  return <>{children}</>;
}

// Layout wrapper including bottom navigation
function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  // If in active room, hide bottom nav to maximize bingo board layout
  const showNav = !location.pathname.startsWith('/room/');

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-item nav-item-active' : 'nav-item';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>

      {showNav && (
        <nav className="bottom-nav">
          <Link to="/lobby" className={isActive('/lobby')}>
            <span className="nav-icon">🎮</span>
            <span>{t('lobby.title') || 'Lobby'}</span>
          </Link>
          <Link to="/wallet" className={isActive('/wallet')}>
            <span className="nav-icon">💳</span>
            <span>{t('wallet.balance') || 'Wallet'}</span>
          </Link>
          {/* Theme toggle in the nav centre */}
          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/profile" className={isActive('/profile')}>
            <span className="nav-icon">👤</span>
            <span>{t('profile.title') || 'Profile'}</span>
          </Link>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  const initialize = useAppStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthRoute mode="login"><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute mode="register"><Register /></AuthRoute>} />
        
        {/* Main App Layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/lobby" replace />} />
          <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route path="/room/:roomId" element={<ProtectedRoute><Room /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
