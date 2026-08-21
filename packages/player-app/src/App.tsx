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
import { Gamepad2, Wallet, User, Trophy } from 'lucide-react';

import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import WalletPage from './pages/Wallet';
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
        <div className="bottom-nav-container">
          <nav className="bottom-nav">
            <Link to="/lobby" className={isActive('/lobby')}>
              <Gamepad2 size={22} strokeWidth={2.2} />
              <span className="nav-label">{t('lobby.title') || 'Lobby'}</span>
            </Link>
            <Link to="/wallet" className={isActive('/wallet')}>
              <Wallet size={22} strokeWidth={2.2} />
              <span className="nav-label">{t('wallet.title') || 'Wallet'}</span>
            </Link>
            <Link to="/lobby" className="nav-center-action" aria-label="Play">
              <Trophy size={24} strokeWidth={2.5} />
            </Link>
            <Link to="/profile" className={isActive('/profile')}>
              <User size={22} strokeWidth={2.2} />
              <span className="nav-label">{t('profile.title') || 'Profile'}</span>
            </Link>
          </nav>
        </div>
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
          <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

