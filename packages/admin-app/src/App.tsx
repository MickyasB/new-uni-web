import React, { useState, useEffect, useCallback } from 'react';
import { PlatformStore } from '@bingo/shared';
import {
  adminLogin,
  callGetDashboardAnalytics,
  getUsers,
  callUpdatePlayerStatus,
  updateUserKyc,
  getWithdrawals,
  callApproveWithdrawal,
  callRejectWithdrawal,
  getFlaggedWins,
  callApproveFlaggedWin,
  callRejectFlaggedWin,
  createRoom,
  getAuditLog,
  getLedger,
  callRunManualReconciliation,
} from './functions';
import { useTheme } from './useTheme';
import './index.css';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Analytics {
  totalUsers: number;
  totalDepositedEtb: number;
  totalWithdrawnEtb: number;
  totalWinningsPaidEtb: number;
  totalHouseCommissionEtb: number;
  totalRooms: number;
  avgRoomFill: string;
}

type Panel =
  | 'analytics'
  | 'users'
  | 'withdrawals'
  | 'flaggedWins'
  | 'ledger'
  | 'rooms'
  | 'reconciliation'
  | 'auditLog';

// ── Login page ─────────────────────────────────────────────────────────────────
function LoginPage({ onMockLogin }: { onMockLogin?: (u: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ip2fa, setIp2fa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggle } = useTheme();

  // Allowed IPs for mock 2FA check (configurable; in production read from Firestore)
  const ALLOWED_IPS = ['127.0.0.1', 'localhost', '::1'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock IP allowlist check
    const resolvedIp = ip2fa.trim() || 'localhost';
    if (!ALLOWED_IPS.includes(resolvedIp)) {
      setError(`Access denied: IP "${resolvedIp}" is not on the allowlist.`);
      return;
    }

    setLoading(true);
    try {
      const data = await adminLogin(email, password);
      localStorage.setItem('bingo_admin_token', data.token);
      if (onMockLogin) {
        onMockLogin({
          uid: data.user.uid,
          email: data.user.phone,
          displayName: data.user.displayName
        });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await adminLogin('admin', 'password');
      localStorage.setItem('bingo_admin_token', data.token);
      if (onMockLogin) {
        onMockLogin({
          uid: data.user?.uid || 'admin-dev-001',
          email: data.user?.phone || 'admin@bingo.et',
          displayName: data.user?.displayName || 'Super Admin'
        });
      }
    } catch (err: any) {
      console.warn('Dev bypass auth error, activating mock admin session:', err);
      if (onMockLogin) {
        onMockLogin({
          uid: 'admin-dev-001',
          email: 'admin@bingo.et',
          displayName: 'Super Admin'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Theme toggle floating top-right */}
      <button className="theme-toggle"
        onClick={toggle}
        style={{ position: 'fixed', top: 16, right: 16 }}
        aria-label="Toggle theme">
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div className="login-box">
        <div>
          <h1>🎱 BINGO</h1>
          <p className="sub">Admin Console — Authorized access only</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required disabled={loading}
              placeholder="admin@bingo.et" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Your IP Address (2FA Check)</label>
            <input className="form-input" type="text" value={ip2fa}
              onChange={e => setIp2fa(e.target.value)} disabled={loading}
              placeholder="localhost  (leave blank for localhost)" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button 
          className="btn btn-secondary" 
          onClick={handleDevBypass} 
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: '10px', borderColor: 'var(--primary-amber)', color: 'var(--primary-amber)' }}
        >
          ⚡ {loading ? 'Processing...' : '1-Click Admin Login (Bypass)'}
        </button>
      </div>
    </div>
  );
}

// ── Analytics Panel ────────────────────────────────────────────────────────────
function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callGetDashboardAnalytics();
      setAnalytics(result.analytics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) return <div className="card"><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!analytics) return null;

  const stats = [
    { label: 'Total Users',     value: analytics.totalUsers.toLocaleString(),                  sub: 'registered players' },
    { label: 'Total Deposited', value: `${analytics.totalDepositedEtb.toFixed(0)} ETB`,        sub: 'all time' },
    { label: 'Total Withdrawn', value: `${analytics.totalWithdrawnEtb.toFixed(0)} ETB`,        sub: 'approved payouts' },
    { label: 'Winnings Paid',   value: `${analytics.totalWinningsPaidEtb.toFixed(0)} ETB`,     sub: 'to players' },
    { label: 'House Commission',value: `${analytics.totalHouseCommissionEtb.toFixed(0)} ETB`,  sub: 'platform revenue' },
    { label: 'Total Rooms',     value: analytics.totalRooms.toLocaleString(),                  sub: `avg fill: ${analytics.avgRoomFill}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="stat-grid">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="label">{s.label}</div>
            <div className="value">{s.value}</div>
            <div className="sub">{s.sub}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={fetchAnalytics}>
        ↺ Refresh
      </button>
    </div>
  );
}

// ── Users Panel ────────────────────────────────────────────────────────────────
function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchUid, setSearchUid] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getUsers(searchUid || undefined).then((data: any) => setUsers(data.users || [])).catch(console.error);
  }, [searchUid]);

  const toggleBan = async (uid: string, currentBanned: boolean) => {
    setActionLoading(uid);
    setMsg('');
    try {
      await callUpdatePlayerStatus({ targetUid: uid, isBanned: !currentBanned });
      setMsg(`User ${uid.slice(0, 8)}… ${currentBanned ? 'unbanned' : 'banned'} successfully.`);
      // Refresh users
      getUsers(searchUid || undefined).then((data: any) => setUsers(data.users || []));
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const updateKycStatus = async (uid: string, newStatus: string) => {
    setActionLoading(uid);
    setMsg('');
    try {
      await updateUserKyc(uid, newStatus);
      setMsg(`User ${uid.slice(0, 8)}… KYC status updated to ${newStatus}.`);
      getUsers(searchUid || undefined).then((data: any) => setUsers(data.users || []));
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = searchUid
    ? users.filter(u => u.id.includes(searchUid) || u.phone?.includes(searchUid) || u.displayName?.toLowerCase().includes(searchUid.toLowerCase()))
    : users;

  return (
    <div className="card">
      <div className="card-title">👥 User Management & Compliance</div>
      {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-danger' : 'alert-success'}`}>{msg}</div>}
      <div style={{ marginBottom: 14 }}>
        <input className="form-input" placeholder="Search by UID, phone, or name…"
          value={searchUid} onChange={e => setSearchUid(e.target.value)}
          style={{ maxWidth: 320 }} />
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Phone</th><th>Balance (ETB)</th>
              <th>KYC</th><th>Status</th><th>Joined</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="icon">👤</div><p>No users found.</p></div></td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <strong>{u.displayName || '—'}</strong><br />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.id.slice(0, 10)}…</span>
                </td>
                <td>{u.phone || '—'}</td>
                <td>{u.walletBalanceSantim != null ? (u.walletBalanceSantim / 100).toFixed(2) : '—'}</td>
                <td>
                  <span className={`badge badge-${u.kycStatus === 'verified' ? 'success' : u.kycStatus === 'pending' ? 'warning' : 'gray'}`}>
                    {u.kycStatus || 'unverified'}
                  </span>
                  {u.kycDocIdNumber && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {u.kycDocType}: {u.kycDocIdNumber}
                    </div>
                  )}
                </td>
                <td><span className={`badge badge-${u.isBanned ? 'danger' : 'success'}`}>{u.isBanned ? 'Banned' : 'Active'}</span></td>
                <td style={{ fontSize: '0.75rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`btn btn-${u.isBanned ? 'success' : 'danger'}`}
                      disabled={actionLoading === u.id}
                      onClick={() => toggleBan(u.id, u.isBanned)}>
                      {actionLoading === u.id ? '…' : u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    {u.kycStatus !== 'verified' && (
                      <button className="btn btn-primary"
                        disabled={actionLoading === u.id}
                        onClick={() => updateKycStatus(u.id, 'verified')}>
                        Approve KYC
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Withdrawals Panel ──────────────────────────────────────────────────────────
function WithdrawalsPanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getWithdrawals().then((data: any) => setRequests(data.withdrawals || [])).catch(console.error);
  }, []);

  const handle = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoading(requestId);
    setMsg('');
    try {
      if (action === 'approve') {
        await callApproveWithdrawal({ requestId });
      } else {
        await callRejectWithdrawal({ requestId });
      }
      setMsg(`Withdrawal ${requestId.slice(0, 8)}… ${action}d.`);
      getWithdrawals().then((data: any) => setRequests(data.withdrawals || []));
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-danger' : 'alert-success'}`}>{msg}</div>}

      <div className="card">
        <div className="card-title">⏳ Pending Withdrawals ({pending.length})</div>
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>ID</th><th>User</th><th>Amount</th><th>Gateway</th><th>Account</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {pending.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="icon">✅</div><p>No pending withdrawals.</p></div></td></tr>
              ) : pending.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.id.slice(0, 10)}…</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.userId?.slice(0, 10)}…</td>
                  <td><strong>{(r.amountSantim / 100).toFixed(2)} ETB</strong></td>
                  <td><span className="badge badge-info">{r.gateway?.toUpperCase()}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{r.accountDetails}</td>
                  <td style={{ fontSize: '0.75rem' }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-success" disabled={actionLoading === r.id} onClick={() => handle(r.id, 'approve')}>
                        {actionLoading === r.id ? '…' : '✓ Approve'}
                      </button>
                      <button className="btn btn-danger" disabled={actionLoading === r.id} onClick={() => handle(r.id, 'reject')}>
                        {actionLoading === r.id ? '…' : '✗ Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📋 Recent Processed ({processed.length})</div>
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Amount</th><th>Status</th><th>Processed</th></tr></thead>
            <tbody>
              {processed.slice(0, 20).map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.id.slice(0, 10)}…</td>
                  <td>{(r.amountSantim / 100).toFixed(2)} ETB</td>
                  <td><span className={`badge badge-${r.status === 'approved' ? 'success' : 'danger'}`}>{r.status}</span></td>
                  <td style={{ fontSize: '0.75rem' }}>{r.processedAt ? new Date(r.processedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Flagged Wins Panel ─────────────────────────────────────────────────────────
function FlaggedWinsPanel() {
  const [wins, setWins] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getFlaggedWins().then((data: any) => setWins(data.flaggedWins || [])).catch(console.error);
  }, []);

  const handle = async (flaggedWinId: string, action: 'approve' | 'reject') => {
    setActionLoading(flaggedWinId);
    setMsg('');
    try {
      if (action === 'approve') {
        await callApproveFlaggedWin({ flaggedWinId });
      } else {
        await callRejectFlaggedWin({ flaggedWinId });
      }
      setMsg(`Win ${flaggedWinId.slice(0, 8)}… ${action}d.`);
      getFlaggedWins().then((data: any) => setWins(data.flaggedWins || []));
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="card">
      <div className="card-title">🚩 Flagged Win Reviews</div>
      {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-danger' : 'alert-success'}`}>{msg}</div>}
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Win ID</th><th>Player</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {wins.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="icon">🏆</div><p>No flagged wins.</p></div></td></tr>
            ) : wins.map(w => (
              <tr key={w.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{w.id.slice(0, 10)}…</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{w.userId?.slice(0, 10)}…</td>
                <td><strong>{w.amountSantim ? (w.amountSantim / 100).toFixed(2) : '—'} ETB</strong></td>
                <td><span className="badge badge-warning">{w.reason}</span></td>
                <td><span className={`badge badge-${w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'danger' : 'warning'}`}>{w.status}</span></td>
                <td style={{ fontSize: '0.75rem' }}>{w.createdAt ? new Date(w.createdAt).toLocaleString() : '—'}</td>
                <td>
                  {w.status === 'pending_review' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-success" disabled={actionLoading === w.id} onClick={() => handle(w.id, 'approve')}>
                        {actionLoading === w.id ? '…' : '✓'}
                      </button>
                      <button className="btn btn-danger" disabled={actionLoading === w.id} onClick={() => handle(w.id, 'reject')}>
                        {actionLoading === w.id ? '…' : '✗'}
                      </button>
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Processed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Ledger Panel ───────────────────────────────────────────────────────────────
function LedgerPanel() {
  const [entries, setEntries] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    getLedger(filterType || undefined).then((data: any) => setEntries(data.entries || [])).catch(console.error);
  }, [filterType]);

  const types = ['', 'deposit', 'withdrawal', 'win', 'bonus', 'entry_fee', 'house_cut'];
  const filtered = filterType ? entries.filter(e => e.type === filterType) : entries;

  const typeColor: Record<string, string> = {
    deposit: 'success', withdrawal: 'danger', win: 'info',
    bonus: 'info', entry_fee: 'warning', house_cut: 'gray'
  };

  return (
    <div className="card">
      <div className="card-title">📒 Wallet Ledger</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {types.map(t => (
          <button key={t} className={`btn btn-${filterType === t ? 'primary' : 'ghost'}`}
            onClick={() => setFilterType(t)} style={{ padding: '5px 10px', fontSize: '0.75rem' }}>
            {t || 'All'}
          </button>
        ))}
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>ID</th><th>User</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Gateway</th><th>Date</th></tr></thead>
          <tbody>
            {filtered.slice(0, 100).map(e => (
              <tr key={e.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{e.id.slice(0, 8)}…</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{e.userId?.slice(0, 8)}…</td>
                <td><span className={`badge badge-${typeColor[e.type] ?? 'gray'}`}>{e.type}</span></td>
                <td style={{ color: ['deposit','win','bonus'].includes(e.type) ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {['deposit','win','bonus'].includes(e.type) ? '+' : '-'}{(e.amountSantim / 100).toFixed(2)}
                </td>
                <td>{(e.balanceSantim / 100).toFixed(2)} ETB</td>
                <td style={{ fontSize: '0.75rem' }}>{e.gateway?.toUpperCase() || '—'}</td>
                <td style={{ fontSize: '0.75rem' }}>{e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Rooms Panel ────────────────────────────────────────────────────────────────
// ── Rooms Panel ────────────────────────────────────────────────────────────────
function RoomsPanel() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [tier, setTier] = useState<'bronze' | 'silver' | 'gold'>('bronze');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [type, setType] = useState<'open' | 'scheduled'>('open');
  const [scheduledAt, setScheduledAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Use PlatformStore for cross-tab sync
    const unsubPlatform = PlatformStore.subscribeRooms((syncedRooms) => {
      setRooms(syncedRooms);
    });
    return () => unsubPlatform();
  }, []);

  const createRoomWithParams = async (selectedTier: 'bronze' | 'silver' | 'gold', selectedMode: 'auto' | 'manual' = 'auto', selectedType: 'open' | 'scheduled' = 'open', scheduledTime?: number) => {
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      // Create via PlatformStore locally
      PlatformStore.createRoom(selectedTier, selectedMode, selectedType, scheduledTime);

      // Also attempt REST API write
      try {
        await createRoom(selectedTier, selectedMode, selectedType);
      } catch (apiErr) {
        console.warn('API create room notice (handled by PlatformStore):', apiErr);
      }

      setSuccess(`⚡ ${selectedTier.toUpperCase()} Room created successfully!`);
      setShowCreate(false);
      setTier('bronze');
      setMode('auto');
      setType('open');
      setScheduledAt('');
    } catch (err: any) {
      console.error('Room creation error:', err);
      setError(err?.message || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledTime = (type === 'scheduled' && scheduledAt) ? new Date(scheduledAt).getTime() : undefined;
    await createRoomWithParams(tier, mode, type, scheduledTime);
  };

  const tierColor: Record<string, string> = { bronze: 'warning', silver: 'gray', gold: 'info' };
  const statusColor: Record<string, string> = { waiting: 'warning', active: 'success', ended: 'gray' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Quick 1-Click Room Creation Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚡ 1-Click Quick Create Game Room
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button 
            type="button" 
            className="btn" 
            disabled={creating}
            onClick={() => createRoomWithParams('bronze')}
            style={{ background: 'rgba(217, 119, 6, 0.2)', borderColor: '#d97706', color: '#fef3c7', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderRadius: '12px' }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>🥉 Create Bronze Room</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>10 ETB Entry Fee • Min 2 Players</span>
          </button>

          <button 
            type="button" 
            className="btn" 
            disabled={creating}
            onClick={() => createRoomWithParams('silver')}
            style={{ background: 'rgba(148, 163, 184, 0.2)', borderColor: '#94a3b8', color: '#f1f5f9', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderRadius: '12px' }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>🥈 Create Silver Room</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>50 ETB Entry Fee • Min 3 Players</span>
          </button>

          <button 
            type="button" 
            className="btn" 
            disabled={creating}
            onClick={() => createRoomWithParams('gold')}
            style={{ background: 'rgba(234, 179, 8, 0.2)', borderColor: '#eab308', color: '#fef08a', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderRadius: '12px' }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>🥇 Create Gold Room</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>100 ETB Entry Fee • Min 5 Players</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Hide Advanced Form' : '⚙️ Custom Room Setup (Advanced)'}
        </button>
      </div>

      {showCreate && (
        <div className="card">
          <div className="card-title">⚙️ Custom Game Room Options</div>
          <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
            <div className="form-group">
              <label className="form-label">Room Tier</label>
              <select className="form-input" value={tier} onChange={e => setTier(e.target.value as any)} required>
                <option value="bronze">Bronze (10 ETB entry fee, min 2 players)</option>
                <option value="silver">Silver (50 ETB entry fee, min 3 players)</option>
                <option value="gold">Gold (100 ETB entry fee, min 5 players)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Calling Mode</label>
              <select className="form-input" value={mode} onChange={e => setMode(e.target.value as any)} required>
                <option value="auto">Auto Generate (CSRNG, instant/automated)</option>
                <option value="manual">Manual Input (human operator pace)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room Type</label>
              <select className="form-input" value={type} onChange={e => setType(e.target.value as any)} required>
                <option value="open">Open Lobby (starts when min players buy cards)</option>
                <option value="scheduled">Scheduled Tournament (starts at fixed countdown)</option>
              </select>
            </div>

            {type === 'scheduled' && (
              <div className="form-group">
                <label className="form-label">Scheduled Start Time</label>
                <input 
                  className="form-input" 
                  type="datetime-local" 
                  value={scheduledAt} 
                  onChange={e => setScheduledAt(e.target.value)} 
                  required 
                />
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={creating} style={{ alignSelf: 'flex-start' }}>
              {creating ? 'Creating...' : 'Confirm Custom Room'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">🎮 Game Rooms</div>
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Tier</th><th>Status</th><th>Players</th><th>Pot (ETB)</th><th>Entry Fee</th><th>Created</th></tr></thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="icon">🎯</div><p>No rooms yet.</p></div></td></tr>
              ) : rooms.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.id.slice(0, 10)}…</td>
                  <td><span className={`badge badge-${tierColor[r.tier] ?? 'gray'}`}>{r.tier}</span></td>
                  <td><span className={`badge badge-${statusColor[r.status] ?? 'gray'}`}>{r.status}</span></td>
                  <td>{r.playerCount ?? 0}</td>
                  <td>{r.potSantim != null ? (r.potSantim / 100).toFixed(0) : '—'}</td>
                  <td>{r.entryFeeSantim != null ? (r.entryFeeSantim / 100).toFixed(0) : '—'}</td>
                  <td style={{ fontSize: '0.75rem' }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Reconciliation Panel ───────────────────────────────────────────────────────
function ReconciliationPanel() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runRec = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await callRunManualReconciliation();
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">⚖️ Manual Reconciliation</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
        Cross-check processed webhooks against pending payment records to surface any discrepancies.
      </p>
      {error && <div className="alert alert-danger">{error}</div>}
      <button className="btn btn-primary" onClick={runRec} disabled={loading}>
        {loading ? 'Running…' : '▶ Run Reconciliation'}
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <div className={`alert ${result.mismatchCount === 0 ? 'alert-success' : 'alert-danger'}`}>
            {result.mismatchCount === 0
              ? '✅ All records reconciled — no mismatches found.'
              : `⚠️ ${result.mismatchCount} mismatch(es) found. Review below.`}
          </div>
          {result.mismatches?.length > 0 && (
            <div className="data-table-container" style={{ marginTop: 12 }}>
              <table className="data-table">
                <thead><tr><th>Payment ID</th><th>Issue</th></tr></thead>
                <tbody>
                  {result.mismatches.map((m: any) => (
                    <tr key={m.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{m.id}</td>
                      <td><span className="badge badge-danger">{m.issue}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Audit Log Panel ────────────────────────────────────────────────────────────
function AuditLogPanel() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    getAuditLog().then((data: any) => setLogs(data.logs || [])).catch(console.error);
  }, []);

  return (
    <div className="card">
      <div className="card-title">🔍 Audit Log</div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4}><div className="empty-state"><div className="icon">📋</div><p>No audit events yet.</p></div></td></tr>
            ) : logs.map(l => (
              <tr key={l.id}>
                <td style={{ fontSize: '0.75rem' }}>{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{l.actorId?.slice(0, 12)}…</td>
                <td><span className="badge badge-info">{l.actionType}</span></td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{l.target?.slice(0, 20)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sidebar navigation config ──────────────────────────────────────────────────
const NAV: { section: string; items: { id: Panel; icon: string; label: string }[] }[] = [
  {
    section: 'Overview',
    items: [
      { id: 'analytics',      icon: '📊', label: 'Analytics' },
      { id: 'rooms',          icon: '🎮', label: 'Game Rooms' },
    ],
  },
  {
    section: 'Finance',
    items: [
      { id: 'withdrawals',    icon: '💸', label: 'Withdrawals' },
      { id: 'ledger',         icon: '📒', label: 'Ledger' },
      { id: 'flaggedWins',    icon: '🚩', label: 'Flagged Wins' },
    ],
  },
  {
    section: 'Management',
    items: [
      { id: 'users',          icon: '👥', label: 'Users' },
      { id: 'reconciliation', icon: '⚖️', label: 'Reconciliation' },
      { id: 'auditLog',       icon: '🔍', label: 'Audit Log' },
    ],
  },
];

const PANEL_TITLES: Record<Panel, string> = {
  analytics:      'Analytics Dashboard',
  users:          'User Management',
  withdrawals:    'Withdrawal Requests',
  flaggedWins:    'Flagged Win Reviews',
  ledger:         'Wallet Ledger',
  rooms:          'Game Rooms',
  reconciliation: 'Manual Reconciliation',
  auditLog:       'Audit Log',
};

// ── App root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<Panel>('analytics');
  const { theme, toggle } = useTheme();

  useEffect(() => {
    // Check for stored admin JWT token
    const token = localStorage.getItem('bingo_admin_token');
    if (token) {
      setUser({
        uid: 'admin-001',
        email: 'admin@bingo.et',
        displayName: 'Super Admin'
      });
    }
    setAuthLoading(false);
  }, []);

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c14', color: '#f59e0b' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ fontFamily: 'sans-serif', fontSize: '0.9rem' }}>Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage onMockLogin={setUser} />;

  const renderPanel = () => {
    switch (activePanel) {
      case 'analytics':      return <AnalyticsPanel />;
      case 'users':          return <UsersPanel />;
      case 'withdrawals':    return <WithdrawalsPanel />;
      case 'flaggedWins':    return <FlaggedWinsPanel />;
      case 'ledger':         return <LedgerPanel />;
      case 'rooms':          return <RoomsPanel />;
      case 'reconciliation': return <ReconciliationPanel />;
      case 'auditLog':       return <AuditLogPanel />;
    }
  };

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🎱 BINGO</h2>
          <p>Admin Console</p>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(section => (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
                  onClick={() => setActivePanel(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            {user.email}
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { localStorage.removeItem('bingo_admin_token'); setUser(null); }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">{PANEL_TITLES[activePanel]}</span>
          <div className="topbar-right">
            <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>

        <main className="page-content">
          {renderPanel()}
        </main>
      </div>
    </div>
  );
}
