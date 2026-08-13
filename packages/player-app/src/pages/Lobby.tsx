import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { api } from '../api';
import { RoomRecord, RoomStatus, RoomTier } from '@bingo/shared';

// Sub-component for room countdown
function RoomCountdown({ scheduledAt }: { scheduledAt: number }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((scheduledAt - Date.now()) / 1000)));

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((scheduledAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledAt, timeLeft]);

  if (timeLeft <= 0) {
    return <span style={{ color: 'var(--success)' }}>Starting now...</span>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return (
    <span>
      Starts in {minutes}:{seconds < 10 ? '0' : ''}{seconds}
    </span>
  );
}

export default function Lobby() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setActiveRoomId } = useAppStore();
  const userRecord = user;
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [activeTab, setActiveTab] = useState<RoomTier | 'all'>('all');
  
  // Buy Cards modal state
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [cardCount, setCardCount] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const isLocalhost = import.meta.env.DEV && typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const handleDevCreateRoom = async () => {
    setCreateLoading(true);
    try {
      await api.getRoom('room-bronze-default'); // just test connectivity
    } catch (err: any) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };
  useEffect(() => {

    const DEFAULT_DEMO_ROOMS: RoomRecord[] = [
      {
        id: 'room-bronze-demo',
        tier: RoomTier.BRONZE,
        status: RoomStatus.WAITING,
        mode: 'auto',
        type: 'open',
        entryFeeSantim: 1000, // 10 ETB
        potSantim: 5000,
        minPlayers: 2,
        maxCards: 6,
        playerCount: 3,
        createdAt: Date.now(),
      },
      {
        id: 'room-silver-demo',
        tier: RoomTier.SILVER,
        status: RoomStatus.WAITING,
        mode: 'auto',
        type: 'open',
        entryFeeSantim: 5000, // 50 ETB
        potSantim: 25000,
        minPlayers: 3,
        maxCards: 6,
        playerCount: 5,
        createdAt: Date.now() - 1000,
      },
      {
        id: 'room-gold-demo',
        tier: RoomTier.GOLD,
        status: RoomStatus.WAITING,
        mode: 'auto',
        type: 'open',
        entryFeeSantim: 10000, // 100 ETB
        potSantim: 50000,
        minPlayers: 4,
        maxCards: 6,
        playerCount: 7,
        createdAt: Date.now() - 2000,
      }
    ];

    const fetchRooms = async () => {
      try {
        const data = await api.getRooms();
        const apiRooms = (data.rooms || []).map((r: any) => ({
          id: r.id,
          tier: r.tier as RoomTier,
          status: r.status as RoomStatus,
          mode: r.mode,
          type: r.type,
          entryFeeSantim: parseInt(r.entry_fee_santim || r.entryFeeSantim || 0),
          potSantim: parseInt(r.pot_santim || r.potSantim || 0),
          minPlayers: r.min_players || r.minPlayers || 2,
          maxCards: r.max_cards || r.maxCards || 6,
          playerCount: r.player_count || r.playerCount || 0,
          scheduledAt: r.scheduled_at || r.scheduledAt,
          createdAt: parseInt(r.created_at || r.createdAt || 0),
        }));

        if (apiRooms.length === 0) {
          setRooms(DEFAULT_DEMO_ROOMS);
        } else {
          apiRooms.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
          setRooms(apiRooms);
        }
      } catch {
        setRooms(DEFAULT_DEMO_ROOMS);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleOpenJoinModal = (room: RoomRecord) => {
    setSelectedRoom(room);
    setCardCount(1);
    setBuyError('');
  };

  const handleConfirmPurchase = async () => {
    if (!selectedRoom) return;
    setBuyError('');
    setBuyLoading(true);

    const balanceSantim = userRecord?.walletBalanceSantim || 0;
    const totalCostSantim = selectedRoom.entryFeeSantim * cardCount;

    if (balanceSantim < totalCostSantim) {
      setBuyError(t('errors.insufficientFunds') || 'Insufficient funds in wallet.');
      setBuyLoading(false);
      return;
    }

    try {
      await api.buyCards(selectedRoom.id, cardCount);

      // Close modal & navigate to game room
      setSelectedRoom(null);
      setActiveRoomId(selectedRoom.id);
      navigate(`/room/${selectedRoom.id}`);
    } catch (err: any) {
      console.error(err);
      setBuyError(err.message || t('errors.generic') || 'Failed to purchase cards.');
    } finally {
      setBuyLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (activeTab === 'all') return true;
    return room.tier === activeTab;
  });

  const getTierClass = (tier: RoomTier) => {
    switch (tier) {
      case RoomTier.BRONZE: return 'room-card bronze';
      case RoomTier.SILVER: return 'room-card silver';
      case RoomTier.GOLD: return 'room-card gold';
      default: return 'room-card';
    }
  };

  const getTierLabel = (tier: RoomTier) => {
    switch (tier) {
      case RoomTier.BRONZE: return t('lobby.bronze') || 'Bronze Room';
      case RoomTier.SILVER: return t('lobby.silver') || 'Silver Room';
      case RoomTier.GOLD: return t('lobby.gold') || 'Gold Room';
      default: return '';
    }
  };

  const balanceEtb = userRecord ? (userRecord.walletBalanceSantim / 100).toFixed(2) : '0.00';

  return (
    <div className="page-container">
      {/* Top Header info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('lobby.welcomeBack') || 'Welcome back'}</p>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-light)' }}>{userRecord?.displayName || 'Player'}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('wallet.balance') || 'Balance'}</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-amber)' }}>{balanceEtb} ETB</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-raised)', padding: '0.25rem', borderRadius: '12px' }}>
        <button 
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('all')}
          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
        >
          {t('lobby.all') || 'All'}
        </button>
        <button 
          className={`btn ${activeTab === RoomTier.BRONZE ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab(RoomTier.BRONZE)}
          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
        >
          {typeof t('lobby.bronze') === 'string' ? t('lobby.bronze').split(' ')[0] : 'Bronze'}
        </button>
        <button 
          className={`btn ${activeTab === RoomTier.SILVER ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab(RoomTier.SILVER)}
          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
        >
          {typeof t('lobby.silver') === 'string' ? t('lobby.silver').split(' ')[0] : 'Silver'}
        </button>
        <button 
          className={`btn ${activeTab === RoomTier.GOLD ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab(RoomTier.GOLD)}
          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
        >
          {typeof t('lobby.gold') === 'string' ? t('lobby.gold').split(' ')[0] : 'Gold'}
        </button>
      </div>

      {/* List of rooms */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        <h4 style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {t('lobby.activeRooms') || 'Active Rooms'} ({filteredRooms.length})
        </h4>

        {filteredRooms.length === 0 ? (
          <div style={{ alignSelf: 'center', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📭</p>
            <p>{t('lobby.noRooms') || 'No active rooms found. Operators will open rooms shortly.'}</p>
            {isLocalhost && (
              <button 
                className="btn btn-secondary" 
                onClick={handleDevCreateRoom} 
                disabled={createLoading}
                style={{ marginTop: '1.25rem', borderColor: 'var(--primary-amber)', color: 'var(--primary-amber)', background: 'transparent' }}
              >
                {createLoading ? 'Creating...' : (t('lobby.devCreateRoom') || 'Dev: Create Bronze Room')}
              </button>
            )}
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div 
              key={room.id} 
              className={`glass-panel ${getTierClass(room.tier)}`}
              onClick={() => room.status === RoomStatus.WAITING && handleOpenJoinModal(room)}
            >
              <div className="room-header">
                <span className="room-title">{getTierLabel(room.tier)}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '6px',
                  background: room.status === RoomStatus.ACTIVE ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: room.status === RoomStatus.ACTIVE ? 'var(--success)' : 'var(--primary-amber)',
                  fontWeight: 600
                }}>
                  {room.status === RoomStatus.ACTIVE ? 'Playing' : 'Lobby Open'}
                </span>
              </div>

              <div className="room-meta" style={{ marginTop: '0.5rem' }}>
                <div>
                  <p>{t('lobby.entryFee', { fee: (room.entryFeeSantim / 100).toFixed(0) })}</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Min Players: {room.minPlayers} | Max Cards: {room.maxCards}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-light)' }}>
                    👤 {room.playerCount} Players
                  </p>
                  {room.type === 'scheduled' && room.scheduledAt && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary-amber)', marginTop: '0.25rem' }}>
                      ⏳ <RoomCountdown scheduledAt={room.scheduledAt} />
                    </p>
                  )}
                </div>
              </div>

              {room.status === RoomStatus.WAITING && (
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '0.75rem', padding: '0.6rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenJoinModal(room);
                  }}
                >
                  {t('lobby.join') || 'Join Game'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Buy Cards Overlay Modal */}
      {selectedRoom && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', textAlign: 'center' }}>{t('lobby.buyBingoCards') || 'Buy Bingo Cards'}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              {t('lobby.selectCardsDesc', { roomName: getTierLabel(selectedRoom.tier) }) || `Select the number of cards you wish to purchase for ${getTierLabel(selectedRoom.tier)}.`}
            </p>

            {buyError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                {buyError}
              </div>
            )}

            {/* Select card count */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', margin: '0.5rem 0' }}>
              <button 
                className="btn btn-secondary" 
                style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, fontSize: '1.5rem' }}
                onClick={() => setCardCount(Math.max(1, cardCount - 1))}
                disabled={buyLoading || cardCount <= 1}
              >
                -
              </button>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-amber)', minWidth: '40px', textAlign: 'center' }}>
                {cardCount}
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, fontSize: '1.5rem' }}
                onClick={() => setCardCount(Math.min(selectedRoom.maxCards, cardCount + 1))}
                disabled={buyLoading || cardCount >= selectedRoom.maxCards}
              >
                +
              </button>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('lobby.pricePerCard') || 'Price per Card:'}</span>
                <span>{(selectedRoom.entryFeeSantim / 100).toFixed(2)} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700 }}>
                <span>{t('lobby.totalCost') || 'Total Cost:'}</span>
                <span style={{ color: 'var(--primary-amber)' }}>
                  {((selectedRoom.entryFeeSantim * cardCount) / 100).toFixed(2)} ETB
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedRoom(null)}
                disabled={buyLoading}
              >
                {t('lobby.cancel') || 'Cancel'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmPurchase}
                disabled={buyLoading}
              >
                {buyLoading ? 'Purchasing...' : (t('lobby.confirmBuy') || 'Confirm Buy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
