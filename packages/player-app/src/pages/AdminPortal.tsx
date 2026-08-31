import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Check, X, Search, Users, DollarSign, Activity, Shield, Ban, Eye, RefreshCw, LogOut, ChevronDown, ChevronUp, Wallet, Gamepad2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Types ─── */
interface PendingDeposit {
  id: string;
  playerId: string;
  playerPhone: string;
  playerName: string;
  amount: number;
  ftNumber: string;
  screenshotUrl?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface WithdrawalRequest {
  id: string;
  playerId: string;
  playerName: string;
  playerPhone: string;
  amount: number;
  method: string;
  accountNumber: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PlayerInfo {
  uid: string;
  name: string;
  phone: string;
  balance: number;
  kycVerified: boolean;
  banned: boolean;
  createdAt: string;
  totalDeposits: number;
  totalWithdrawals: number;
}

interface RoomInfo {
  id: string;
  name: string;
  tier: string;
  entryFee: number;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'active' | 'completed';
}

interface Analytics {
  totalUsers: number;
  activeToday: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  activeRooms: number;
  revenue: number;
}

type AdminTab = 'overview' | 'deposits' | 'withdrawals' | 'users' | 'rooms';

const ADMIN_PIN = '7777';
const API_BASE = '/api';

/* ─── Styles ─── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-dark)',
    color: 'var(--text-light)',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    flexDirection: 'column',
  },
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1.5rem',
    background: 'var(--bg-dark)',
  },
  loginCard: {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  loginTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textAlign: 'center' as const,
  },
  loginSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  pinInput: {
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: '12px',
    padding: '0.85rem 1rem',
    color: 'var(--input-text)',
    fontSize: '1.2rem',
    textAlign: 'center' as const,
    letterSpacing: '0.5rem',
    outline: 'none',
    width: '100%',
  },
  header: {
    background: 'var(--header-bg)',
    padding: '0.75rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  },
  headerTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  headerBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  tabBar: {
    display: 'flex',
    overflowX: 'auto' as const,
    background: 'var(--card-bg)',
    borderBottom: '1px solid var(--card-border)',
    padding: '0',
  },
  tab: {
    flex: '1',
    padding: '0.65rem 0.5rem',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.25rem',
    transition: 'color 0.2s, border-color 0.2s',
    whiteSpace: 'nowrap' as const,
  },
  tabActive: {
    color: 'var(--primary-blue)',
    borderBottomColor: 'var(--primary-blue)',
  },
  content: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  card: {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '14px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.65rem',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.65rem',
  },
  statCard: {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '12px',
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.35rem',
  },
  statValue: {
    fontSize: '1.35rem',
    fontWeight: 800,
    fontFamily: 'var(--font-heading)',
    color: 'var(--text-light)',
  },
  statLabel: {
    fontSize: '0.72rem',
    fontWeight: 500,
    color: 'var(--text-muted)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '8px',
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  badgePending: {
    background: 'rgba(245,158,11,0.15)',
    color: '#F59E0B',
    border: '1px solid rgba(245,158,11,0.3)',
  },
  badgeApproved: {
    background: 'rgba(16,185,129,0.15)',
    color: '#10B981',
    border: '1px solid rgba(16,185,129,0.3)',
  },
  badgeRejected: {
    background: 'rgba(251,113,133,0.15)',
    color: '#FB7185',
    border: '1px solid rgba(251,113,133,0.3)',
  },
  actionRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  btnApprove: {
    flex: 1,
    padding: '0.55rem',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    background: 'linear-gradient(135deg, #10B981, #059669)',
    color: '#fff',
    transition: 'transform 0.15s',
  },
  btnReject: {
    flex: 1,
    padding: '0.55rem',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    background: 'linear-gradient(135deg, #FB7185, #E11D48)',
    color: '#fff',
    transition: 'transform 0.15s',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: '12px',
    padding: '0.65rem 0.85rem',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--input-text)',
    fontSize: '0.9rem',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.82rem',
  },
  detailLabel: {
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  detailValue: {
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '3rem 1rem',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  btnPrimary: {
    padding: '0.65rem 1.25rem',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-blue-hover))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    width: '100%',
    transition: 'transform 0.15s',
  },
  errorText: {
    color: '#FB7185',
    fontSize: '0.8rem',
    textAlign: 'center' as const,
  },
};

/* ─── Mock Data (used when API is unavailable) ─── */
function getMockDeposits(): PendingDeposit[] {
  return [
    { id: 'd1', playerId: 'u1', playerPhone: '+251912345678', playerName: 'Abebe Kebede', amount: 500, ftNumber: 'FT123456789', createdAt: new Date().toISOString(), status: 'pending' },
    { id: 'd2', playerId: 'u2', playerPhone: '+251923456789', playerName: 'Sara Tesfaye', amount: 1000, ftNumber: 'FT987654321', createdAt: new Date().toISOString(), status: 'pending' },
    { id: 'd3', playerId: 'u3', playerPhone: '+251934567890', playerName: 'Dawit Hailu', amount: 250, ftNumber: 'FT555666777', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'pending' },
  ];
}

function getMockWithdrawals(): WithdrawalRequest[] {
  return [
    { id: 'w1', playerId: 'u1', playerName: 'Abebe Kebede', playerPhone: '+251912345678', amount: 300, method: 'TeleBirr', accountNumber: '0912345678', createdAt: new Date().toISOString(), status: 'pending' },
    { id: 'w2', playerId: 'u4', playerName: 'Meron Alemu', playerPhone: '+251945678901', amount: 750, method: 'CBE', accountNumber: '1000123456789', createdAt: new Date().toISOString(), status: 'pending' },
  ];
}

function getMockUsers(): PlayerInfo[] {
  return [
    { uid: 'u1', name: 'Abebe Kebede', phone: '+251912345678', balance: 2500, kycVerified: true, banned: false, createdAt: '2024-01-15', totalDeposits: 5000, totalWithdrawals: 2500 },
    { uid: 'u2', name: 'Sara Tesfaye', phone: '+251923456789', balance: 1200, kycVerified: true, banned: false, createdAt: '2024-02-20', totalDeposits: 3000, totalWithdrawals: 1800 },
    { uid: 'u3', name: 'Dawit Hailu', phone: '+251934567890', balance: 800, kycVerified: false, banned: false, createdAt: '2024-03-10', totalDeposits: 1500, totalWithdrawals: 700 },
    { uid: 'u4', name: 'Meron Alemu', phone: '+251945678901', balance: 3500, kycVerified: true, banned: false, createdAt: '2024-01-05', totalDeposits: 8000, totalWithdrawals: 4500 },
    { uid: 'u5', name: 'Yonas Tadesse', phone: '+251956789012', balance: 0, kycVerified: false, banned: true, createdAt: '2024-04-01', totalDeposits: 500, totalWithdrawals: 500 },
  ];
}

function getMockRooms(): RoomInfo[] {
  return [
    { id: 'r1', name: 'Bronze Room 1', tier: 'bronze', entryFee: 10, players: 8, maxPlayers: 20, status: 'active' },
    { id: 'r2', name: 'Silver Room 1', tier: 'silver', entryFee: 50, players: 12, maxPlayers: 15, status: 'active' },
    { id: 'r3', name: 'Gold Room VIP', tier: 'gold', entryFee: 200, players: 0, maxPlayers: 10, status: 'waiting' },
  ];
}

function getMockAnalytics(): Analytics {
  return {
    totalUsers: 1247,
    activeToday: 89,
    totalDeposits: 485000,
    totalWithdrawals: 312000,
    pendingDeposits: 3,
    pendingWithdrawals: 2,
    activeRooms: 2,
    revenue: 173000,
  };
}

/* ─── Helpers ─── */
function formatETB(amount: number): string {
  return `${amount.toLocaleString()} ETB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const badgeStyle = status === 'pending' ? styles.badgePending
    : status === 'approved' ? styles.badgeApproved
    : styles.badgeRejected;
  return <span style={{ ...styles.badge, ...badgeStyle }}>{status}</span>;
}

/* ─── Admin Portal Component ─── */
export default function AdminPortal() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState<Analytics>(getMockAnalytics());
  const [deposits, setDeposits] = useState<PendingDeposit[]>(getMockDeposits());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(getMockWithdrawals());
  const [users, setUsers] = useState<PlayerInfo[]>(getMockUsers());
  const [rooms, setRooms] = useState<RoomInfo[]>(getMockRooms());
  const [userSearch, setUserSearch] = useState('');
  const [expandedDeposit, setExpandedDeposit] = useState<string | null>(null);
  const [expandedWithdrawal, setExpandedWithdrawal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Try to fetch from real API, fallback to mock
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, dRes, wRes, uRes] = await Promise.allSettled([
        fetch(`${API_BASE}/admin/analytics`),
        fetch(`${API_BASE}/deposits/pending`),
        fetch(`${API_BASE}/admin/withdrawals`),
        fetch(`${API_BASE}/admin/users`),
      ]);
      if (aRes.status === 'fulfilled' && aRes.value.ok) setAnalytics(await aRes.value.json());
      if (dRes.status === 'fulfilled' && dRes.value.ok) setDeposits(await dRes.value.json());
      if (wRes.status === 'fulfilled' && wRes.value.ok) setWithdrawals(await wRes.value.json());
      if (uRes.status === 'fulfilled' && uRes.value.ok) setUsers(await uRes.value.json());
    } catch {
      // Keep mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

  /* ─── PIN Login ─── */
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Invalid PIN. Try again.');
      setPin('');
    }
  };

  /* ─── Actions ─── */
  const handleApproveDeposit = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`${API_BASE}/deposits/${id}/approve`, { method: 'POST' });
    } catch { /* fallback */ }
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' as const } : d));
    setAnalytics(prev => ({ ...prev, pendingDeposits: Math.max(0, prev.pendingDeposits - 1) }));
    setActionLoading(null);
  };

  const handleRejectDeposit = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`${API_BASE}/deposits/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Rejected by admin' }) });
    } catch { /* fallback */ }
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' as const } : d));
    setAnalytics(prev => ({ ...prev, pendingDeposits: Math.max(0, prev.pendingDeposits - 1) }));
    setActionLoading(null);
  };

  const handleApproveWithdrawal = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`${API_BASE}/admin/withdrawals/${id}/approve`, { method: 'POST' });
    } catch { /* fallback */ }
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' as const } : w));
    setAnalytics(prev => ({ ...prev, pendingWithdrawals: Math.max(0, prev.pendingWithdrawals - 1) }));
    setActionLoading(null);
  };

  const handleRejectWithdrawal = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`${API_BASE}/admin/withdrawals/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Rejected by admin' }) });
    } catch { /* fallback */ }
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' as const } : w));
    setAnalytics(prev => ({ ...prev, pendingWithdrawals: Math.max(0, prev.pendingWithdrawals - 1) }));
    setActionLoading(null);
  };

  const handleToggleBan = async (uid: string) => {
    setActionLoading(uid);
    try {
      await fetch(`${API_BASE}/admin/users/${uid}/ban`, { method: 'POST' });
    } catch { /* fallback */ }
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, banned: !u.banned } : u));
    setActionLoading(null);
  };

  const handleVerifyKyc = async (uid: string) => {
    setActionLoading(uid);
    try {
      await fetch(`${API_BASE}/admin/users/${uid}/kyc`, { method: 'POST' });
    } catch { /* fallback */ }
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, kycVerified: true } : u));
    setActionLoading(null);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPin('');
    setActiveTab('overview');
  };

  /* ─── Login Screen ─── */
  if (!authenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={36} color="var(--primary-blue)" />
          <div>
            <div style={styles.loginTitle}>Admin Portal</div>
            <div style={styles.loginSubtitle}>Bingo Platform Management</div>
          </div>
        </div>
        <form onSubmit={handlePinSubmit} style={styles.loginCard}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Enter Master PIN to continue
          </div>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
            style={styles.pinInput}
            placeholder="• • • •"
            autoFocus
          />
          {pinError && <div style={styles.errorText}>{pinError}</div>}
          <button type="submit" style={styles.btnPrimary} disabled={pin.length < 4}>
            <Shield size={16} /> Unlock Portal
          </button>
        </form>
        <button
          onClick={() => navigate('/lobby')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <ArrowLeft size={14} /> Back to App
        </button>
      </div>
    );
  }

  /* ─── Tab Content ─── */
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch) ||
    u.uid.includes(userSearch)
  );

  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { key: 'deposits', label: 'Deposits', icon: <DollarSign size={16} />, badge: pendingDeposits.length },
    { key: 'withdrawals', label: 'Withdraw', icon: <Wallet size={16} />, badge: pendingWithdrawals.length },
    { key: 'users', label: 'Users', icon: <Users size={16} /> },
    { key: 'rooms', label: 'Rooms', icon: <Gamepad2 size={16} /> },
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Shield size={18} />
          Admin Portal
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={styles.headerBtn} onClick={fetchData} title="Refresh">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
          <button style={styles.headerBtn} onClick={handleLogout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            style={{ ...styles.tab, ...(activeTab === t.key ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon}
            <span style={{ position: 'relative' }}>
              {t.label}
              {t.badge && t.badge > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-14px',
                  background: '#FB7185', color: '#fff', fontSize: '0.55rem',
                  fontWeight: 800, borderRadius: '6px', padding: '1px 4px',
                  minWidth: '14px', textAlign: 'center',
                }}>
                  {t.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <>
            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: 'var(--primary-blue)' }}>{analytics.totalUsers.toLocaleString()}</div>
                <div style={styles.statLabel}>Total Users</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: '#10B981' }}>{analytics.activeToday}</div>
                <div style={styles.statLabel}>Active Today</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: '#F59E0B' }}>{formatETB(analytics.totalDeposits)}</div>
                <div style={styles.statLabel}>Total Deposits</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: '#FB7185' }}>{formatETB(analytics.totalWithdrawals)}</div>
                <div style={styles.statLabel}>Total Withdrawals</div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Pending Actions</span>
                <Activity size={16} color="var(--text-muted)" />
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Pending Deposits</span>
                <span style={{ ...styles.badge, ...styles.badgePending }}>{analytics.pendingDeposits}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Pending Withdrawals</span>
                <span style={{ ...styles.badge, ...styles.badgePending }}>{analytics.pendingWithdrawals}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Active Rooms</span>
                <span style={{ ...styles.badge, ...styles.badgeApproved }}>{analytics.activeRooms}</span>
              </div>
            </div>

            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Revenue</span>
                <DollarSign size={16} color="var(--text-muted)" />
              </div>
              <div style={{ ...styles.statValue, color: '#10B981', fontSize: '1.6rem' }}>
                {formatETB(analytics.revenue)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Net revenue (deposits − withdrawals)
              </div>
            </div>
          </>
        )}

        {/* ─── DEPOSITS TAB ─── */}
        {activeTab === 'deposits' && (
          <>
            {deposits.length === 0 ? (
              <div style={styles.emptyState}>
                <DollarSign size={40} />
                <div style={{ fontWeight: 600 }}>No deposit requests</div>
                <div style={{ fontSize: '0.8rem' }}>All deposits have been processed</div>
              </div>
            ) : (
              deposits.map(d => (
                <div key={d.id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.playerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.playerPhone}</div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Amount</span>
                    <span style={{ ...styles.detailValue, color: '#10B981', fontWeight: 800 }}>{formatETB(d.amount)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>FT/Transaction #</span>
                    <span style={{ ...styles.detailValue, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{d.ftNumber}</span>
                  </div>

                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0' }}
                    onClick={() => setExpandedDeposit(expandedDeposit === d.id ? null : d.id)}
                  >
                    {expandedDeposit === d.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedDeposit === d.id ? 'Hide Details' : 'View Details'}
                  </button>

                  {expandedDeposit === d.id && (
                    <div style={{ padding: '0.5rem', background: 'var(--surface-raised)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Player ID</span>
                        <span style={{ ...styles.detailValue, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{d.playerId}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Submitted</span>
                        <span style={{ ...styles.detailValue, fontSize: '0.78rem' }}>{formatDate(d.createdAt)}</span>
                      </div>
                      {d.screenshotUrl && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <span style={{ ...styles.detailLabel, fontSize: '0.72rem' }}>Screenshot</span>
                          <img src={d.screenshotUrl} alt="receipt" style={{ width: '100%', borderRadius: '8px', marginTop: '0.35rem', maxHeight: '200px', objectFit: 'contain' }} />
                        </div>
                      )}
                    </div>
                  )}

                  {d.status === 'pending' && (
                    <div style={styles.actionRow}>
                      <button
                        style={styles.btnApprove}
                        onClick={() => handleApproveDeposit(d.id)}
                        disabled={actionLoading === d.id}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        style={styles.btnReject}
                        onClick={() => handleRejectDeposit(d.id)}
                        disabled={actionLoading === d.id}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* ─── WITHDRAWALS TAB ─── */}
        {activeTab === 'withdrawals' && (
          <>
            {withdrawals.length === 0 ? (
              <div style={styles.emptyState}>
                <Wallet size={40} />
                <div style={{ fontWeight: 600 }}>No withdrawal requests</div>
                <div style={{ fontSize: '0.8rem' }}>All withdrawals have been processed</div>
              </div>
            ) : (
              withdrawals.map(w => (
                <div key={w.id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{w.playerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.playerPhone}</div>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Amount</span>
                    <span style={{ ...styles.detailValue, color: '#FB7185', fontWeight: 800 }}>{formatETB(w.amount)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Method</span>
                    <span style={styles.detailValue}>{w.method}</span>
                  </div>

                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0' }}
                    onClick={() => setExpandedWithdrawal(expandedWithdrawal === w.id ? null : w.id)}
                  >
                    {expandedWithdrawal === w.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedWithdrawal === w.id ? 'Hide Details' : 'View Details'}
                  </button>

                  {expandedWithdrawal === w.id && (
                    <div style={{ padding: '0.5rem', background: 'var(--surface-raised)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Account Number</span>
                        <span style={{ ...styles.detailValue, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{w.accountNumber}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Player ID</span>
                        <span style={{ ...styles.detailValue, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{w.playerId}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Requested</span>
                        <span style={{ ...styles.detailValue, fontSize: '0.78rem' }}>{formatDate(w.createdAt)}</span>
                      </div>
                    </div>
                  )}

                  {w.status === 'pending' && (
                    <div style={styles.actionRow}>
                      <button
                        style={styles.btnApprove}
                        onClick={() => handleApproveWithdrawal(w.id)}
                        disabled={actionLoading === w.id}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        style={styles.btnReject}
                        onClick={() => handleRejectWithdrawal(w.id)}
                        disabled={actionLoading === w.id}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* ─── USERS TAB ─── */}
        {activeTab === 'users' && (
          <>
            <div style={styles.searchBar}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search by name, phone, or ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div style={styles.emptyState}>
                <Users size={40} />
                <div style={{ fontWeight: 600 }}>No users found</div>
              </div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.uid} style={{
                  ...styles.card,
                  borderLeft: u.banned ? '3px solid #FB7185' : u.kycVerified ? '3px solid #10B981' : '3px solid var(--card-border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {u.banned && <span style={{ ...styles.badge, ...styles.badgeRejected }}>Banned</span>}
                      {u.kycVerified ? (
                        <span style={{ ...styles.badge, ...styles.badgeApproved }}>KYC ✓</span>
                      ) : (
                        <span style={{ ...styles.badge, ...styles.badgePending }}>Unverified</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Balance</span>
                    <span style={{ ...styles.detailValue, color: 'var(--primary-blue)', fontWeight: 800 }}>{formatETB(u.balance)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Total Deposits</span>
                    <span style={{ ...styles.detailValue, fontSize: '0.8rem' }}>{formatETB(u.totalDeposits)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Total Withdrawals</span>
                    <span style={{ ...styles.detailValue, fontSize: '0.8rem' }}>{formatETB(u.totalWithdrawals)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Joined</span>
                    <span style={{ ...styles.detailValue, fontSize: '0.78rem' }}>{u.createdAt}</span>
                  </div>

                  <div style={styles.actionRow}>
                    {!u.kycVerified && (
                      <button
                        style={{ ...styles.btnApprove, flex: 1 }}
                        onClick={() => handleVerifyKyc(u.uid)}
                        disabled={actionLoading === u.uid}
                      >
                        <Eye size={14} /> Verify KYC
                      </button>
                    )}
                    <button
                      style={u.banned ? { ...styles.btnApprove, flex: 1 } : { ...styles.btnReject, flex: 1 }}
                      onClick={() => handleToggleBan(u.uid)}
                      disabled={actionLoading === u.uid}
                    >
                      <Ban size={14} /> {u.banned ? 'Unban' : 'Ban User'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ─── ROOMS TAB ─── */}
        {activeTab === 'rooms' && (
          <>
            {rooms.length === 0 ? (
              <div style={styles.emptyState}>
                <Gamepad2 size={40} />
                <div style={{ fontWeight: 600 }}>No active rooms</div>
              </div>
            ) : (
              rooms.map(r => {
                const tierColor = r.tier === 'gold' ? '#F59E0B' : r.tier === 'silver' ? '#94A3B8' : '#CD7F32';
                const statusColor = r.status === 'active' ? '#10B981' : r.status === 'waiting' ? '#F59E0B' : '#94A3B8';
                return (
                  <div key={r.id} style={{ ...styles.card, borderLeft: `3px solid ${tierColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.name}</div>
                      <span style={{
                        ...styles.badge,
                        background: `${statusColor}22`,
                        color: statusColor,
                        border: `1px solid ${statusColor}44`,
                      }}>
                        {r.status}
                      </span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Tier</span>
                      <span style={{ ...styles.detailValue, color: tierColor, textTransform: 'capitalize' }}>{r.tier}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Entry Fee</span>
                      <span style={styles.detailValue}>{formatETB(r.entryFee)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Players</span>
                      <span style={styles.detailValue}>{r.players} / {r.maxPlayers}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '4px', borderRadius: '2px', background: 'var(--surface-raised)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(r.players / r.maxPlayers) * 100}%`,
                        background: `linear-gradient(90deg, ${tierColor}, ${tierColor}88)`,
                        borderRadius: '2px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
