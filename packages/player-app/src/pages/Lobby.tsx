import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { useTheme } from '../useTheme';
import { api } from '../api';
import { dbService, DbRoom } from '../dbService';
import { RoomRecord, RoomStatus, RoomTier } from '@bingo/shared';
import { Button, Badge, CurrencyDisplay, Modal, Toast } from '../components/ui';
import { Trophy, Users, Play, Plus, Sun, Moon } from 'lucide-react';

export default function Lobby() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setActiveRoomId } = useAppStore();
  const { theme, toggle } = useTheme();
  const userRecord = user;

  const [rooms, setRooms] = useState<RoomRecord[]>([]);

  // Buy Cards modal state
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [cardCount, setCardCount] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');

  const loadRooms = () => {
    const dbRooms = dbService.getRooms();
    const mapped: RoomRecord[] = dbRooms.map((r, idx) => ({
      id: r.id,
      tier: (r.tier as RoomTier) || RoomTier.SILVER,
      status: r.status === 'active' ? RoomStatus.IN_PROGRESS : RoomStatus.WAITING,
      mode: 'auto',
      type: 'open',
      entryFeeSantim: Math.round(r.entryFeeETB * 100),
      potSantim: Math.round((r.potETB || r.entryFeeETB * 5) * 100),
      minPlayers: 2,
      maxCards: 6,
      playerCount: r.playerCount || (idx === 0 ? 14 : idx === 1 ? 22 : 8),
      createdAt: Date.now() - idx * 1000,
    }));
    setRooms(mapped);
  };

  useEffect(() => {
    loadRooms();
    const unsub = dbService.subscribe(loadRooms);
    return unsub;
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
      if (selectedRoom.id.includes('-demo') || selectedRoom.id.includes('classic-hall') || selectedRoom.id.includes('gold-lounge')) {
        try {
          await api.buyCards(selectedRoom.id, cardCount);
        } catch {
          // Local fallback
        }
        setActiveRoomId(selectedRoom.id);
        navigate(`/room/${selectedRoom.id}`);
        return;
      }

      await api.buyCards(selectedRoom.id, cardCount);
      setActiveRoomId(selectedRoom.id);
      navigate(`/room/${selectedRoom.id}`);
    } catch (err: any) {
      setBuyError(err.message || t('errors.generic') || 'Failed to purchase cards.');
    } finally {
      setBuyLoading(false);
    }
  };

  const getRoomTitle = (room: RoomRecord) => {
    const isGold = room.tier === RoomTier.GOLD || room.id.includes('gold');
    return isGold ? (t('lobby.goldLounge') || 'Gold Lounge') : (t('lobby.classicHall') || 'Classic Hall');
  };

  const getRoomSubtitle = (room: RoomRecord) => {
    const isGold = room.tier === RoomTier.GOLD || room.id.includes('gold');
    return isGold ? 'High Stakes · Royal Jackpot' : 'Standard Stakes · Fast Live Play';
  };

  return (
    <div className="page-container">
      {/* ── Lobby Top Header ── */}
      <div className="lobby-header">
        <div className="lobby-user-profile">
          <div className="lobby-avatar-ring">
            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>
              {userRecord?.displayName ? userRecord.displayName[0].toUpperCase() : 'P'}
            </span>
            <div className="lobby-avatar-badge" />
          </div>
          <div>
            <div className="lobby-greeting-sub">
              <span>{t('lobby.welcomeBack') || 'Welcome back'}</span>
            </div>
            <div className="lobby-greeting-name" style={{ fontFamily: 'var(--font-heading)' }}>
              {userRecord?.displayName || 'Player'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggle}
            className="theme-toggle-btn"
            aria-label="Toggle Light/Dark Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Balance Chip with Quick Deposit */}
          <Link to="/wallet" className="lobby-balance-chip" aria-label="Deposit Funds">
            <div className="lobby-balance-info">
              <span className="lobby-balance-label">{t('wallet.balance') || 'Wallet'}</span>
              <CurrencyDisplay santim={userRecord?.walletBalanceSantim || 0} variant="gold" size="md" />
            </div>
            <div className="lobby-balance-add-btn" title="Add Funds">
              <Plus size={16} strokeWidth={3} />
            </div>
          </Link>
        </div>
      </div>

      {/* ── Section Title (Clean & Breathable) ── */}
      <div className="lobby-section-title" style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
        <span className="lobby-section-title-text" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-light)' }}>
          {t('lobby.gameRooms') || 'Game Rooms'}
        </span>
        <span className="lobby-room-count">
          2 {t('lobby.activeRooms') || 'Active Rooms'}
        </span>
      </div>

      {/* ── The Two Curated Game Rooms (Classic Hall & Gold Lounge) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', flex: 1, marginTop: '0.5rem' }}>
        {rooms.map((room, index) => {
          const isGold = room.tier === RoomTier.GOLD || room.id.includes('gold');
          const canAfford = (userRecord?.walletBalanceSantim || 0) >= room.entryFeeSantim;
          const title = getRoomTitle(room);
          const subtitle = getRoomSubtitle(room);

          return (
            <div
              key={room.id}
              className={`room-card-premium ${isGold ? 'tier-gold' : 'tier-silver'}`}
              style={{ animationDelay: `${index * 0.08}s` }}
              onClick={() => handleOpenJoinModal(room)}
            >
              {/* Header: Tier, Room Name & Live Beacon */}
              <div className="room-card-top">
                <div className="room-card-tier-wrap">
                  <Badge tier={room.tier} size="md" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-light)', fontFamily: 'var(--font-heading)' }}>
                      {title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {subtitle}
                    </div>
                  </div>
                </div>

                <div className="room-live-beacon waiting">
                  <span className="room-beacon-dot" />
                  <span>Live</span>
                </div>
              </div>

              {/* Pot & Entry Strip */}
              <div className="room-card-hero-strip">
                <div className="room-pot-box">
                  <span className="room-pot-label">
                    <Trophy size={14} />
                    <span>{t('lobby.estPot') || 'Est. Jackpot'}</span>
                  </span>
                  <span className="room-pot-val">
                    <CurrencyDisplay santim={room.potSantim} variant="gold" size="lg" />
                  </span>
                </div>

                <div className="room-entry-box">
                  <span className="room-entry-label">{t('lobby.entryFee') || 'Entry Fee'}</span>
                  <span className="room-entry-val">
                    <CurrencyDisplay santim={room.entryFeeSantim} size="md" />
                  </span>
                </div>
              </div>

              {/* Room Meta */}
              <div className="room-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="room-meta-item">
                  <Users size={14} />
                  <span>{room.playerCount} {t('lobby.players') || 'Players'}</span>
                </div>
                <div className="room-meta-item">
                  <span>Max {room.maxCards} Cards</span>
                </div>
              </div>

              {/* Primary Call to Action Button */}
              <button
                className={`room-play-btn ${!canAfford ? 'disabled' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenJoinModal(room);
                }}
              >
                <Play size={16} fill="currentColor" />
                <span>{canAfford ? (t('lobby.join') || 'PLAY NOW') : 'BUY CARDS'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Buy Cards Modal ── */}
      {selectedRoom && (
        <Modal
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={`Join ${getRoomTitle(selectedRoom)}`}
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
                {t('lobby.confirmBuy') || 'Confirm & Play'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {t('lobby.selectCardsDesc', { roomName: getRoomTitle(selectedRoom) })
                || `Select how many Bingo cards you want to play with (Max ${selectedRoom.maxCards}).`}
            </p>

            {buyError && (
              <Toast message={buyError} type="error" onClose={() => setBuyError('')} />
            )}

            {/* Stepper Counter */}
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

            {/* Summary Breakdown */}
            <div className="buy-modal-summary">
              <div className="buy-modal-row">
                <span style={{ color: 'var(--text-muted)' }}>{t('lobby.pricePerCard') || 'Price per Card:'}</span>
                <CurrencyDisplay santim={selectedRoom.entryFeeSantim} size="sm" variant="muted" />
              </div>
              <div className="buy-modal-row total">
                <span>{t('lobby.totalCost') || 'Total Cost:'}</span>
                <CurrencyDisplay santim={selectedRoom.entryFeeSantim * cardCount} size="lg" variant="gold" />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
