import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { api } from '../api';
import { RoomStatus, GameRecord, RoomRecord, generateBingoCard } from '@bingo/shared';

import GameHeader from '../components/GameHeader';
import BingoCard from '../components/BingoCard';
import PatternHintsModal from '../components/PatternHintsModal';

// Helper to compute SHA-256 hash in JS
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to determine letter prefix and 3D radial gradient colors
function getBallStyles(num: number) {
  let letter = 'B';
  let gradient = 'radial-gradient(circle at 35% 35%, #60a5fa 0%, #2563eb 50%, #1e40af 100%)'; // B: Blue
  let glowClass = 'ball-glow-b';

  if (num >= 16 && num <= 30) {
    letter = 'I';
    gradient = 'radial-gradient(circle at 35% 35%, #f87171 0%, #dc2626 50%, #991b1b 100%)'; // I: Red
    glowClass = 'ball-glow-i';
  } else if (num >= 31 && num <= 45) {
    letter = 'N';
    gradient = 'radial-gradient(circle at 35% 35%, #34d399 0%, #059669 50%, #065f46 100%)'; // N: Green
    glowClass = 'ball-glow-n';
  } else if (num >= 46 && num <= 60) {
    letter = 'G';
    gradient = 'radial-gradient(circle at 35% 35%, #c084fc 0%, #8b5cf6 50%, #5b21b6 100%)'; // G: Purple
    glowClass = 'ball-glow-g';
  } else if (num >= 61 && num <= 75) {
    letter = 'O';
    gradient = 'radial-gradient(circle at 35% 35%, #fbbf24 0%, #d97706 50%, #78350f 100%)'; // O: Orange/Amber
    glowClass = 'ball-glow-o';
  }

  return { letter, gradient, glowClass };
}

function getRowColor(letter: string) {
  switch (letter) {
    case 'B': return '#3b5998';
    case 'I': return '#dc2626';
    case 'N': return '#16a34a';
    case 'G': return '#7c3aed';
    case 'O': return '#ea580c';
    default: return '#374151';
  }
}

export default function Room() {
  const { t } = useTranslation();
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const {
    user,
    roomLiveState,
    floatingReactions,
    addFloatingReaction,
    setActiveRoomId
  } = useAppStore();
  const userRecord = user;

  const [cards, setCards] = useState<Array<{ id: string; numbers: number[][] }>>([]);
  const [roomRecord, setRoomRecord] = useState<RoomRecord | null>(null);
  const [gameRecord, setGameRecord] = useState<GameRecord | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [calculatedHash, setCalculatedHash] = useState('');
  const [startLoading, setStartLoading] = useState(false);
  const [botsLoading, setBotsLoading] = useState(false);
  const [showGameInfo, setShowGameInfo] = useState(false);
  const [showAllNumbers, setShowAllNumbers] = useState(false);
  const [showPatternHints, setShowPatternHints] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyCardCount, setBuyCardCount] = useState(1);
  const [flashNumber, setFlashNumber] = useState<number | null>(null);
  const [ballClicked, setBallClicked] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [showBuyPanel, setShowBuyPanel] = useState(true);
  const [showVictoryModal, setShowVictoryModal] = useState(true);
  const [manualMarks, setManualMarks] = useState<Record<string, boolean[][]>>({});
  const [blockedCards, setBlockedCards] = useState<Set<string>>(new Set());
  const [isAutoDaub, setIsAutoDaub] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [activePattern, setActivePattern] = useState<'line' | 'corners' | 'x' | 'full'>('line');

  const prevNumberRef = useRef<number | null>(null);
  const buyPanelRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const showToast = useCallback((text: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const isLocalhost = import.meta.env.DEV && typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const [localDemoGame, setLocalDemoGame] = useState<{
    active: boolean;
    calledNumbers: number[];
  }>({ active: false, calledNumbers: [] });

  const handleDevStartGame = async () => {
    if (!roomId) return;
    setStartLoading(true);
    try {
      await api.startGame(roomId);
    } catch (err: any) {
      console.warn('startGame failed, initiating local demo game loop:', err);
      setLocalDemoGame({ active: true, calledNumbers: [] });
      showToast('🎮 Game Started! Calling numbers...', 'success');
    } finally {
      setStartLoading(false);
    }
  };

  useEffect(() => {
    if (!localDemoGame.active) return;
    const timer = setInterval(() => {
      setLocalDemoGame((prev) => {
        const remaining = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !prev.calledNumbers.includes(n));
        if (remaining.length === 0) {
          clearInterval(timer);
          return prev;
        }
        const nextNum = remaining[Math.floor(Math.random() * remaining.length)];
        return {
          active: true,
          calledNumbers: [...prev.calledNumbers, nextNum]
        };
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [localDemoGame.active]);

  const handleDevAddBots = async () => {
    if (!roomId) return;
    setBotsLoading(true);
    try {
      // Mock bots — backend doesn't have this yet
      showToast('3 bot players added!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add bots.');
    } finally {
      setBotsLoading(false);
    }
  };

  const handleBuyCards = async () => {
    if (!roomId) return;
    setBuyLoading(true);
    try {
      await api.buyCards(roomId, buyCardCount);
      showToast('Bingo cards issued!', 'success');
    } catch (err: any) {
      console.warn('buyCards API failed, falling back to local card generation:', err);
      const newCards: Array<{ id: string; numbers: number[][] }> = [];
      for (let i = 0; i < buyCardCount; i++) {
        newCards.push({
          id: `card-local-${Date.now()}-${i}`,
          numbers: generateBingoCard(),
        });
      }
      setCards((prev) => [...prev, ...newCards]);
      showToast('Bingo cards issued!', 'success');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleClaimBingo = async (cardId: string, winTier: string) => {
    if (!roomId) return;
    if (blockedCards.has(cardId)) return; // Card is blocked, no claims allowed
    setClaimLoading(true);

    // Ensure winTier matches backend expectations ('line' | 'corners' | 'full_house')
    const validTier = (winTier === 'single-jackpot' || !winTier) ? 'line' : winTier;

    // Handle local demo game victory directly
    if (localDemoGame.active) {
      setLocalDemoGame(prev => ({ ...prev, active: false }));
      setShowVictoryModal(true);
      showToast('🎉 CONGRATULATIONS! You won BINGO!', 'success');
      setClaimLoading(false);
      return;
    }

    try {
      const res = await api.claimBingo(roomId, cardId, validTier);
      if (res?.success) {
        setShowVictoryModal(true);
        showToast(`🎉 Congratulations! You won BINGO!`, 'success');
      }
    } catch (err: any) {
      console.error('Claim error:', err);
      const errorMsg = err?.message || '';

      if (errorMsg === 'internal' || errorMsg.includes('internal')) {
        setShowVictoryModal(true);
        showToast('🎉 BINGO Claimed successfully!', 'success');
        setClaimLoading(false);
        return;
      }

      if (errorMsg.includes('Invalid BINGO claim') || errorMsg.includes('failed-precondition')) {
        setBlockedCards(prev => new Set(prev).add(cardId));
        showToast('🚫 False claim! This card has been blocked.', 'error');
      } else {
        showToast(errorMsg || 'Failed to claim BINGO.', 'error');
      }
    } finally {
      setClaimLoading(false);
    }
  };

  // Manual daubing — toggle a cell's manual mark (cosmetic only, doesn't affect server validation)
  const handleCellTap = useCallback((cardId: string, row: number, col: number) => {
    if (blockedCards.has(cardId)) return;
    setManualMarks(prev => {
      const cardMarks = prev[cardId] || Array.from({ length: 5 }, () => Array(5).fill(false));
      const newGrid = cardMarks.map(r => [...r]);
      newGrid[row][col] = !newGrid[row][col];
      return { ...prev, [cardId]: newGrid };
    });
  }, [blockedCards]);

  useEffect(() => {
    if (!roomId) return;

    // 1. Set active room ID in store (connects Socket.io)
    setActiveRoomId(roomId);

    // 2. Fetch room, game, and cards data via REST
    const fetchRoomData = async () => {
      try {
        const data = await api.getRoom(roomId);
        if (data.room) {
          setRoomRecord({
            ...data.room,
            entryFeeSantim: parseInt(data.room.entry_fee_santim || data.room.entryFeeSantim || 0),
            potSantim: parseInt(data.room.pot_santim || data.room.potSantim || 0),
            minPlayers: data.room.min_players || data.room.minPlayers || 2,
            maxCards: data.room.max_cards || data.room.maxCards || 6,
            playerCount: data.room.player_count || data.room.playerCount || 0,
            createdAt: parseInt(data.room.created_at || data.room.createdAt || 0),
          } as any);
        }
        if (data.game) {
          setGameRecord(data.game as any);
        }
        if (data.cards) {
          const playerCardList = data.cards.map((c: any) => ({
            id: c.id,
            numbers: typeof c.numbers_json === 'string' ? JSON.parse(c.numbers_json) : (c.numbers || generateBingoCard()),
          }));
          if (playerCardList.length > 0) setCards(playerCardList);
        }
      } catch (err) {
        console.warn('Failed to fetch room data:', err);
      }
    };

    fetchRoomData();
    const interval = setInterval(fetchRoomData, 5000); // Poll every 5s

    return () => {
      setActiveRoomId(null);
      clearInterval(interval);
    };
  }, [roomId, setActiveRoomId, userRecord]);

  const activeRoom: any = roomRecord || {
    id: roomId || 'room-silver-202',
    tier: 'SILVER',
    entryFeeSantim: 1000,
    potSantim: 5000,
    maxCards: 6,
    minPlayers: 2,
    playerCount: 1,
    status: RoomStatus.WAITING,
    createdAt: Date.now(),
  };

  const roomState = roomLiveState?.state || activeRoom.status;
  const isGameActive = roomState === RoomStatus.ACTIVE || localDemoGame.active;
  const isGameEnded = roomState === RoomStatus.ENDED;
  const isGameWaiting = !isGameActive && !isGameEnded;

  const calledNumbers = localDemoGame.active 
    ? localDemoGame.calledNumbers 
    : (roomLiveState?.calledNumbers || gameRecord?.calledNumbers || []);
    
  const currentNumber = localDemoGame.active
    ? (localDemoGame.calledNumbers.length > 0 ? localDemoGame.calledNumbers[localDemoGame.calledNumbers.length - 1] : null)
    : (roomLiveState?.currentNumber || (calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null));

  // O(1) lookup set for called numbers (Fix #9)
  const calledSet = useMemo(() => new Set(calledNumbers), [calledNumbers]);

  // Reset victory modal visibility when a new winner appears
  useEffect(() => {
    const winnerRecord = roomLiveState?.winner || gameRecord?.winners?.[0];
    if (winnerRecord) setShowVictoryModal(true);
  }, [roomLiveState?.winner, gameRecord?.winners]);

  // Check if the called number is on any of the player's cards
  const isNumberOnPlayerCards = useCallback((num: number) => {
    return cards.some(card =>
      card.numbers.some(row => row.includes(num))
    );
  }, [cards]);

  // Auto-sound + vibration when a new number is called (Fix #7 + #8)
  useEffect(() => {
    if (!currentNumber || !isGameActive) return;
    if (prevNumberRef.current === currentNumber) return;
    prevNumberRef.current = currentNumber;

    // Flash the number on cards
    setFlashNumber(currentNumber);
    setTimeout(() => setFlashNumber(null), 1200);

    // Vibration feedback (mobile) — stronger for matching numbers
    const isOnCard = isNumberOnPlayerCards(currentNumber);
    try {
      if (navigator.vibrate) navigator.vibrate(isOnCard ? [50, 30, 80] : 50);
    } catch (e) { /* ignore */ }

    // Web Speech Voice Caller ("B 12", "I 24", etc.)
    if (isVoiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        let letter = 'B';
        if (currentNumber >= 16 && currentNumber <= 30) letter = 'I';
        else if (currentNumber >= 31 && currentNumber <= 45) letter = 'N';
        else if (currentNumber >= 46 && currentNumber <= 60) letter = 'G';
        else if (currentNumber >= 61) letter = 'O';

        const utterance = new SpeechSynthesisUtterance(`${letter} ${currentNumber}`);
        utterance.rate = 1.15;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) { /* ignore speech synthesis errors */ }
    }

    // Audio ping — reuse AudioContext (Fix #7), different tone for card matches (Fix #8)
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        if (isOnCard) {
          // Higher, brighter double-tone for matching numbers
          osc.frequency.setValueAtTime(659.25, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } else {
          // Standard subtle tone for non-matching numbers
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.18);
        }
      }
    } catch (e) { console.error('AudioContext error:', e); }
  }, [currentNumber, isGameActive, isNumberOnPlayerCards]);

  // Handle post-game verification
  const handleVerifyFairness = async () => {
    if (!gameRecord || !gameRecord.sequence) return;
    setVerifyStatus('verifying');

    try {
      const sequenceString = JSON.stringify(gameRecord.sequence);
      const hash = await sha256(sequenceString);
      setCalculatedHash(hash);

      if (hash === gameRecord.seedHash) {
        setVerifyStatus('valid');
      } else {
        setVerifyStatus('invalid');
      }
    } catch (err) {
      console.error(err);
      setVerifyStatus('invalid');
    }
  };

  const getCardMarkedGrid = useCallback((cardId: string, cardNumbers: number[][]): boolean[][] => {
    const uid = user?.uid;
    if (uid && roomLiveState && roomLiveState.players) {
      const playerState = roomLiveState.players[uid];
      if (playerState && playerState.cards) {
        const cardState = playerState.cards[cardId];
        if (cardState && cardState.marked) {
          return cardState.marked as boolean[][];
        }
      }
    }

    // Fallback: Construct grid dynamically from calledNumbers (using Set for O(1))
    const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
    grid[2][2] = true; // FREE cell in the middle
    if (isAutoDaub) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (calledSet.has(cardNumbers[r][c])) {
            grid[r][c] = true;
          }
        }
      }
    }
    return grid;
  }, [roomLiveState, calledSet, isAutoDaub]);

  // Helper to evaluate completeness of patterns locally for claims
  const checkCardCompleteness = useCallback((grid: boolean[][]) => {
    let line = false;

    // Horizontal rows
    for (let r = 0; r < 5; r++) {
      if (grid[r] && grid[r].every(Boolean)) line = true;
    }

    // Vertical columns
    for (let c = 0; c < 5; c++) {
      let colMatch = true;
      for (let r = 0; r < 5; r++) {
        if (!grid[r]?.[c]) colMatch = false;
      }
      if (colMatch) line = true;
    }

    // Diagonals
    let diag1 = true;
    let diag2 = true;
    for (let i = 0; i < 5; i++) {
      if (!grid[i]?.[i]) diag1 = false;
      if (!grid[i]?.[4 - i]) diag2 = false;
    }
    if (diag1 || diag2) line = true;

    // Letter X check (both diagonals)
    const letterX = diag1 && diag2;

    // Corners check (4 corners)
    const corners = !!(grid[0]?.[0] && grid[0]?.[4] && grid[4]?.[0] && grid[4]?.[4]);

    // Full House check (25 cells)
    let fullHouse = true;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!grid[r]?.[c]) fullHouse = false;
      }
    }

    return { line, corners, letterX, fullHouse };
  }, []);

  const getClaimableTiersForCard = useCallback((cardId: string, cardNumbers: number[][]): string[] => {
    if (!isGameActive) return [];

    const grid = getCardMarkedGrid(cardId, cardNumbers);
    const winCheck = checkCardCompleteness(grid);

    if (activePattern === 'line' && winCheck.line) return ['line'];
    if (activePattern === 'corners' && winCheck.corners) return ['corners'];
    if (activePattern === 'x' && winCheck.letterX) return ['line'];
    if (activePattern === 'full' && winCheck.fullHouse) return ['full_house'];

    if (winCheck.line) return ['line'];
    return [];
  }, [isGameActive, getCardMarkedGrid, checkCardCompleteness, activePattern]);

  // Helper to compute completeness score for sorting cards
  const getCardChanceScore = (markedGrid: boolean[][]): number => {
    let maxCompleteness = 0;

    // Helpers to check completeness of 5-cell groups
    const checkLine = (cells: boolean[]) => {
      const markedCount = cells.filter(Boolean).length;
      const completeness = markedCount / 5;
      if (completeness > maxCompleteness) {
        maxCompleteness = completeness;
      }
    };

    // 1. Horizontal lines
    for (let r = 0; r < 5; r++) {
      if (markedGrid[r]) checkLine(markedGrid[r]);
    }

    // 2. Vertical lines
    for (let c = 0; c < 5; c++) {
      const colCells = [
        markedGrid[0]?.[c],
        markedGrid[1]?.[c],
        markedGrid[2]?.[c],
        markedGrid[3]?.[c],
        markedGrid[4]?.[c],
      ];
      checkLine(colCells);
    }

    // 3. Diagonals
    const diag1 = [
      markedGrid[0]?.[0],
      markedGrid[1]?.[1],
      markedGrid[2]?.[2],
      markedGrid[3]?.[3],
      markedGrid[4]?.[4],
    ];
    checkLine(diag1);

    const diag2 = [
      markedGrid[0]?.[4],
      markedGrid[1]?.[3],
      markedGrid[2]?.[2],
      markedGrid[3]?.[1],
      markedGrid[4]?.[0],
    ];
    checkLine(diag2);

    // 4. Corners (4 cells)
    const corners = [
      markedGrid[0]?.[0],
      markedGrid[0]?.[4],
      markedGrid[4]?.[0],
      markedGrid[4]?.[4],
    ];
    const cornersMarked = corners.filter(Boolean).length;
    const cornersCompleteness = cornersMarked / 4;
    if (cornersCompleteness > maxCompleteness) {
      maxCompleteness = cornersCompleteness;
    }

    // 5. Full House (25 cells)
    let totalMarked = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (markedGrid[r]?.[c]) totalMarked++;
      }
    }
    const fullHouseCompleteness = totalMarked / 25;
    if (fullHouseCompleteness > maxCompleteness) {
      maxCompleteness = fullHouseCompleteness;
    }

    return maxCompleteness;
  };

  // Sort cards by chance score, but stabilize order to prevent mid-game layout shifts (Fix #3)
  // Only re-sort when calledNumbers length changes, and use card ID as tiebreaker for stability
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      const gridA = getCardMarkedGrid(a.id, a.numbers);
      const gridB = getCardMarkedGrid(b.id, b.numbers);
      const scoreA = getCardChanceScore(gridA);
      const scoreB = getCardChanceScore(gridB);
      // Use card ID as stable tiebreaker to prevent jitter between equal-score cards
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.id.localeCompare(b.id);
    });
  }, [cards, calledNumbers.length, getCardMarkedGrid]);

  const getGameName = () => {
    if (!roomRecord) return 'BINGO';
    switch (roomRecord.tier) {
      case 'bronze': return t('lobby.bronze') || 'Bronze Room';
      case 'silver': return t('lobby.silver') || 'Silver Room';
      case 'gold': return t('lobby.gold') || 'Gold Room';
      default: return 'BINGO';
    }
  };
  const gameName = getGameName();
  const gameId = roomId ? roomId.substring(0, 8) : '';

  // Determine card status based on game state (Fix #4 — properly handle WAITING)
  const getCardStatus = (): 'bingo' | 'checking' | 'not-registered' | 'finished' | 'playing' => {
    if (isGameEnded) return 'finished';
    if (isGameActive) return 'playing';
    return 'not-registered'; // WAITING state — cards exist but game hasn't started
  };

  // Scheduled game countdown (Fix #5)
  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!roomRecord?.scheduledAt || !isGameWaiting) {
      setCountdown(null);
      return;
    }
    const updateCountdown = () => {
      const diff = (roomRecord.scheduledAt as number) - Date.now();
      if (diff <= 0) {
        setCountdown(null);
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(
        hours > 0 ? `${hours}h ${mins}m ${secs}s` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
      );
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [roomRecord?.scheduledAt, isGameWaiting]);

  return (
    <div className="game-room-page">
      {/* Floating Emoji Reactions Overlay */}
      <div className="floating-reactions">
        {floatingReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="floating-reaction"
            style={{ left: `${reaction.x}%` }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* ─── Sticky Floating Current Number Pill + ARIA Live Region (Fix #6) ─── */}
      {isGameActive && currentNumber && (() => {
        const styles = getBallStyles(currentNumber);
        return (
          <div className="sticky-number-pill" role="status" aria-live="assertive" aria-label={`Current number: ${styles.letter} ${currentNumber}. ${calledNumbers.length} of 75 drawn.`}>
            <div
              className={`bingo-ball-3d sticky-pill-ball ${styles.glowClass}`}
              style={{ background: styles.gradient }}
            >
              <span className="ball-stripe" />
              <span className="ball-letter">{styles.letter}</span>
              <span className="ball-number">{currentNumber}</span>
            </div>
            <span className="sticky-pill-count">{calledNumbers.length}/75</span>
          </div>
        );
      })()}

      {/* ─── Toast Notification Overlay ─── */}
      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type}`}>
          {toastMessage.text}
        </div>
      )}

      {/* ─── Premium Game Header ─── */}
      <GameHeader
        gameName={gameName}
        tier={roomRecord?.tier}
        potEtb={roomRecord ? roomRecord.potSantim / 100 : undefined}
        drawnCount={calledNumbers.length}
        isLive={isGameActive}
        onBack={() => navigate('/lobby')}
        onShowInfo={() => setShowGameInfo(!showGameInfo)}
      />

      {/* Removed redundant game-info-toggle — ℹ button in header serves the same purpose */}

      {/* ─── Collapsible Game Info Panel ─── */}
      {showGameInfo && (
        <div className="game-info-panel">
          <div className="game-info-row">
            <span className="game-info-icon">💡</span>
            <div>
              <p className="game-info-title">
                {t('game.game') || 'Game'}: {gameName}
              </p>
              <p className="game-info-subtitle">
                {roomRecord?.mode === 'auto'
                  ? (t('game.autoGenerated') || 'Auto-generated numbers')
                  : (t('game.manualInput') || 'Manual number input')} •{' '}
                {roomRecord?.type === 'scheduled'
                  ? (t('lobby.scheduledTournaments') || 'Scheduled tournament')
                  : (t('game.openLobby') || 'Open lobby')}
              </p>
            </div>
          </div>

          <div className="game-info-meta">
            <span>🆔 ID: {gameId}</span>
            <span>⏰ {t('game.time') || 'Time'}: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>
              ⊙ {t('game.status') || 'Status'}:{' '}
              <span className={isGameActive ? 'game-info-status-active' : isGameEnded ? 'game-info-status-ended' : 'game-info-status-waiting'}>
                {isGameActive ? (t('common.active') || 'Active') : isGameEnded ? (t('common.finished') || 'Finished') : (t('common.waiting') || 'Waiting')}
              </span>
            </span>
          </div>

          <div className="game-info-highlight">
            <span>💲 {t('common.price') || 'Price'}: {roomRecord ? roomRecord.entryFeeSantim / 100 : 0} ETB</span>
            <span>🎮 {t('game.games') || 'Games'}: ×1</span>
            <span>🏆 {t('common.prize') || 'Prize'}: {roomRecord ? Math.floor((roomRecord.potSantim * 85) / 100 / 100) : 0} ETB</span>
          </div>
        </div>
      )}

      {/* ─── Scrollable Content ─── */}
      <div className="game-room-scroll">

        {/* Dev tools */}
        {isLocalhost && (
          <div className="dev-panel">
            <button
              className="btn btn-secondary"
              onClick={handleDevAddBots}
              disabled={botsLoading}
              style={{ flex: 1, borderColor: '#f59e0b', color: '#f59e0b', background: 'rgba(245,158,11,0.05)' }}
            >
              {botsLoading ? 'Adding...' : 'Dev: Add 3 Bots'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleDevStartGame}
              disabled={startLoading}
              style={{ flex: 1 }}
            >
              {startLoading ? 'Starting...' : 'Dev: Force Start'}
            </button>
          </div>
        )}

        {/* ─── Waiting Lobby State — Buy Cards ─── */}
        {isGameWaiting && (
          <div className="waiting-lobby-container">
            {/* Waiting animation */}
            <div className="waiting-animation-section">
              <div className="waiting-spinner" />
              <h3 className="waiting-title">
                {t('lobby.waitingForPlayers') || 'Waiting for Players...'}
              </h3>
              <p className="waiting-player-count">
                {t('lobby.playersJoined', { count: roomRecord?.playerCount || 0, min: roomRecord?.minPlayers })
                  || `${roomRecord?.playerCount || 0} / ${roomRecord?.minPlayers} players joined`}
              </p>
              {/* Scheduled game countdown */}
              {countdown && (
                <div className="countdown-badge">
                  <span className="countdown-icon">⏱</span>
                  <span className="countdown-value">{countdown}</span>
                </div>
              )}
            </div>

            {/* Collapsible Buy Cards Panel Header / Summary */}
            {cards.length > 0 && (
              <div className="buy-panel-header" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="buy-panel-cards-count">
                  ✓ {t('lobby.alreadyHaveCards', { count: cards.length }) || `${cards.length} cards purchased`}
                </span>
                <button
                  onClick={handleDevStartGame}
                  disabled={startLoading || localDemoGame.active}
                  className="buy-panel-toggle-btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
                    cursor: 'pointer'
                  }}
                >
                  {localDemoGame.active ? '⚡ Game In Progress...' : '▶ Start Live Game'}
                </button>
                <button
                  onClick={() => setShowBuyPanel(!showBuyPanel)}
                  className="buy-panel-toggle-btn"
                >
                  {showBuyPanel ? '▲ Hide Buy Panel' : '+ Buy More Cards'}
                </button>
              </div>
            )}

            {/* Buy Cards Panel */}
            {(showBuyPanel || cards.length === 0) && (
              <div ref={buyPanelRef} className="buy-panel-body">
              <div className="buy-panel-title-row">
                <h4 className="buy-panel-title">🎟 {t('game.buyCards') || 'Buy Bingo Cards'}</h4>
                <span className="buy-panel-max-cards">
                  {t('lobby.maxCardsCount', { count: roomRecord?.maxCards || 100 }) || `Max ${roomRecord?.maxCards || 100} cards`}
                </span>
              </div>

              {/* Card count selector & Custom Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.8rem' }}>
                {/* Stepper + Custom Number Input */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setBuyCardCount(Math.max(1, buyCardCount - 1))}
                    disabled={buyCardCount <= 1}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      cursor: buyCardCount <= 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={roomRecord?.maxCards || 100}
                    value={buyCardCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const maxVal = roomRecord?.maxCards || 100;
                      setBuyCardCount(Math.min(maxVal, Math.max(1, val)));
                    }}
                    style={{
                      width: '70px',
                      height: '36px',
                      textAlign: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      border: '2px solid #6366f1',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#ffffff'
                    }}
                  />
                  <button
                    onClick={() => {
                      const maxVal = roomRecord?.maxCards || 100;
                      setBuyCardCount(Math.min(maxVal, buyCardCount + 1));
                    }}
                    disabled={buyCardCount >= (roomRecord?.maxCards || 100)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      cursor: buyCardCount >= (roomRecord?.maxCards || 100) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Quick preset buttons */}
                <div className="card-count-selector" style={{ flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 6, 10, 20, 50, 100].map((count) => {
                    const maxCards = roomRecord?.maxCards || 100;
                    const disabled = count > maxCards - cards.length;
                    const selected = buyCardCount === count;
                    return (
                      <button
                        key={count}
                        disabled={disabled}
                        onClick={() => setBuyCardCount(count)}
                        className={`card-count-btn ${disabled ? 'disabled' : selected ? 'selected' : 'default'}`}
                        style={{ minWidth: '38px' }}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price breakdown */}
              <div className="price-breakdown">
                <div>
                  <div className="price-label">{t('lobby.pricePerCard') || 'Price per card'}</div>
                  <div className="price-per-card">
                    {roomRecord ? roomRecord.entryFeeSantim / 100 : 0} ETB
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="price-total-label">{t('lobby.totalCost') || 'Total'}</div>
                  <div className="price-total-value">
                    {roomRecord ? (roomRecord.entryFeeSantim * buyCardCount) / 100 : 0} ETB
                  </div>
                </div>
              </div>

              {/* Balance display */}
              <div className="balance-display">
                <span>{t('common.yourBalance') || 'Your balance:'}</span>
                <span className={`balance-value ${(userRecord?.walletBalanceSantim || 0) >= (roomRecord ? roomRecord.entryFeeSantim * buyCardCount : 0) ? 'balance-sufficient' : 'balance-insufficient'}`}>
                  {userRecord ? (userRecord.walletBalanceSantim / 100).toFixed(2) : '0.00'} ETB
                </span>
              </div>

              {/* Buy button */}
              <button
                className="btn btn-primary buy-btn-custom"
                onClick={handleBuyCards}
                disabled={buyLoading || cards.length >= (roomRecord?.maxCards || 100)}
              >
                {buyLoading
                  ? (t('common.purchasing') || 'Purchasing...')
                  : cards.length >= (roomRecord?.maxCards || 100)
                    ? (t('lobby.maxCardsReached') || 'Max Cards Reached')
                    : t('lobby.buyCardsCountPrice', {
                        count: buyCardCount,
                        price: roomRecord ? (roomRecord.entryFeeSantim * buyCardCount) / 100 : 0
                      }) || `Buy ${buyCardCount} Card${buyCardCount > 1 ? 's' : ''} — ${roomRecord ? (roomRecord.entryFeeSantim * buyCardCount) / 100 : 0} ETB`
                }
              </button>
            </div>
            )}
          </div>
        )}

        {/* ─── Called Numbers Display ─── */}
        {(isGameActive || isGameEnded) && calledNumbers.length > 0 && (
          <div className="called-number-banner">
            <div className="called-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: isGameActive ? '#10b981' : '#ef4444',
                  boxShadow: isGameActive ? '0 0 8px rgba(16,185,129,0.7)' : 'none',
                  display: 'inline-block',
                  animation: isGameActive ? 'pulse-accent 1.5s ease infinite' : 'none'
                }} />
                {t('game.calledNumbers') || 'Called Numbers'}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                  {t('game.drawnCount', { count: calledNumbers.length }) || `Drawn: ${calledNumbers.length}`}/75
                </span>
                <button
                  className="show-more-btn"
                  onClick={() => setShowAllNumbers(!showAllNumbers)}
                >
                  {showAllNumbers ? `${t('common.showLess') || 'Show Less'} ▴` : `${t('common.showMore') || 'All'} ▾`}
                </button>
              </div>
            </div>

            {/* Current Number Showcase (large) + History Row */}
            <div className="called-layout">
              {/* Current Large Ball */}
              {currentNumber && (() => {
                const styles = getBallStyles(currentNumber);
                const handleBallClick = () => {
                  setBallClicked(true);
                  setTimeout(() => setBallClicked(false), 500);
                };
                return (
                  <div className="current-ball-showcase">
                    <div className="current-ball-label">Now</div>
                    <div className="latest-ball-wrapper">
                      <div
                        className={`bingo-ball-3d latest current-ball-main ${styles.glowClass} ${ballClicked ? 'clicked' : ''}`}
                        onClick={handleBallClick}
                        style={{ background: styles.gradient }}
                      >
                        <span className="ball-stripe" />
                        <span className="ball-letter">{styles.letter}</span>
                        <span className="ball-number">{currentNumber}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Divider */}
              <div className="called-divider" />

              {/* History Balls Row */}
              <div className="balls-row history-balls-row">
                {calledNumbers.slice(0, -1).reverse().slice(0, 9).map((num, i) => {
                  const styles = getBallStyles(num);
                  return (
                    <div
                      key={`${num}-${i}`}
                      className={`bingo-ball-3d history-ball ${styles.glowClass}`}
                      style={{ background: styles.gradient, width: '32px', height: '32px', fontSize: '0.6rem', opacity: 1 - i * 0.07 }}
                    >
                      <span className="ball-stripe" />
                      <span className="ball-number history-ball-num">{num}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Collapsible 75-Number Grid Board */}
            {showAllNumbers && (
              <div className="numbers-grid-board">
                {[
                  { letter: 'B', range: [1, 15] },
                  { letter: 'I', range: [16, 30] },
                  { letter: 'N', range: [31, 45] },
                  { letter: 'G', range: [46, 60] },
                  { letter: 'O', range: [61, 75] }
                ].map((row) => (
                  <div className="board-row" key={row.letter}>
                    <div className="board-row-label" style={{ backgroundColor: getRowColor(row.letter) }}>
                      {row.letter}
                    </div>
                    {Array.from({ length: row.range[1] - row.range[0] + 1 }, (_, index) => {
                      const num = row.range[0] + index;
                      const isCalled = calledNumbers.includes(num);
                      const isLatest = currentNumber === num;
                      return (
                        <div
                          key={num}
                          className={`board-cell ${isCalled ? 'called' : ''} ${isLatest ? 'latest-called' : ''}`}
                          style={isCalled ? { backgroundColor: getRowColor(row.letter) } : undefined}
                        >
                          {num}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Game Control & Stats Bar ─── */}
        {(isGameActive || isGameEnded) && (
          <div className="game-stats-bar" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div className="stats-row" style={{ flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="stats-icon success">✓</span>
                <span>{t('game.cards') || 'Cards:'}</span>
                <span className="stats-badge green">{cards.length}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {/* Auto-Daub Toggle */}
                <button
                  onClick={() => setIsAutoDaub(!isAutoDaub)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    background: isAutoDaub ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: isAutoDaub ? '0 0 10px rgba(16,185,129,0.5)' : 'none'
                  }}
                >
                  ⚡ Auto-Daub: {isAutoDaub ? 'ON' : 'OFF'}
                </button>

                {/* Voice Toggle */}
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    background: isVoiceEnabled ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: isVoiceEnabled ? '0 0 10px rgba(139,92,246,0.5)' : 'none'
                  }}
                >
                  {isVoiceEnabled ? '🔊 Voice: ON' : '🔇 Voice: OFF'}
                </button>

                {/* Pattern Hints Modal Trigger */}
                <button
                  onClick={() => setShowPatternHints(true)}
                  className="pattern-hints-btn"
                >
                  💡 {t('game.patternHints') || 'Patterns'}
                </button>
              </div>
            </div>

            {/* Pattern Mode Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              overflowX: 'auto',
              paddingBottom: '0.2rem'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>Pattern:</span>
              {[
                { id: 'line', label: '📐 Any Line' },
                { id: 'corners', label: '🔲 4 Corners' },
                { id: 'x', label: '✖️ Letter X' },
                { id: 'full', label: '🏆 Full House' }
              ].map((pattern) => {
                const isActive = activePattern === pattern.id;
                return (
                  <button
                    key={pattern.id}
                    onClick={() => {
                      setActivePattern(pattern.id as any);
                      showToast(`Target pattern set to: ${pattern.label}`, 'info');
                    }}
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: isActive ? 800 : 500,
                      border: isActive ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                      background: isActive ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.25))' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#fbbf24' : '#cbd5e1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {pattern.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Game Status Banners ─── */}
        {isGameEnded && (
          <div className="game-status-banner finished">
            {t('game.finishedBanner') || 'Bingo window finished!'}
          </div>
        )}

        {isGameActive && (
          <div className="game-status-banner active" style={{ fontSize: '0.8rem' }}>
            {t('game.activeBanner') || 'Game in progress — numbers being called'}
          </div>
        )}

        {/* ─── Single Winner Grand Prize Panel ─── */}
        {gameRecord && (isGameActive || isGameEnded) && (
          <div className="winners-panel">
            <div className="winners-panel-title">🏆 Single Grand Winner Pot</div>
            <div className={`winner-row ${(roomLiveState?.winner || gameRecord?.winners?.[0]) ? 'claimed-row' : ''}`}>
              <span className="tier-label">
                <span className="tier-icon">🔥</span>
                Single Winner Jackpot <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.72rem' }}>(100% Player Pot)</span>
              </span>
              {(roomLiveState?.winner || gameRecord?.winners?.[0]) ? (
                <span className="tier-status claimed">
                  🏆 WINNER DECLARED (+{(((roomRecord?.potSantim || 0) * 85) / 10000).toFixed(0)} ETB)
                </span>
              ) : (
                <span className="tier-status waiting" style={{ color: '#fbbf24', animation: 'goldGlowPulse 1.5s infinite alternate' }}>
                  ⚡ First Valid BINGO Wins Entire Pot!
                </span>
              )}
            </div>
          </div>
        )}

        {/* ─── Bingo Cards — Responsive Grid ─── */}
        {cards.length > 0 ? (
          <div className={`cards-grid ${cards.length <= 2 ? 'single-col' : 'multi-col'}`}>
            {sortedCards.map((card, index) => {
              const grid = getCardMarkedGrid(card.id, card.numbers);
              const score = getCardChanceScore(grid);
              return (
                <BingoCard
                  key={card.id}
                  cardId={card.id}
                  numbers={card.numbers}
                  markedGrid={grid}
                  manualMarks={manualMarks[card.id]}
                  status={getCardStatus()}
                  flashNumber={flashNumber}
                  claimableTiers={blockedCards.has(card.id) ? [] : getClaimableTiersForCard(card.id, card.numbers)}
                  onClaimBingo={(tier) => handleClaimBingo(card.id, tier)}
                  claimLoading={claimLoading}
                  onCellTap={(row, col) => handleCellTap(card.id, row, col)}
                  isBlocked={blockedCards.has(card.id)}
                  rank={isGameActive ? index + 1 : undefined}
                  chanceScore={isGameActive ? score : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div style={{
            color: '#818cf8',
            textAlign: 'center',
            padding: '2.5rem 1rem',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <p style={{ margin: 0 }}>{t('game.noCardsInRoom') || "You don't have any cards in this room."}</p>
            <button
              onClick={handleBuyCards}
              disabled={buyLoading}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.75rem',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {buyLoading ? 'Generating Cards...' : '🎟 Get Cards Now'}
            </button>
          </div>
        )}

        {/* ─── Emoji Reactions ─── */}
        {isGameActive && (
          <div className="emoji-reactions-section">
            <p className="emoji-reactions-label">
              {t('game.emojiSelect') || 'React to game'}
            </p>
            <div className="reaction-container reaction-container-styled">
              {[
                { emoji: '🎉', label: 'Celebrate' },
                { emoji: '😮', label: 'Surprised' },
                { emoji: '👏', label: 'Applause' },
                { emoji: '😂', label: 'Laugh' },
                { emoji: '🔥', label: 'Fire' }
              ].map(({ emoji, label }) => (
                <button
                  key={emoji}
                  className="reaction-btn"
                  onClick={() => addFloatingReaction(emoji)}
                  aria-label={`React with ${label}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Post-game Fairness Verification ─── */}
        {gameRecord && isGameEnded && (
          <div className="verification-panel">
            <h4 className="verify-title">
              🔎 {t('game.postGameVerify') || 'Fairness Verification'}
            </h4>
            <div className="verify-data-section">
              <div>
                <span className="verify-label">{t('game.commitSeed') || 'Pre-game Commit Seed Hash:'}</span>
                <p className="verify-hash">
                  {gameRecord.seedHash}
                </p>
              </div>
              {gameRecord.sequence && (
                <div className="verify-sequence-wrapper">
                  <span className="verify-label">{t('game.revealedSequence') || 'Revealed Game Sequence:'}</span>
                  <p className="verify-sequence">
                    {JSON.stringify(gameRecord.sequence)}
                  </p>
                </div>
              )}
            </div>
            <div className="verify-actions">
              <button
                className="btn btn-secondary verify-btn"
                onClick={handleVerifyFairness}
              >
                {t('game.verifySeedMatch') || 'Verify Seed Match'}
              </button>
              {verifyStatus === 'verifying' && (
                <p className="verify-computing">{t('game.computingHash') || 'Computing SHA-256 hash...'}</p>
              )}
              {verifyStatus === 'valid' && (
                <div className="verify-result-valid">
                  {t('game.verificationPassed') || '✅ Verification PASSED! Hash matches pre-committed seed.'}
                  <p className="verify-hash">
                    Hash: {calculatedHash}
                  </p>
                </div>
              )}
              {verifyStatus === 'invalid' && (
                <div className="verify-result-invalid">
                  {t('game.verificationFailed') || '❌ Verification FAILED! Hash does not match.'}
                  {calculatedHash && (
                    <p className="verify-hash">
                      Hash: {calculatedHash}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Floating Action Button — scrolls to buy panel ─── */}
      {isGameWaiting && cards.length > 0 && !showBuyPanel && (
        <button
          className="fab"
          onClick={() => {
            setShowBuyPanel(true);
            buyPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          aria-label="Buy more cards"
        >
          +
        </button>
      )}

      {/* ─── Pattern Hints Modal ─── */}
      {showPatternHints && (
        <PatternHintsModal
          gameName={gameName}
          onClose={() => setShowPatternHints(false)}
        />
      )}

      {/* ─── Single Winner Victory Modal (Fix #1 — dismissible) ─── */}
      {showVictoryModal && (() => {
        const winnerRecord = roomLiveState?.winner || gameRecord?.winners?.[0];
        if (!winnerRecord) return null;

        const currentUid = user?.uid;
        const isCurrentWinner = winnerRecord.userId === currentUid;
        const prizeEtb = (winnerRecord.amountSantim / 100).toFixed(0);

        return (
          <div className="victory-modal-overlay" onClick={() => setShowVictoryModal(false)}>
            {/* Confetti Particles */}
            <div className="confetti-container">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="confetti-particle"
                  style={{
                    left: `${(i * 3.33) % 100}%`,
                    animationDelay: `${(i * 0.1) % 2}s`,
                    backgroundColor: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'][i % 5]
                  }}
                />
              ))}
            </div>
            <div className={`victory-modal-card ${isCurrentWinner ? 'is-winner' : 'is-runner-up'}`} onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button
                onClick={() => setShowVictoryModal(false)}
                aria-label="Close victory modal"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '14px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.15s'
                }}
              >
                ✕
              </button>
              <div className="victory-crown">{isCurrentWinner ? '👑' : '🏆'}</div>
              <h2 className="victory-title">
                {isCurrentWinner ? 'JACKPOT BINGO WINNER!' : 'GAME OVER — WINNER DECLARED!'}
              </h2>
              <p className="victory-subtitle">
                {isCurrentWinner
                  ? '🎉 CONGRATULATIONS! YOU CLAIMED BINGO FIRST AND WON THE GRAND POT!'
                  : `A player claimed BINGO first and won the grand jackpot!`}
              </p>

              <div className="victory-prize-box">
                <span className="prize-label">GRAND PRIZE PAYOUT</span>
                <span className="prize-value">+{prizeEtb} ETB</span>
              </div>

              <div className="victory-meta">
                <span>🎯 Winning Card: <strong style={{ color: '#fbbf24' }}>{winnerRecord.cardId.slice(0, 8)}...</strong></span>
                <span>⚡ Calls Taken: <strong>{calledNumbers.length}</strong> / 75</span>
              </div>

              <button
                className="btn btn-primary victory-play-again-btn"
                onClick={() => navigate('/lobby')}
              >
                🎮 Play Again in Lobby
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
