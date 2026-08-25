import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { api } from '../api';
import { 
  RoomStatus, 
  RoomTier, 
  GameRecord, 
  RoomRecord, 
  generateBingoCard,
  BingoPattern,
  getPatternById,
  assignRandomPatternForTier,
  verifyPatternMatch,
  formatUserDisplayId
} from '@bingo/shared';

import GameHeader from '../components/GameHeader';
import BingoCard from '../components/BingoCard';
import PatternHintsModal from '../components/PatternHintsModal';
import { Target, Zap, Volume2, VolumeX, Eye, Trophy, Sparkles, RotateCw, Boxes, Layers, Lock, Crown, Gamepad2, CheckCircle2, XCircle, Search } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

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
  const [isAutoDaub, setIsAutoDaub] = useState(false); // Manual player daubing by default
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const activeGamePattern: BingoPattern = useMemo(() => {
    if (roomRecord?.patternId) {
      const found = getPatternById(roomRecord.patternId);
      if (found) return found;
    }
    return assignRandomPatternForTier(roomRecord?.tier || 'bronze');
  }, [roomRecord?.patternId, roomRecord?.tier]);

  const prevNumberRef = useRef<number | null>(null);
  const buyPanelRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const showToast = useCallback((text: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const [localDemoGame, setLocalDemoGame] = useState<{
    active: boolean;
    calledNumbers: number[];
  }>({ active: false, calledNumbers: [] });

  const handleDevStartGame = async () => {
    if (!roomId) return;
    setStartLoading(true);
    // Guarantee player has at least 2 cards before starting
    if (cards.length === 0) {
      setCards([
        { id: `card-auto-${Date.now()}-1`, numbers: generateBingoCard() },
        { id: `card-auto-${Date.now()}-2`, numbers: generateBingoCard() },
      ]);
    }
    try {
      await api.startGame(roomId);
    } catch (err: any) {
      console.warn('startGame API notice (initiating browser game loop):', err);
    }
    // Always start local game loop so solo testers can play immediately
    setLocalDemoGame({ active: true, calledNumbers: [] });
    showToast('🎮 Game Started! Calling numbers...', 'success');
    setStartLoading(false);
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
    if (blockedCards.has(cardId)) {
      showToast('🚫 This card is blocked from claiming due to a previous miscall.', 'error');
      return;
    }
    setClaimLoading(true);

    // Ensure winTier matches backend expectations ('line' | 'corners' | 'full_house')
    const validTier = (winTier === 'single-jackpot' || !winTier) ? 'line' : winTier;

    // Handle local demo game victory check
    if (localDemoGame.active) {
      const card = cards.find(c => c.id === cardId);
      const grid = getCardMarkedGrid(cardId, card?.numbers || []);
      const completeness = checkCardCompleteness(grid);
      const isWin = completeness.line || completeness.corners || completeness.fullHouse;

      if (!isWin) {
        setBlockedCards(prev => new Set(prev).add(cardId));
        soundFX.playMiscallBuzzer();
        showToast('🚫 False Bingo claim! Card has been blocked for this round.', 'error');
        setClaimLoading(false);
        return;
      }

      setLocalDemoGame(prev => ({ ...prev, active: false }));
      soundFX.playBingoVictory();
      setShowVictoryModal(true);
      showToast('🎉 CONGRATULATIONS! You won BINGO!', 'success');
      setClaimLoading(false);
      return;
    }

    try {
      const res = await api.claimBingo(roomId, cardId, validTier);
      if (res?.success) {
        soundFX.playBingoVictory();
        setShowVictoryModal(true);
        showToast(`🎉 CONGRATULATIONS! You won BINGO!`, 'success');
      } else if (res?.miscalled) {
        setBlockedCards(prev => new Set(prev).add(cardId));
        soundFX.playMiscallBuzzer();
        showToast(res?.error || '🚫 False Bingo claim! Card is blocked for this round.', 'error');
      }
    } catch (err: any) {
      console.error('Claim error:', err);
      const errorMsg = err?.message || err?.error || '';

      if (errorMsg.includes('Invalid BINGO') || errorMsg.includes('False Bingo') || errorMsg.includes('miscall') || errorMsg.includes('blocked') || errorMsg.includes('failed-precondition')) {
        setBlockedCards(prev => new Set(prev).add(cardId));
        soundFX.playMiscallBuzzer();
        showToast('🚫 Miscalled Bingo! This card has been blocked for the rest of this round.', 'error');
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
        if (roomId?.includes('demo') || !roomRecord) {
          setRoomRecord((prev) => prev || ({
            id: roomId || 'room-bronze-demo',
            tier: (roomId?.includes('gold') ? RoomTier.GOLD : roomId?.includes('silver') ? RoomTier.SILVER : RoomTier.BRONZE) as any,
            status: RoomStatus.WAITING,
            mode: 'auto',
            type: 'open',
            entryFeeSantim: roomId?.includes('gold') ? 10000 : roomId?.includes('silver') ? 5000 : 1000,
            potSantim: roomId?.includes('gold') ? 50000 : roomId?.includes('silver') ? 25000 : 5000,
            minPlayers: 2,
            maxCards: 6,
            playerCount: 1,
            createdAt: Date.now(),
          } as any));
          setCards((prev) => {
            if (prev.length > 0) return prev;
            return [
              { id: `card-demo-${Date.now()}-1`, numbers: generateBingoCard() },
              { id: `card-demo-${Date.now()}-2`, numbers: generateBingoCard() }
            ];
          });
        }
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

  // Listen for miscall alerts from socket
  useEffect(() => {
    const miscall = (roomLiveState as any)?.lastMiscall;
    if (miscall && miscall.cardId) {
      if (miscall.userId === user?.uid) {
        setBlockedCards(prev => new Set(prev).add(miscall.cardId));
        soundFX.playMiscallBuzzer();
        showToast('🚫 False Bingo claim! Card is blocked for this round.', 'error');
      } else {
        showToast('⚠️ Notice: Another player miscalled Bingo.', 'info');
      }
    }
  }, [roomLiveState, user?.uid, showToast]);

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

    // Audio chime effect
    soundFX.playBallDrop();

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

    // Construct grid from called numbers (auto mode) or manual marks (manual mode)
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
    } else {
      const userMarks = manualMarks[cardId];
      if (userMarks) {
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (userMarks[r]?.[c]) {
              grid[r][c] = true;
            }
          }
        }
      }
    }
    return grid;
  }, [roomLiveState, calledSet, isAutoDaub, manualMarks, user?.uid]);

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
    
    // 1. Verify against the active room pattern rule (Crazy rotations & anywhere blocks handled automatically)
    const isSpecialtyMatch = verifyPatternMatch(grid, activeGamePattern);
    if (isSpecialtyMatch) return ['line'];

    // 2. Also check standard line completeness as safety fallback
    const winCheck = checkCardCompleteness(grid);
    if (winCheck.line || winCheck.corners || winCheck.fullHouse) return ['line'];

    return [];
  }, [isGameActive, getCardMarkedGrid, activeGamePattern, checkCardCompleteness]);

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

        {/* ─── Waiting Lobby State — Buy Cards ─── */}
        {isGameWaiting && (
          <div className="waiting-lobby-container">
            {/* Waiting animation & Action Center */}
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

              {/* Instant Start & Bot Controls */}
              <div className="waiting-start-action-box">
                <button
                  onClick={handleDevStartGame}
                  disabled={startLoading}
                  className="btn-ui btn-ui-gold btn-ui-lg waiting-start-btn"
                >
                  {startLoading ? '⏳ Starting...' : '🎮 Start Game Now'}
                </button>
                <button
                  onClick={handleDevAddBots}
                  disabled={botsLoading}
                  className="btn-ui btn-ui-secondary btn-ui-sm waiting-bot-btn"
                >
                  {botsLoading ? 'Adding...' : '🤖 Add 3 Bot Players'}
                </button>
              </div>
            </div>

            {/* Collapsible Buy Cards Panel Header / Summary */}
            {cards.length > 0 && (
              <div className="buy-panel-header">
                <span className="buy-panel-cards-count">
                  ✓ {t('lobby.alreadyHaveCards', { count: cards.length }) || `${cards.length} cards purchased`}
                </span>
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
                      border: '1px solid var(--card-border)',
                      background: 'var(--surface-raised)',
                      color: 'var(--text-light)',
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
                      border: '2px solid var(--primary-amber)',
                      background: 'var(--input-bg)',
                      color: 'var(--input-text)'
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
                      border: '1px solid var(--card-border)',
                      background: 'var(--surface-raised)',
                      color: 'var(--text-light)',
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

        {/* ─── Called Numbers Showcase ─── */}
        {(isGameActive || isGameEnded) && calledNumbers.length > 0 && (
          <div className="called-number-banner">
            <div className="called-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="live-pulse-dot" />
                <span style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-light)', fontFamily: 'var(--font-heading)' }}>
                  CALLED NUMBERS
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ({calledNumbers.length}/75)
                </span>
              </div>
              <button
                className="show-more-btn"
                onClick={() => setShowAllNumbers(!showAllNumbers)}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {showAllNumbers ? 'Hide Board ▴' : 'View Board ▾'}
              </button>
            </div>

            {/* Current Number Showcase + History Rack */}
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
                );
              })()}

              {/* History Balls Rack */}
              <div className="balls-row history-balls-row">
                {calledNumbers.slice(0, -1).reverse().slice(0, 6).map((num, i) => {
                  const styles = getBallStyles(num);
                  return (
                    <div
                      key={`${num}-${i}`}
                      className={`bingo-ball-3d history-ball ${styles.glowClass}`}
                      style={{ background: styles.gradient }}
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

        {/* ─── Compact Unified Game Controls & Winning Rule Ribbon ─── */}
        {isGameActive && (
          <div className="game-active-rule-strip" style={{ margin: '0.4rem 0', padding: '0.35rem 0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '0.4rem' }}>
            <div className="active-rule-left" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, overflow: 'hidden' }}>
              <Target size={15} style={{ color: 'var(--primary-amber)', flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                <span style={{ color: 'var(--primary-amber)' }}>{activeGamePattern.name}</span>
              </span>
              <button 
                className="btn-pattern-preview" 
                onClick={() => setShowPatternHints(true)}
                style={{ padding: '2px 6px', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
              >
                <Eye size={12} />
                <span>Rule</span>
              </button>
            </div>

            {/* Quick action icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <button
                onClick={() => setIsAutoDaub(!isAutoDaub)}
                title="Toggle Auto-Daub"
                style={{
                  padding: '3px 7px',
                  borderRadius: '12px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  border: 'none',
                  background: isAutoDaub ? 'linear-gradient(135deg, #00C853, #009638)' : 'rgba(100,116,139,0.2)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Zap size={11} />
                <span>{isAutoDaub ? 'Auto' : 'Manual'}</span>
              </button>

              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                title="Toggle Caller Voice"
                style={{
                  padding: '3px 7px',
                  borderRadius: '12px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  border: 'none',
                  background: isVoiceEnabled ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(100,116,139,0.2)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                {isVoiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              </button>

              <span className="stats-badge green" style={{ padding: '2px 6px', fontSize: '0.68rem', fontWeight: 800, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Layers size={11} />
                <span>{cards.length} {cards.length === 1 ? 'Card' : 'Cards'}</span>
              </span>
            </div>
          </div>
        )}

        {/* ─── Pre-Game Rule Announcement ─── */}
        {!isGameActive && !isGameEnded && (
          <div className="pregame-rule-card">
            <div className="pregame-rule-header">
              <div className="pregame-rule-badge">
                <Target size={14} style={{ marginRight: '4px' }} />
                <span>GAME WINNING PATTERN</span>
              </div>
              <span className="pregame-rule-lock">
                <Lock size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                RULE LOCKED BEFORE 1ST BALL
              </span>
            </div>

            <div className="pregame-rule-content">
              {/* 5x5 Mini Illuminated Pattern Matrix */}
              <div className="pregame-matrix-container">
                <div className="pregame-matrix-grid">
                  {activeGamePattern.grid.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      const isFree = rIdx === 2 && cIdx === 2;
                      const isActive = cell;
                      return (
                        <div
                          key={`prm-${rIdx}-${cIdx}`}
                          className={`pregame-matrix-cell ${isActive ? 'active' : ''} ${isFree ? 'free' : ''}`}
                        >
                          {isFree && !isActive ? '★' : ''}
                        </div>
                      );
                    })
                  )}
                </div>
                <span className="pregame-matrix-label">Target Pattern</span>
              </div>

              {/* Pattern Info & Instructions */}
              <div className="pregame-rule-info">
                <div className="pregame-pattern-name" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Trophy size={18} style={{ color: 'var(--primary-amber)', flexShrink: 0 }} />
                  <span>{activeGamePattern.name}</span>
                </div>

                <p className="pregame-pattern-desc">
                  {activeGamePattern.description}
                </p>

                <div className="pregame-rule-tags">
                  {activeGamePattern.isCrazy && (
                    <span className="pregame-tag crazy" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <RotateCw size={11} /> Any 90° Rotation (0°, 90°, 180°, 270°)
                    </span>
                  )}
                  {activeGamePattern.isAnywhereBlock && (
                    <span className="pregame-tag anywhere" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Boxes size={11} /> Anywhere Block (Any Valid Placement)
                    </span>
                  )}
                  {!activeGamePattern.isCrazy && !activeGamePattern.isAnywhereBlock && (
                    <span className="pregame-tag standard" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Sparkles size={11} /> Fixed Winning Matrix
                    </span>
                  )}
                </div>

                <div className="pregame-user-id-chip">
                  <span>Player User ID:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{user?.uid ? `SB-${user.uid.slice(-5).toUpperCase()}` : 'SB-00000'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Game Status Banners ─── */}
        {isGameEnded && (
          <div className="game-status-banner finished" style={{ margin: '0.4rem 0', padding: '0.4rem' }}>
            {t('game.finishedBanner') || 'Bingo round finished! Winner declared.'}
          </div>
        )}

        {/* ─── Bingo Cards — 2 Cards Per Row Horizontal Grid ─── */}
        {cards.length > 0 ? (
          <div className={`cards-grid ${cards.length === 1 ? 'single-card' : 'two-col-grid'}`}>
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
            <h4 className="verify-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)' }}>
              <Search size={16} style={{ color: 'var(--primary-amber)' }} />
              <span>{t('game.postGameVerify') || 'Fairness Verification'}</span>
            </h4>
            <div className="verify-data-section">
              <div>
                <span className="verify-label">{t('game.commitSeed') || 'Pre-game Commit Seed Hash:'}</span>
                <p className="verify-hash" style={{ fontFamily: 'var(--font-mono)' }}>
                  {gameRecord.seedHash}
                </p>
              </div>
              {gameRecord.sequence && (
                <div className="verify-sequence-wrapper">
                  <span className="verify-label">{t('game.revealedSequence') || 'Revealed Game Sequence:'}</span>
                  <p className="verify-sequence" style={{ fontFamily: 'var(--font-mono)' }}>
                    {JSON.stringify(gameRecord.sequence)}
                  </p>
                </div>
              )}
            </div>
            <div className="verify-actions">
              <button
                className="btn btn-secondary verify-btn"
                onClick={handleVerifyFairness}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Search size={15} />
                <span>{t('game.verifySeedMatch') || 'Verify Seed Match'}</span>
              </button>
              {verifyStatus === 'verifying' && (
                <p className="verify-computing">{t('game.computingHash') || 'Computing SHA-256 hash...'}</p>
              )}
              {verifyStatus === 'valid' && (
                <div className="verify-result-valid" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                    <CheckCircle2 size={16} />
                    <span>{t('game.verificationPassed') || 'Verification PASSED! Hash matches pre-committed seed.'}</span>
                  </div>
                  <p className="verify-hash" style={{ fontFamily: 'var(--font-mono)' }}>
                    Hash: {calculatedHash}
                  </p>
                </div>
              )}
              {verifyStatus === 'invalid' && (
                <div className="verify-result-invalid" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                    <XCircle size={16} />
                    <span>{t('game.verificationFailed') || 'Verification FAILED! Hash does not match.'}</span>
                  </div>
                  {calculatedHash && (
                    <p className="verify-hash" style={{ fontFamily: 'var(--font-mono)' }}>
                      Hash: {calculatedHash}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Floating Action Button ─── */}
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

      {/* ─── Single Winner Victory Modal ─── */}
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
                    backgroundColor: ['#E5A100', '#00C853', '#6366f1', '#ec4899', '#3b82f6'][i % 5]
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

              <div className="victory-crown" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#E5A100' }}>
                {isCurrentWinner ? <Crown size={48} /> : <Trophy size={48} />}
              </div>

              <h2 className="victory-title" style={{ fontFamily: 'var(--font-heading)' }}>
                {isCurrentWinner ? 'JACKPOT BINGO WINNER!' : 'GAME OVER — WINNER DECLARED!'}
              </h2>
              <p className="victory-subtitle">
                {isCurrentWinner
                  ? 'CONGRATULATIONS! YOU CLAIMED BINGO FIRST AND WON THE GRAND POT!'
                  : 'A player claimed BINGO first and won the grand jackpot!'}
              </p>

              <div className="victory-prize-box">
                <span className="prize-label">GRAND PRIZE PAYOUT</span>
                <span className="prize-value" style={{ fontFamily: 'var(--font-mono)' }}>+{prizeEtb} ETB</span>
              </div>

              <div className="victory-meta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', background: 'rgba(0,0,0,0.3)', padding: '0.65rem', borderRadius: '10px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <span>Winner: <strong style={{ color: '#E5A100' }}>{winnerRecord.displayName || (isCurrentWinner ? user?.displayName : 'Player')} ({formatUserDisplayId(winnerRecord.userId)})</strong></span>
                <span>Rule: <strong style={{ color: '#60a5fa' }}>{winnerRecord.patternName || activeGamePattern.name}</strong></span>
                <span>Card ID: <strong style={{ color: '#a78bfa' }}>{winnerRecord.cardId.slice(0, 8)}…</strong></span>
                <span>Calls: <strong>{calledNumbers.length}</strong> / 75</span>
              </div>

              <button
                className="btn btn-primary victory-play-again-btn"
                onClick={() => navigate('/lobby')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Gamepad2 size={18} />
                <span>Play Again in Lobby</span>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
