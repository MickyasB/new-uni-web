import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  X,
  Search,
  Users,
  DollarSign,
  Activity,
  Shield,
  Ban,
  Eye,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
  Wallet,
  Gamepad2,
  BarChart3,
  Trash2,
  PlusCircle,
  Sun,
  Moon,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dbService, DbUser, DbDeposit, DbWithdrawal, DbRoom } from '../dbService';
import { useTheme } from '../useTheme';

const ADMIN_PIN = '7777';

type AdminTab = 'overview' | 'deposits' | 'withdrawals' | 'users' | 'rooms';

export default function AdminPortal() {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Live state from dbService
  const [users, setUsers] = useState<DbUser[]>([]);
  const [deposits, setDeposits] = useState<DbDeposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<DbWithdrawal[]>([]);
  const [rooms, setRooms] = useState<DbRoom[]>([]);
  const [analytics, setAnalytics] = useState(dbService.getAnalytics());

  // UI state
  const [userSearch, setUserSearch] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomFee, setNewRoomFee] = useState('10');
  const [newRoomTier, setNewRoomTier] = useState<'bronze' | 'silver' | 'gold'>('silver');

  // Load and subscribe to dbService
  const refreshData = useCallback(() => {
    setUsers(dbService.getUsers());
    setDeposits(dbService.getDeposits());
    setWithdrawals(dbService.getWithdrawals());
    setRooms(dbService.getRooms());
    setAnalytics(dbService.getAnalytics());
  }, []);

  useEffect(() => {
    refreshData();
    const unsub = dbService.subscribe(refreshData);
    return unsub;
  }, [refreshData]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // PIN Login
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Invalid PIN. Please try again.');
      setPin('');
    }
  };

  // Deposit Actions
  const handleApproveDeposit = (id: string) => {
    const success = dbService.approveDeposit(id);
    if (success) {
      showNotification('✅ Deposit approved and credited to player wallet!');
    }
  };

  const handleRejectDeposit = (id: string) => {
    const success = dbService.rejectDeposit(id, 'Rejected by admin');
    if (success) {
      showNotification('❌ Deposit marked as rejected.');
    }
  };

  // Withdrawal Actions
  const handleApproveWithdrawal = (id: string) => {
    const success = dbService.approveWithdrawal(id);
    if (success) {
      showNotification('✅ Withdrawal approved and completed!');
    }
  };

  const handleRejectWithdrawal = (id: string) => {
    const success = dbService.rejectWithdrawal(id, 'Rejected by admin');
    if (success) {
      showNotification('❌ Withdrawal rejected and balance refunded to player.');
    }
  };

  // User Actions
  const handleToggleBan = (uid: string) => {
    const isBanned = dbService.toggleBan(uid);
    showNotification(isBanned ? '🚫 User has been banned.' : '✅ User has been unbanned.');
  };

  const handleVerifyKyc = (uid: string) => {
    dbService.verifyKyc(uid);
    showNotification('✅ KYC status verified for user.');
  };

  const handleAdjustBalance = (uid: string, amountETB: number) => {
    dbService.adjustUserBalance(uid, amountETB * 100);
    showNotification(`💰 Added ${amountETB} ETB to user balance.`);
  };

  // Room Actions
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const fee = parseInt(newRoomFee) || 10;
    dbService.addRoom({
      name: newRoomName.trim(),
      tier: newRoomTier,
      entryFeeETB: fee,
      potETB: fee * 5,
      playerCount: 0,
      maxPlayers: 20,
      status: 'waiting',
    });
    setNewRoomName('');
    setShowAddRoom(false);
    showNotification('🎮 New game room created successfully!');
  };

  const handleToggleRoom = (roomId: string) => {
    dbService.toggleRoomStatus(roomId);
    showNotification('Room status toggled.');
  };

  // Test Utilities & Database Reset
  const handleResetToZero = () => {
    if (window.confirm('⚠️ Are you sure you want to RESET THE DATABASE TO 0? All users, deposits, and withdrawals will be wiped.')) {
      dbService.resetDatabaseToZero();
      showNotification('🔄 Database has been reset starting from 0.');
    }
  };

  const handleCreateTestDeposit = () => {
    let testUser = users[0];
    if (!testUser) {
      testUser = dbService.registerUser({
        displayName: 'Abebe Kebede',
        phone: '+251911223344',
      });
    }
    const randAmt = [100, 250, 500, 1000][Math.floor(Math.random() * 4)];
    dbService.createDeposit({
      playerId: testUser.uid,
      amountETB: randAmt,
      ftNumber: 'FT' + Math.floor(10000000 + Math.random() * 90000000),
    });
    showNotification(`➕ Created test deposit of ${randAmt} ETB for ${testUser.displayName}.`);
  };

  const handleCreateTestWithdrawal = () => {
    let testUser = users[0];
    if (!testUser) {
      testUser = dbService.registerUser({
        displayName: 'Sara Tesfaye',
        phone: '+251922334455',
      });
      dbService.adjustUserBalance(testUser.uid, 50000); // 500 ETB
    }
    if (testUser.walletBalanceSantim < 10000) {
      dbService.adjustUserBalance(testUser.uid, 20000); // give balance to withdraw
    }
    dbService.createWithdrawal({
      playerId: testUser.uid,
      amountETB: 150,
      method: 'Telebirr',
      accountNumber: testUser.phone,
    });
    showNotification(`➕ Created test withdrawal of 150 ETB for ${testUser.displayName}.`);
  };

  /* ─── Login Screen ─── */
  if (!authenticated) {
    return (
      <div className="auth-page-container" style={{ justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <button
          onClick={toggleTheme}
          className="auth-theme-toggle"
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Shield size={30} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-light)', fontFamily: 'var(--font-heading)' }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Super Bingo Platform Control
          </p>
        </div>

        <div className="auth-card" style={{ maxWidth: '360px' }}>
          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Enter Master PIN (7777)
            </div>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '12px',
                padding: '0.85rem',
                color: 'var(--input-text)',
                fontSize: '1.3rem',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                outline: 'none',
                width: '100%',
              }}
              placeholder="••••"
              autoFocus
            />
            {pinError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center', fontWeight: 600 }}>
                {pinError}
              </div>
            )}
            <button
              type="submit"
              disabled={pin.length < 4}
              style={{
                background: 'var(--primary-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Shield size={18} /> Unlock Portal
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/lobby')}
          style={{
            marginTop: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <ArrowLeft size={14} /> Return to Player Lobby
        </button>
      </div>
    );
  }

  /* ─── Filtered Lists ─── */
  const filteredDeposits = deposits.filter(d => statusFilter === 'all' || d.status === statusFilter);
  const filteredWithdrawals = withdrawals.filter(w => statusFilter === 'all' || w.status === statusFilter);
  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch) ||
    u.uid.includes(userSearch)
  );

  const pendingDepositsCount = deposits.filter(d => d.status === 'pending').length;
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { key: 'deposits', label: 'Deposits', icon: <DollarSign size={16} />, badge: pendingDepositsCount },
    { key: 'withdrawals', label: 'Withdraw', icon: <Wallet size={16} />, badge: pendingWithdrawalsCount },
    { key: 'users', label: 'Users', icon: <Users size={16} /> },
    { key: 'rooms', label: 'Rooms', icon: <Gamepad2 size={16} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-light)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Header ── */}
      <div style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--card-border)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Shield size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-light)', fontFamily: 'var(--font-heading)' }}>
              Admin Portal
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Live System State
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-light)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={refreshData}
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-light)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={() => navigate('/lobby')}
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-light)',
              borderRadius: '8px',
              padding: '0 10px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Back to Player App"
          >
            <ArrowLeft size={14} /> App
          </button>

          <button
            onClick={() => { setAuthenticated(false); setPin(''); }}
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--card-border)',
              color: 'var(--danger)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Logout Admin"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── Notification Banner ── */}
      {actionSuccess && (
        <div style={{
          background: 'var(--success)',
          color: '#fff',
          padding: '0.55rem 1rem',
          fontSize: '0.82rem',
          fontWeight: 700,
          textAlign: 'center',
        }}>
          {actionSuccess}
        </div>
      )}

      {/* ── Navigation Tab Bar ── */}
      <div style={{
        display: 'flex',
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--card-border)',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1,
              padding: '0.75rem 0.25rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: activeTab === t.key ? 'var(--primary-blue)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid var(--primary-blue)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            {t.icon}
            <span style={{ position: 'relative' }}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-7px',
                  right: '-14px',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  padding: '1px 5px',
                  minWidth: '14px',
                  textAlign: 'center',
                }}>
                  {t.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

        {/* ════════ OVERVIEW TAB ════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-blue)', fontFamily: 'var(--font-heading)' }}>
                  {analytics.totalUsers}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Total Users
                </div>
              </div>

              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                  {analytics.totalDepositsETB.toLocaleString()} ETB
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Total Deposits
                </div>
              </div>

              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)', fontFamily: 'var(--font-heading)' }}>
                  {analytics.totalWithdrawalsETB.toLocaleString()} ETB
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Total Withdrawals
                </div>
              </div>

              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-heading)' }}>
                  {analytics.netRevenueETB.toLocaleString()} ETB
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Net Platform Revenue
                </div>
              </div>
            </div>

            {/* Pending Actions Summary */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Pending Queue</span>
                <Activity size={16} color="var(--text-muted)" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pending Deposit Requests</span>
                <span style={{
                  background: pendingDepositsCount > 0 ? 'var(--gold)' : 'var(--surface-raised)',
                  color: pendingDepositsCount > 0 ? '#fff' : 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}>
                  {pendingDepositsCount}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pending Withdrawal Requests</span>
                <span style={{
                  background: pendingWithdrawalsCount > 0 ? 'var(--danger)' : 'var(--surface-raised)',
                  color: pendingWithdrawalsCount > 0 ? '#fff' : 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}>
                  {pendingWithdrawalsCount}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Configured Rooms</span>
                <span style={{ fontWeight: 700 }}>{rooms.length}</span>
              </div>
            </div>

            {/* Quick Testing & Database Reset Toolbar */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Quick Admin Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={handleCreateTestDeposit}
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-light)',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <PlusCircle size={15} color="var(--success)" /> Add Test Deposit Request
                </button>

                <button
                  onClick={handleCreateTestWithdrawal}
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-light)',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <PlusCircle size={15} color="var(--danger)" /> Add Test Withdrawal Request
                </button>

                <button
                  onClick={handleResetToZero}
                  style={{
                    background: 'var(--danger)',
                    border: 'none',
                    color: '#fff',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    marginTop: '0.25rem',
                  }}
                >
                  <Trash2 size={15} /> Reset All Database Data to 0
                </button>
              </div>
            </div>
          </>
        )}

        {/* ════════ DEPOSITS TAB ════════ */}
        {activeTab === 'deposits' && (
          <>
            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    flex: 1,
                    padding: '0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: statusFilter === f ? 'var(--primary-blue)' : 'var(--card-bg)',
                    color: statusFilter === f ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {f} {f === 'pending' && pendingDepositsCount > 0 ? `(${pendingDepositsCount})` : ''}
                </button>
              ))}
            </div>

            {filteredDeposits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={36} />
                <div style={{ fontWeight: 700 }}>No deposit requests found</div>
                <div style={{ fontSize: '0.8rem' }}>When users make CBE or Telebirr deposits, they appear here.</div>
                <button
                  onClick={handleCreateTestDeposit}
                  style={{
                    marginTop: '0.5rem',
                    background: 'var(--primary-blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Add Sample Deposit
                </button>
              </div>
            ) : (
              filteredDeposits.map(d => (
                <div
                  key={d.id}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderLeft: d.status === 'pending' ? '4px solid var(--gold)' : d.status === 'approved' ? '4px solid var(--success)' : '4px solid var(--danger)',
                    borderRadius: '12px',
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{d.playerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.playerPhone}</div>
                    </div>
                    <span style={{
                      background: d.status === 'approved' ? 'var(--success)' : d.status === 'rejected' ? 'var(--danger)' : 'var(--gold)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}>
                      {d.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Deposit Amount</span>
                    <span style={{ fontWeight: 800, color: 'var(--success)' }}>{d.amountETB.toLocaleString()} ETB</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>FT / Ref #</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{d.ftNumber}</span>
                  </div>

                  <button
                    onClick={() => setExpandedItem(expandedItem === d.id ? null : d.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-blue)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0',
                    }}
                  >
                    {expandedItem === d.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedItem === d.id ? 'Hide Details' : 'View Full Details'}
                  </button>

                  {expandedItem === d.id && (
                    <div style={{ background: 'var(--surface-raised)', borderRadius: '8px', padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Deposit ID</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{d.id}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Player ID</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{d.playerId}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Requested At</span>
                        <span>{new Date(d.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions for Pending Deposit */}
                  {d.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        onClick={() => handleApproveDeposit(d.id)}
                        style={{
                          flex: 1,
                          background: 'var(--success)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.55rem',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Check size={15} /> Approve & Credit
                      </button>
                      <button
                        onClick={() => handleRejectDeposit(d.id)}
                        style={{
                          flex: 1,
                          background: 'var(--danger)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.55rem',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <X size={15} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* ════════ WITHDRAWALS TAB ════════ */}
        {activeTab === 'withdrawals' && (
          <>
            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    flex: 1,
                    padding: '0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: statusFilter === f ? 'var(--primary-blue)' : 'var(--card-bg)',
                    color: statusFilter === f ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {f} {f === 'pending' && pendingWithdrawalsCount > 0 ? `(${pendingWithdrawalsCount})` : ''}
                </button>
              ))}
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={36} />
                <div style={{ fontWeight: 700 }}>No withdrawal requests found</div>
                <div style={{ fontSize: '0.8rem' }}>Player withdrawal requests will show here for approval.</div>
                <button
                  onClick={handleCreateTestWithdrawal}
                  style={{
                    marginTop: '0.5rem',
                    background: 'var(--primary-blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Add Sample Withdrawal
                </button>
              </div>
            ) : (
              filteredWithdrawals.map(w => (
                <div
                  key={w.id}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderLeft: w.status === 'pending' ? '4px solid var(--gold)' : w.status === 'approved' ? '4px solid var(--success)' : '4px solid var(--danger)',
                    borderRadius: '12px',
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{w.playerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.playerPhone}</div>
                    </div>
                    <span style={{
                      background: w.status === 'approved' ? 'var(--success)' : w.status === 'rejected' ? 'var(--danger)' : 'var(--gold)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}>
                      {w.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                    <span style={{ fontWeight: 800, color: 'var(--danger)' }}>{w.amountETB.toLocaleString()} ETB</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Method / Payout</span>
                    <span style={{ fontWeight: 700 }}>{w.method} ({w.accountNumber})</span>
                  </div>

                  {/* Actions for Pending Withdrawal */}
                  {w.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        onClick={() => handleApproveWithdrawal(w.id)}
                        style={{
                          flex: 1,
                          background: 'var(--success)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.55rem',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Check size={15} /> Approve Payout
                      </button>
                      <button
                        onClick={() => handleRejectWithdrawal(w.id)}
                        style={{
                          flex: 1,
                          background: 'var(--danger)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.55rem',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <X size={15} /> Reject & Refund
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* ════════ USERS TAB ════════ */}
        {activeTab === 'users' && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search players by name, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--input-text)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={36} />
                <div style={{ fontWeight: 700 }}>No users registered yet</div>
                <div style={{ fontSize: '0.8rem' }}>When players register, they appear here with their exact entered names.</div>
              </div>
            ) : (
              filteredUsers.map(u => (
                <div
                  key={u.uid}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{u.displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {u.banned && (
                        <span style={{ background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
                          BANNED
                        </span>
                      )}
                      <span style={{
                        background: u.kycStatus === 'verified' ? 'var(--success)' : 'var(--surface-raised)',
                        color: u.kycStatus === 'verified' ? '#fff' : 'var(--text-muted)',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                      }}>
                        {u.kycStatus === 'verified' ? 'KYC ✓' : 'KYC PENDING'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Wallet Balance</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary-blue)' }}>
                      {(u.walletBalanceSantim / 100).toLocaleString()} ETB
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    {u.kycStatus !== 'verified' && (
                      <button
                        onClick={() => handleVerifyKyc(u.uid)}
                        style={{
                          flex: 1,
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--card-border)',
                          color: 'var(--success)',
                          padding: '0.45rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Eye size={13} /> Verify KYC
                      </button>
                    )}

                    <button
                      onClick={() => handleAdjustBalance(u.uid, 100)}
                      style={{
                        flex: 1,
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--primary-blue)',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Plus size={13} /> +100 ETB
                    </button>

                    <button
                      onClick={() => handleToggleBan(u.uid)}
                      style={{
                        flex: 1,
                        background: u.banned ? 'var(--success)' : 'var(--danger)',
                        color: '#fff',
                        border: 'none',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Ban size={13} /> {u.banned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ════════ ROOMS TAB ════════ */}
        {activeTab === 'rooms' && (
          <>
            <button
              onClick={() => setShowAddRoom(!showAddRoom)}
              style={{
                background: 'var(--primary-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Plus size={16} /> {showAddRoom ? 'Cancel' : 'Create New Game Room'}
            </button>

            {showAddRoom && (
              <form onSubmit={handleCreateRoom} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>New Room Details</div>
                <input
                  type="text"
                  placeholder="Room Name (e.g. VIP High Roller)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '0.6rem',
                    color: 'var(--input-text)',
                    fontSize: '0.85rem',
                  }}
                  required
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    placeholder="Entry Fee ETB"
                    value={newRoomFee}
                    onChange={(e) => setNewRoomFee(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      borderRadius: '8px',
                      padding: '0.6rem',
                      color: 'var(--input-text)',
                      fontSize: '0.85rem',
                    }}
                    required
                  />
                  <select
                    value={newRoomTier}
                    onChange={(e) => setNewRoomTier(e.target.value as any)}
                    style={{
                      flex: 1,
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      borderRadius: '8px',
                      padding: '0.6rem',
                      color: 'var(--input-text)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="bronze">Bronze Tier</option>
                    <option value="silver">Silver Tier</option>
                    <option value="gold">Gold VIP</option>
                  </select>
                </div>
                <button
                  type="submit"
                  style={{
                    background: 'var(--success)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save & Launch Room
                </button>
              </form>
            )}

            {rooms.map(r => (
              <div
                key={r.id}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                  padding: '0.9rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{r.name}</div>
                  <button
                    onClick={() => handleToggleRoom(r.id)}
                    style={{
                      background: r.status === 'active' ? 'var(--success)' : 'var(--surface-raised)',
                      color: r.status === 'active' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {r.status}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Entry Fee</span>
                  <span style={{ fontWeight: 800 }}>{r.entryFeeETB} ETB</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Est. Jackpot Pot</span>
                  <span style={{ fontWeight: 800, color: 'var(--gold)' }}>{r.potETB} ETB</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
