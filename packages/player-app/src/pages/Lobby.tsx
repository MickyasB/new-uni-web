import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { useTheme } from '../useTheme';
import { api } from '../api';
import { RoomRecord, RoomStatus, RoomTier } from '@bingo/shared';
import { Button, CurrencyDisplay, Modal, Toast } from '../components/ui';
import { Trophy, Users, Play, Plus, Sun, Moon, Sparkles } from 'lucide-react';

const TWO_CORE_ROOMS: RoomRecord[] = [
  {
    id: 'room-classic-hall',
    tier: RoomTier.SILVER,
    status: RoomStatus.WAITING,
    mode: 'auto',
    type: 'open',
    entryFeeSantim: 1000, // 10 ETB
    potSantim: 5000,      // 50 ETB
    minPlayers: 2,
    maxCards: 6,
    playerCount: 14,
    createdAt: Date.now(),
  },
  {
    id: 'room-gold-lounge',
    tier: RoomTier.GOLD,
    status: RoomStatus.WAITING,
    mode: 'auto',
    type: 'open',
    entryFeeSantim: 5000, // 50 ETB
    potSantim: 25000,     // 250 ETB
    minPlayers: 3,
    maxCards: 6,
    playerCount: 22,
    createdAt: Date.now() - 1000,
  },
];

export default function Lobby() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setActiveRoomId } = useAppStore();
  const { theme, toggle } = useTheme();
  const userRecord = user;

  const [rooms, setRooms] = useState<RoomRecord[]>(TWO_CORE_ROOMS);

  // Buy Cards modal state
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [cardCount, setCardCount] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await api.getRooms();
        const apiRooms: RoomRecord[] = (data.rooms || []).map((r: any) => ({
          id: r.id,
          tier: (r.tier as RoomTier) || RoomTier.SILVER,
          status: (r.status as RoomStatus) || RoomStatus.WAITING,
          mode: r.mode || 'auto',
          type: r.type || 'open',
          entryFeeSantim: parseInt(r.entry_fee_santim || r.entryFeeSantim || 1000),
          potSantim: parseInt(r.pot_santim || r.potSantim || 5000),
          minPlayers: r.min_players || r.minPlayers || 2,
          maxCards: r.max_cards || r.maxCards || 6,
          playerCount: r.player_count || r.playerCount || 12,
          scheduledAt: r.scheduled_at || r.scheduledAt,
          createdAt: parseInt(r.created_at || r.createdAt || Date.now()),
        }));

        if (apiRooms.length >= 2) {
          // Take the top 2 curated room offerings
          setRooms(apiRooms.slice(0, 2));
        } else if (apiRooms.length === 1) {
          setRooms([apiRooms[0], TWO_CORE_ROOMS[1]]);
        } else {
          setRooms(TWO_CORE_ROOMS);
        }
      } catch {
        setRooms(TWO_CORE_ROOMS);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 12000);
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
      setBuyError(t('errors.insufficientFunds') || 'Insufficient wallet balance to buy cards.');
      return;
    }

    setBuyLoading(true);
    setBuyError('');

    try {
      if (selectedRoom.id.includes('-demo') || selectedRoom.id.includes('classic-hall') || selectedRoom.id.includes('gold-lounge')) {
        // Optimistic local / instant room join for demo IDs
        try {
          await api.buyCards(selectedRoom.id, cardCount);
        } catch {
          // Fallback if backend room not yet provisioned
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

  const getRoomMeta = (room: RoomRecord) => {
    const isGold = room.tier === RoomTier.GOLD || room.id.includes('gold');
    return {
      title: isGold ? 'Gold Lounge' : 'Classic Hall',
      subtitle: isGold ? 'High Stakes · Royal Jackpot' : 'Standard Stakes · Fast Live Play',
      badge: isGold ? 'VIP GOLD' : 'CLASSIC',
      isGold,
    };
  };

  return (
    <div className="page-container lobby-minimal-page">
      {/* ── Top Focal Bar: Profile, Theme Toggle & Prominent Balance ── */}
      <header className="lobby-minimal-header">
        <div className="lobby-user-group">
          <div className="lobby-avatar-minimal">
            <span>{userRecord?.displayName ? userRecord.displayName[0].toUpperCase() : 'P'}</span>
          </div>
          <div className="lobby-greeting-text">
            <span className="lobby-greeting-sub">{t('lobby.welcomeBack') || 'Welcome'}</span>
            <h2 className="lobby-greeting-name">{userRecord?.displayName || 'Player'}</h2>
          </div>
        </div>

        <div className="lobby-header-actions">
          {/* Theme Toggle Button */}
          <button
            onClick={toggle}
            className="theme-toggle-btn"
            aria-label="Toggle Light/Dark Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Prominent Balance Chip */}
          <Link to="/wallet" className="lobby-balance-pill" aria-label="Wallet Balance">
            <div className="balance-text-stack">
              <span className="balance-pill-label">{t('wallet.balance') || 'Balance'}</span>
              <CurrencyDisplay santim={userRecord?.walletBalanceSantim || 0} variant="gold" size="md" />
            </div>
            <div className="balance-add-icon" title="Deposit">
              <Plus size={15} strokeWidth={3} />
            </div>
          </Link>
        </div>
      </header>

      {/* ── Main Clean Rooms View ── */}
      <main className="lobby-main-body">
        <div className="lobby-section-header-minimal">
          <div className="section-title-wrap">
            <Sparkles size={16} className="gold-sparkle-icon" />
            <h3 className="section-heading-text">{t('lobby.gameRooms') || 'Select Game Room'}</h3>
          </div>
          <span className="section-room-badge">2 Active Rooms</span>
        </div>

        {/* The Two Curated Game Rooms */}
        <div className="lobby-two-rooms-grid">
          {rooms.map((room) => {
            const { title, subtitle, badge, isGold } = getRoomMeta(room);
            const canAfford = (userRecord?.walletBalanceSantim || 0) >= room.entryFeeSantim;

            return (
              <div
                key={room.id}
                className={`minimal-room-card ${isGold ? 'gold-lounge-card' : 'classic-hall-card'}`}
                onClick={() => handleOpenJoinModal(room)}
              >
                {/* Top Row: Room Title & Live Badge */}
                <div className="minimal-room-top">
                  <div className="room-title-block">
                    <div className="room-badge-pill">{badge}</div>
                    <h4 className="minimal-room-title">{title}</h4>
                    <p className="minimal-room-subtitle">{subtitle}</p>
                  </div>

                  <div className="room-status-indicator">
                    <span className="live-pulse-dot-clean" />
                    <span>Live</span>
                  </div>
                </div>

                {/* Center Pot & Fee Highlight */}
                <div className="minimal-room-stats-row">
                  <div className="stat-box-pot">
                    <span className="stat-label">
                      <Trophy size={13} />
                      <span>{t('lobby.estPot') || 'Est. Jackpot'}</span>
                    </span>
                    <span className="stat-val-pot">
                      <CurrencyDisplay santim={room.potSantim} variant="gold" size="lg" />
                    </span>
                  </div>

                  <div className="stat-box-entry">
                    <span className="stat-label">{t('lobby.entryFee') || 'Entry Fee'}</span>
                    <span className="stat-val-entry">
                      <CurrencyDisplay santim={room.entryFeeSantim} size="md" />
                    </span>
                  </div>
                </div>

                {/* Bottom Meta & Primary Rich Gold Action */}
                <div className="minimal-room-footer">
                  <div className="room-players-count">
                    <Users size={14} />
                    <span>{room.playerCount} playing</span>
                  </div>

                  <button
                    className="room-cta-gold-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenJoinModal(room);
                    }}
                  >
                    <Play size={15} fill="currentColor" />
                    <span>{canAfford ? 'PLAY NOW' : 'BUY CARDS'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Buy Cards Modal ── */}
      {selectedRoom && (
        <Modal
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={`Join ${getRoomMeta(selectedRoom).title}`}
          footer={
            <div className="modal-actions-dual">
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
            </div>
          }
        >
          <div className="buy-modal-minimal-content">
            <p className="buy-modal-desc">
              Select how many Bingo cards you want to play with in this round (Max {selectedRoom.maxCards}):
            </p>

            {buyError && (
              <Toast message={buyError} type="error" onClose={() => setBuyError('')} />
            )}

            {/* Stepper */}
            <div className="card-stepper-minimal">
              <button
                className="stepper-btn-circle"
                onClick={() => setCardCount(Math.max(1, cardCount - 1))}
                disabled={buyLoading || cardCount <= 1}
              >
                −
              </button>
              <div className="stepper-display">
                <span className="stepper-num">{cardCount}</span>
                <span className="stepper-unit">{cardCount === 1 ? 'Card' : 'Cards'}</span>
              </div>
              <button
                className="stepper-btn-circle"
                onClick={() => setCardCount(Math.min(selectedRoom.maxCards, cardCount + 1))}
                disabled={buyLoading || cardCount >= selectedRoom.maxCards}
              >
                +
              </button>
            </div>

            {/* Price Breakdown */}
            <div className="buy-cost-summary">
              <div className="cost-row">
                <span>Price per Card</span>
                <CurrencyDisplay santim={selectedRoom.entryFeeSantim} size="sm" />
              </div>
              <div className="cost-row total-row">
                <span>Total Entry Cost</span>
                <CurrencyDisplay santim={selectedRoom.entryFeeSantim * cardCount} size="lg" variant="gold" />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
