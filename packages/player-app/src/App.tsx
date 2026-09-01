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
import AdminPortal from './pages/AdminPortal';
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

// Layout wrapper including persistent bottom navigation
function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const activeRoomId = useAppStore((state) => state.activeRoomId);

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-item nav-item-active' : 'nav-item';
  };

  const isRoomActive = location.pathname.startsWith('/room/');

  // Get active or last joined room
  const targetLiveRoom = activeRoomId || (typeof window !== 'undefined' ? localStorage.getItem('bingo_last_joined_room') : null) || 'room-classic-hall';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '76px' }}>
        <Outlet />
      </div>

      {/* Persistent Bottom Navigation — Visible Everywhere */}
      <div className="bottom-nav-container">
        <nav className="bottom-nav">
          <Link to="/lobby" className={isActive('/lobby')}>
            <Gamepad2 size={20} strokeWidth={2.2} />
            <span className="nav-label">{t('lobby.title') || 'Lobby'}</span>
          </Link>
          
          <Link to="/wallet" className={isActive('/wallet')}>
            <Wallet size={20} strokeWidth={2.2} />
            <span className="nav-label">{t('wallet.title') || 'Wallet'}</span>
          </Link>

          {/* 3rd Navigation Button: 3D Bingo Ball with Number */}
          <Link 
            to={`/room/${targetLiveRoom}`} 
            className={`nav-ball-button-wrap ${isRoomActive ? 'active' : ''}`}
            aria-label="Live Bingo Game"
            title="Enter Live Game"
          >
            <div className="nav-bingo-ball">
              <div className="nav-bingo-ball-inner">
                <span className="nav-bingo-ball-letter">B</span>
                <span className="nav-bingo-ball-number">77</span>
              </div>
              <span className="nav-bingo-ball-live-pill">LIVE</span>
            </div>
            <span className="nav-label" style={{ fontWeight: 800, color: isRoomActive ? 'var(--primary-blue)' : 'inherit' }}>
              Game
            </span>
          </Link>

          <Link to="/profile" className={isActive('/profile')}>
            <User size={20} strokeWidth={2.2} />
            <span className="nav-label">{t('profile.title') || 'Profile'}</span>
          </Link>
        </nav>
      </div>
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
        
        {/* Admin Portal — standalone with its own PIN authentication */}
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/admin-portal" element={<AdminPortal />} />
        
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

