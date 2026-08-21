import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { api } from '../api';
import { RoomRecord, RoomStatus, RoomTier } from '@bingo/shared';
import { Button, Badge, CurrencyDisplay, Modal, Toast } from '../components/ui';
import { Trophy, Users, Layers, Play, Zap, Plus, ChevronRight, Clock } from 'lucide-react';

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
    return <span style={{ color: 'var(--success)', fontWeight: 700 }}>Starting now...</span>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      <Clock size={14} /> {minutes}:{seconds < 10 ? '0' : ''}{seconds}
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

  useEffect(() => {
    const DEFAULT_DEMO_ROOMS: RoomRecord[] = [
      {
        id: 'room-bronze-demo',
        tier: RoomTier.BRONZE,
        status: RoomStatus.WAITING,
        mode: 'auto',
        type: 'open',
        entryFeeSantim: 1000,
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
        entryFeeSantim: 5000,
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
        entryFeeSantim: 10000,
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
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenJoinModal = (room: RoomRecord) => {
    setSelectedRoom(room);
    setCardCount(1);
    setBuyError('');
  };

  const handleConfirmPurchase = async () => {
    if (!selectedRoom) return;

    const totalCost = selectedRoom.entryFeeSantim * cardCount;
    if (userRecord && userRecord.walletBalanceSantim < totalCost) {
      setBuyError(t('errors.insufficientFunds') || 'Insufficient funds to buy cards.');
      return;
    }

    setBuyLoading(true);
    setBuyError('');

    try {
      if (selectedRoom.id.includes('-demo')) {
        setActiveRoomId(selectedRoom.id);
        navigate(`/room/${selectedRoom.id}`);
        return;
      }

      await api.buyCards(selectedRoom.id, cardCount);
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

  const getTierLabel = (tier: RoomTier) => {
    switch (tier) {
      case RoomTier.BRONZE: return t('lobby.bronze') || 'Bronze Room';
      case RoomTier.SILVER: return t('lobby.silver') || 'Silver Room';
      case RoomTier.GOLD: return t('lobby.gold') || 'Gold Room';
      default: return '';
    }
  };

  const getTierClass = (tier: RoomTier) => {
    switch (tier) {
      case RoomTier.BRONZE: return 'tier-bronze';
      case RoomTier.SILVER: return 'tier-silver';
      case RoomTier.GOLD: return 'tier-gold';
      default: return '';
    }
  };

  return (
    <div className="page-container">
      {/* Lobby Header */}
      <div className="lobby-header">
        <div className="lobby-user-profile">
          <div className="lobby-avatar-ring">
            <span style={{ fontSize: '1.2rem' }}>
              {userRecord?.displayName ? userRecord.displayName[0].toUpperCase() : 'P'}
            </span>
            <div className="lobby-avatar-badge" />
          </div>
          <div>
            <div className="lobby-greeting-sub">
              <span>{t('lobby.welcomeBack') || 'Welcome Back'}</span>
            </div>
            <div className="lobby-greeting-name" style={{ fontFamily: 'var(--font-heading)' }}>
              {userRecord?.displayName || 'Player'}
            </div>
          </div>
        </div>

        <Link to="/wallet" className="lobby-balance-chip" aria-label="Deposit Funds">
          <div className="lobby-balance-info">
            <span className="lobby-balance-label">{t('wallet.balance') || 'Wallet'}</span>
            <CurrencyDisplay santim={userRecord?.walletBalanceSantim || 0} variant="amber" size="md" />
          </div>
          <div className="lobby-balance-add-btn" title="Add Funds">
            <Plus size={16} strokeWidth={3} />
          </div>
        </Link>
      </div>

      {/* Live Winners Ticker Bar */}
      <div className="lobby-ticker-wrap">
        <div className="lobby-ticker-badge">
          <Trophy size={11} />
          <span>LIVE WINS</span>
        </div>
        <div className="lobby-ticker-content">
          <span>🎉 Dawit T. won 4,250 ETB (Gold)</span>
          <span>⚡ Helina K. won 1,800 ETB (Silver)</span>
          <span>🔥 Yonas M. won 750 ETB (Bronze)</span>
          <span>⭐ Bethlehem A. won 5,100 ETB (Gold)</span>
          {/* Duplicate for seamless loop */}
          <span>🎉 Dawit T. won 4,250 ETB (Gold)</span>
          <span>⚡ Helina K. won 1,800 ETB (Silver)</span>
          <span>🔥 Yonas M. won 750 ETB (Bronze)</span>
          <span>⭐ Bethlehem A. won 5,100 ETB (Gold)</span>
        </div>
      </div>

      {/* Jackpot Banner */}
      <div className="lobby-jackpot-card">
        <div>
          <div className="lobby-jackpot-tag">
            <Zap size={14} />
            <span>SUPER BINGO ARENA</span>
          </div>
          <div className="lobby-jackpot-title">
            DAILY MEGA POT
          </div>
        </div>
        <div className="lobby-jackpot-amount">
          100,000 ETB
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="lobby-tabs">
        <button 
          className={`lobby-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span>All</span>
        </button>
        <button 
          className={`lobby-tab ${activeTab === RoomTier.BRONZE ? 'active' : ''}`}
          onClick={() => setActiveTab(RoomTier.BRONZE)}
        >
          <span>{t('lobby.bronzeShort') || 'Bronze'}</span>
        </button>
        <button 
          className={`lobby-tab ${activeTab === RoomTier.SILVER ? 'active' : ''}`}
          onClick={() => setActiveTab(RoomTier.SILVER)}
        >
          <span>{t('lobby.silverShort') || 'Silver'}</span>
        </button>
        <button 
          className={`lobby-tab ${activeTab === RoomTier.GOLD ? 'active' : ''}`}
          onClick={() => setActiveTab(RoomTier.GOLD)}
        >
          <span>{t('lobby.goldShort') || 'Gold'}</span>
        </button>
      </div>

      {/* Section Title */}
      <div className="lobby-section-title">
        <span className="lobby-section-title-text">
          Live Rooms
        </span>
        <span className="lobby-room-count">
          {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'}
        </span>
      </div>

      {/* Low Balance Warning */}
      {userRecord && (userRecord.walletBalanceSantim < 1000) && (
        <Link to="/wallet" style={{ textDecoration: 'none' }}>
          <div className="alert alert-warning" style={{ cursor: 'pointer', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px' }}>
            <span>Your balance is low. Deposit to join rooms.</span>
            <span style={{ fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Deposit Now <ChevronRight size={14} style={{ verticalAlign: 'middle' }} /></span>
          </div>
        </Link>
      )}

      {/* Room Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        {filteredRooms.length === 0 ? (
          <div className="lobby-empty">
            <span className="lobby-empty-icon" style={{ fontSize: '2rem', opacity: 0.4 }}>
              <Layers size={40} />
            </span>
            <span className="lobby-empty-text">
              {t('lobby.noRooms') || 'No active rooms found. Operators will open rooms shortly.'}
            </span>
          </div>
        ) : (
          filteredRooms.map((room, index) => {
            const canAfford = (userRecord?.walletBalanceSantim || 0) >= room.entryFeeSantim;
            const isWaiting = room.status === RoomStatus.WAITING;

            return (
              <div
                key={room.id}
                className={`room-card-premium ${getTierClass(room.tier)}`}
                style={{ animationDelay: `${index * 0.08}s` }}
                onClick={() => isWaiting && handleOpenJoinModal(room)}
              >
                {/* Header: Tier & Mode */}
                <div className="room-card-top">
                  <div className="room-card-tier-wrap">
                    <Badge tier={room.tier} size="md" />
                    <span className="room-tier-mode">{room.mode} · {room.type}</span>
                  </div>

                  <div className={`room-live-beacon ${isWaiting ? 'waiting' : 'active'}`}>
                    <span className="room-beacon-dot" />
                    <span>{isWaiting ? 'Waiting' : 'Live'}</span>
                  </div>
                </div>

                {/* Pot & Entry Strip */}
                <div className="room-card-hero-strip">
                  <div className="room-pot-box">
                    <span className="room-pot-label">
                      <Trophy size={14} />
                      <span>{t('lobby.estPot', 'Est. Jackpot')}</span>
                    </span>
                    <span className="room-pot-val">
                      <CurrencyDisplay santim={room.potSantim} variant="gold" size="lg" />
                    </span>
                  </div>

                  <div className="room-entry-box">
                    <span className="room-entry-label">{t('lobby.entryFee', 'Entry Fee')}</span>
                    <span className="room-entry-val">
                      <CurrencyDisplay santim={room.entryFeeSantim} variant="white" size="md" />
                    </span>
                  </div>
                </div>

                {/* Room Meta */}
                <div className="room-card-meta">
                  <div className="room-meta-item">
                    <Users size={14} />
                    <span>{room.playerCount} {room.playerCount === 1 ? 'Player' : 'Players'}</span>
                  </div>
                  <div className="room-meta-item">
                    <Layers size={14} />
                    <span>Max {room.maxCards} Cards</span>
                  </div>
                </div>

                {/* Countdown for scheduled rooms */}
                {room.type === 'scheduled' && room.scheduledAt && (
                  <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--primary-amber)', fontWeight: 700 }}>
                    <RoomCountdown scheduledAt={room.scheduledAt} />
                  </div>
                )}

                {/* Play Button */}
                {isWaiting && (
                  <button
                    className={`room-play-btn ${!canAfford ? 'disabled' : ''}`}
                    disabled={!canAfford}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canAfford) handleOpenJoinModal(room);
                    }}
                  >
                    {canAfford ? <Play size={16} /> : null}
                    <span>{canAfford ? (t('lobby.join') || 'JOIN ROOM') : 'INSUFFICIENT BALANCE'}</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Buy Cards Modal */}
      {selectedRoom && (
        <Modal
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={t('lobby.buyBingoCards') || 'Buy Bingo Cards'}
          footer={
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setSelectedRoom(null)}
                disabled={buyLoading}
              >
                {t('lobby.cancel') || 'Cancel'}
              </Button>
              <Button
                variant="gold"
                size="md"
                loading={buyLoading}
                onClick={handleConfirmPurchase}
              >
                {t('lobby.confirmBuy') || 'Confirm Purchase'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {t('lobby.selectCardsDesc', { roomName: getTierLabel(selectedRoom.tier) })
                || `Select the number of cards for ${getTierLabel(selectedRoom.tier)}.`}
            </p>

            {buyError && (
              <Toast message={buyError} type="error" onClose={() => setBuyError('')} />
            )}

            {/* Counter */}
            <div className="buy-modal-counter">
              <button
                className="buy-modal-counter-btn"
                onClick={() => setCardCount(Math.max(1, cardCount - 1))}
                disabled={buyLoading || cardCount <= 1}
              >
                −
              </button>
              <span className="buy-modal-count">{cardCount}</span>
              <button
                className="buy-modal-counter-btn"
                onClick={() => setCardCount(Math.min(selectedRoom.maxCards, cardCount + 1))}
                disabled={buyLoading || cardCount >= selectedRoom.maxCards}
              >
                +
              </button>
            </div>

            {/* Summary */}
            <div className="buy-modal-summary">
              <div className="buy-modal-row">
                <span style={{ color: 'var(--text-muted)' }}>{t('lobby.pricePerCard') || 'Price per Card'}</span>
                <CurrencyDisplay santim={selectedRoom.entryFeeSantim} size="sm" variant="muted" />
              </div>
              <div className="buy-modal-row total">
                <span>{t('lobby.totalCost') || 'Total Cost'}</span>
                <CurrencyDisplay santim={selectedRoom.entryFeeSantim * cardCount} size="lg" variant="gold" />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
