import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { 
  RoomTier, 
  RoomStatus, 
  RoomRecord, 
  BingoCard, 
  WalletLedgerEntry, 
  WalletEntryType, 
  GameStatus, 
  GameRecord, 
  WinTier, 
  WinnerRecord 
} from '@bingo/shared';
import { generateUniqueCard } from './utils/card';
import { generateBingoSequence, computeSeedHash } from './utils/rng';
import { checkWinPattern, calculateTierPrizePools } from './utils/win';
import { checkRateLimit } from './utils/rateLimit';
import { SECURE_CALL_OPTIONS, SECURE_CALL_OPTIONS_LONG } from './utils/appCheck';

// Helper to determine stakes and rules per tier
function getTierConfig(tier: RoomTier): { entryFeeSantim: number; minPlayers: number } {
  switch (tier) {
    case RoomTier.BRONZE:
      return { entryFeeSantim: 1000, minPlayers: 2 }; // 10 ETB
    case RoomTier.SILVER:
      return { entryFeeSantim: 5000, minPlayers: 3 }; // 50 ETB
    case RoomTier.GOLD:
      return { entryFeeSantim: 10000, minPlayers: 5 }; // 100 ETB
    default:
      throw new HttpsError('invalid-argument', `Unknown room tier: ${tier}`);
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createRoom = onCall(SECURE_CALL_OPTIONS, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const role = auth.token.role;
  if (role !== 'operator' && role !== 'super-admin' && process.env.FUNCTIONS_EMULATOR !== 'true' && process.env.VITEST !== 'true') {
    throw new HttpsError('permission-denied', 'Only operators and super-admins can create rooms.');
  }

  const { tier, mode, type, scheduledAt } = request.data as {
    tier: RoomTier;
    mode: 'auto' | 'manual';
    type: 'open' | 'scheduled';
    scheduledAt?: number;
  };

  if (!tier || !mode || !type) {
    throw new HttpsError('invalid-argument', 'Missing required fields: tier, mode, type.');
  }

  const { entryFeeSantim, minPlayers } = getTierConfig(tier);

  const db = admin.firestore();
  const roomId = crypto.randomUUID();

  const newRoom: RoomRecord = {
    id: roomId,
    tier,
    entryFeeSantim,
    mode,
    type,
    scheduledAt: scheduledAt || null,
    minPlayers,
    maxCards: 6,
    status: RoomStatus.WAITING,
    playerCount: 0,
    potSantim: 0,
    createdAt: Date.now(),
  };

  await db.collection('rooms').doc(roomId).set(newRoom);

  const rtdb = admin.database();
  await rtdb.ref(`rooms/${roomId}`).set({
    state: RoomStatus.WAITING,
    currentNumber: null,
    calledNumbers: [],
    seedHash: '',
    nextCallAt: 0,
    players: {},
    reactions: {}
  });

  return { success: true, roomId };
});

export const buyCards = onCall(SECURE_CALL_OPTIONS, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const uid = auth.uid;

  // Rate limit: max 6 card purchases per user per minute (spec §4.4)
  const allowed = await checkRateLimit(uid, 'buyCards', 6, 60 * 1000);
  if (!allowed) {
    throw new HttpsError('resource-exhausted', 'Rate limit exceeded: max 6 card purchases per minute.');
  }

  const { roomId, cardCount } = request.data as {
    roomId: string;
    cardCount: number;
  };

  if (!roomId || !cardCount || cardCount < 1 || cardCount > 100) {
    throw new HttpsError('invalid-argument', 'Invalid purchase request (must be between 1 and 100 cards).');
  }

  const db = admin.firestore();
  const rtdb = admin.database();

  const roomRef = db.collection('rooms').doc(roomId);
  const userRef = db.collection('users').doc(uid);

  const result = await db.runTransaction(async (transaction) => {
    // === ALL READS FIRST ===
    const roomDoc = await transaction.get(roomRef);
    if (!roomDoc.exists) {
      throw new HttpsError('not-found', 'Room not found.');
    }

    const room = roomDoc.data() as RoomRecord;
    if (room.status !== RoomStatus.WAITING) {
      throw new HttpsError('failed-precondition', 'Cannot buy cards: game is not in waiting lobby.');
    }

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User record not found.');
    }

    const user = userDoc.data();
    const balance = user?.walletBalanceSantim || 0;
    const totalCost = room.entryFeeSantim * cardCount;

    if (balance < totalCost) {
      throw new HttpsError('failed-precondition', `Insufficient funds: required ${totalCost} santim, balance is ${balance} santim.`);
    }

    const existingCardsQueryRef = roomRef.collection('cards').where('userId', '==', uid);
    const existingCardsQuery = await transaction.get(existingCardsQueryRef);
    const currentCardCount = existingCardsQuery.size;

    if (currentCardCount + cardCount > room.maxCards) {
      throw new HttpsError('failed-precondition', `Purchase exceeds limit of ${room.maxCards} cards per player.`);
    }

    // Read all existing cards for fingerprint uniqueness
    const existingCardsRef = roomRef.collection('cards');
    const allExistingCards = await transaction.get(existingCardsRef);
    const existingFingerprints = new Set(allExistingCards.docs.map(doc => doc.data().fingerprint));

    // Generate cards (pure computation, no reads/writes)
    const newCards: BingoCard[] = [];
    for (let i = 0; i < cardCount; i++) {
      const card = generateUniqueCard(existingFingerprints);
      newCards.push(card);
      existingFingerprints.add(card.fingerprint);
    }

    // === ALL WRITES AFTER ===
    const newBalance = balance - totalCost;
    transaction.update(userRef, { walletBalanceSantim: newBalance });

    const ledgerId = crypto.randomUUID();
    const ledgerEntry: WalletLedgerEntry = {
      id: ledgerId,
      userId: uid,
      type: WalletEntryType.ENTRY_FEE,
      amountSantim: totalCost,
      balanceSantim: newBalance,
      createdAt: Date.now(),
    };
    transaction.set(db.collection('walletLedger').doc(ledgerId), ledgerEntry);

    for (const card of newCards) {
      transaction.set(roomRef.collection('cards').doc(card.id), {
        id: card.id,
        userId: uid,
        numbersJson: JSON.stringify(card.numbers),
        fingerprint: card.fingerprint,
        createdAt: Date.now(),
      });
    }

    const isNewPlayer = currentCardCount === 0;
    const nextPlayerCount = isNewPlayer ? room.playerCount + 1 : room.playerCount;
    const nextPot = room.potSantim + totalCost;

    transaction.update(roomRef, {
      playerCount: nextPlayerCount,
      potSantim: nextPot
    });

    return {
      success: true,
      newCards,
      isNewPlayer,
      displayName: user?.displayName || 'Player',
      potSantim: nextPot,
    };
  });

  const updates: Record<string, any> = {};
  for (const card of result.newCards) {
    const marked = Array.from({ length: 5 }, () => Array(5).fill(false));
    marked[2][2] = true;

    updates[`rooms/${roomId}/players/${uid}/cards/${card.id}`] = {
      numbers: card.numbers,
      marked: marked,
    };
  }

  updates[`rooms/${roomId}/players/${uid}/displayName`] = result.displayName;
  updates[`rooms/${roomId}/players/${uid}/connected`] = true;
  updates[`rooms/${roomId}/players/${uid}/lastSeen`] = Date.now();

  await rtdb.ref().update(updates);

  return { success: true, cards: result.newCards };
});

// Run live game loop and number calling
export const startGame = onCall(SECURE_CALL_OPTIONS_LONG, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { roomId } = request.data as { roomId: string };
  if (!roomId) {
    throw new HttpsError('invalid-argument', 'Missing roomId.');
  }

  const db = admin.firestore();
  const rtdb = admin.database();

  const roomRef = db.collection('rooms').doc(roomId);
  const roomSnap = await roomRef.get();

  if (!roomSnap.exists) {
    throw new HttpsError('not-found', 'Room not found.');
  }

  const room = roomSnap.data() as RoomRecord;
  if (room.status !== RoomStatus.WAITING) {
    throw new HttpsError('failed-precondition', 'Room is not in waiting status.');
  }

  if (room.playerCount < room.minPlayers) {
    throw new HttpsError('failed-precondition', `Not enough players. Minimum required: ${room.minPlayers}, present: ${room.playerCount}`);
  }

  // 1. Transition room status to active
  await roomRef.update({ status: RoomStatus.ACTIVE });
  await rtdb.ref(`rooms/${roomId}/state`).set(RoomStatus.ACTIVE);

  // 2. Generate and commit RNG sequence
  const sequence = generateBingoSequence();
  const seedHash = computeSeedHash(sequence);

  const gameId = roomId; // 1-to-1 game per room
  const newGame: GameRecord = {
    id: gameId,
    roomId,
    seedHash,
    sequence,
    calledNumbers: [],
    status: GameStatus.ACTIVE,
    lastProcessedIndex: -1,
    winners: [],
    createdAt: Date.now(),
  };

  await db.collection('games').doc(gameId).set(newGame);
  await rtdb.ref(`rooms/${roomId}/seedHash`).set(seedHash);

  // 3. Load all purchased cards for this room into memory
  const cardsSnap = await roomRef.collection('cards').get();
  const cards = cardsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: data.id,
      userId: data.userId,
      numbers: JSON.parse(data.numbersJson) as number[][],
      fingerprint: data.fingerprint,
    };
  });

  // 4. Calculate prize pool distributions (85% pot, house takes 15%)
  const playerPrizePool = Math.floor((room.potSantim * 85) / 100);
  const tierPrizePools = calculateTierPrizePools(playerPrizePool);



  const winners: WinnerRecord[] = [];
  const calledNumbers: number[] = [];
  const callingIntervalMs = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.VITEST === 'true' ? 3000 : 10000;

  // 5. Game Loop
  const botClaimTimes: Record<string, Record<string, number>> = {};
  await rtdb.ref(`rooms/${roomId}/claims`).set({});

  for (let step = 0; step < 75; step++) {
    const nextCall = sequence[step];
    calledNumbers.push(nextCall);

    // Update called list in RTDB and Firestore
    await rtdb.ref(`rooms/${roomId}`).update({
      currentNumber: nextCall,
      calledNumbers: calledNumbers,
      nextCallAt: Date.now() + callingIntervalMs,
    });

    await db.collection('games').doc(gameId).update({
      calledNumbers: calledNumbers,
      lastProcessedIndex: step,
    });

    // Update marked grids in RTDB for all players
    const rtdbUpdates: Record<string, any> = {};
    for (const card of cards) {
      for (let r = 0; r < 5; r++) {
        const c = card.numbers[r].indexOf(nextCall);
        if (c !== -1) {
          rtdbUpdates[`rooms/${roomId}/players/${card.userId}/cards/${card.id}/marked/${r}/${c}`] = true;
        }
      }
    }
    if (Object.keys(rtdbUpdates).length > 0) {
      await rtdb.ref().update(rtdbUpdates);
    }

    // Schedule bot claims for newly qualifying patterns
    for (const card of cards) {
      const isBot = card.userId.startsWith('mock-player-');
      if (!isBot) continue;

      const winCheck = checkWinPattern(card.numbers, calledNumbers);
      const isLineUnclaimed = !winners.some(w => w.winTier === WinTier.LINE);
      const isCornersUnclaimed = !winners.some(w => w.winTier === WinTier.CORNERS);
      const isFullHouseUnclaimed = !winners.some(w => w.winTier === WinTier.FULL_HOUSE);

      if (winCheck.line && isLineUnclaimed && (!botClaimTimes[card.id] || !botClaimTimes[card.id][WinTier.LINE])) {
        botClaimTimes[card.id] = {
          ...botClaimTimes[card.id],
          [WinTier.LINE]: Date.now() + Math.random() * 2000 + 1000 // 1-3s delay
        };
      }
      if (winCheck.corners && isCornersUnclaimed && (!botClaimTimes[card.id] || !botClaimTimes[card.id][WinTier.CORNERS])) {
        botClaimTimes[card.id] = {
          ...botClaimTimes[card.id],
          [WinTier.CORNERS]: Date.now() + Math.random() * 2000 + 1000
        };
      }
      if (winCheck.fullHouse && isFullHouseUnclaimed && (!botClaimTimes[card.id] || !botClaimTimes[card.id][WinTier.FULL_HOUSE])) {
        botClaimTimes[card.id] = {
          ...botClaimTimes[card.id],
          [WinTier.FULL_HOUSE]: Date.now() + Math.random() * 2000 + 1000
        };
      }
    }

    // Sleep in 100ms intervals, checking for human and bot claims
    const sleepIntervalMs = 100;
    const steps = Math.floor(callingIntervalMs / sleepIntervalMs);

    for (let s = 0; s < steps; s++) {
      // 1. Fetch latest claims from Firestore to sync local winners list (humans claim via cloud function)
      const gameSnap = await db.collection('games').doc(gameId).get();
      const latestGameData = gameSnap.data() as GameRecord;
      if (latestGameData && latestGameData.winners) {
        for (const w of latestGameData.winners) {
          if (!winners.some(x => x.cardId === w.cardId && x.winTier === w.winTier)) {
            winners.push(w);
          }
        }
      }

      // 2. Evaluate bot claim timers
      for (const card of cards) {
        const isBot = card.userId.startsWith('mock-player-');
        if (!isBot) continue;

        const tiers = [WinTier.LINE, WinTier.CORNERS, WinTier.FULL_HOUSE];
        for (const tier of tiers) {
          const claimTime = botClaimTimes[card.id]?.[tier];
          if (claimTime && Date.now() >= claimTime) {
            const isTierClaimed = winners.some(w => w.winTier === tier);
            if (!isTierClaimed) {
              const prizePool = tierPrizePools[tier];
              const botWinner: WinnerRecord = {
                userId: card.userId,
                cardId: card.id,
                winTier: tier,
                amountSantim: prizePool,
                creditedAt: Date.now()
              };

              // Register bot claim in a transaction
              await db.runTransaction(async (transaction) => {
                const innerGameSnap = await transaction.get(db.collection('games').doc(gameId));
                const innerGame = innerGameSnap.data() as GameRecord;
                if (!innerGame.winners.some(w => w.winTier === tier)) {
                  const updatedWinners = [...innerGame.winners, botWinner];
                  transaction.update(db.collection('games').doc(gameId), { winners: updatedWinners });
                  winners.push(botWinner);
                }
              });

              // Write to RTDB
              await rtdb.ref(`rooms/${roomId}/claims/${tier}`).set({
                userId: card.userId,
                cardId: card.id,
                timestamp: Date.now()
              });
            }
            delete botClaimTimes[card.id][tier];
          }
        }
      }

      // 3. Break immediately when the single winner is claimed
      if (winners.length >= 1) {
        break;
      }

      await sleep(sleepIntervalMs);
    }

    if (winners.length >= 1) {
      break;
    }
  }

  // 6. Conclude the game
  await roomRef.update({ status: RoomStatus.ENDED });
  await rtdb.ref(`rooms/${roomId}`).update({ 
    state: RoomStatus.ENDED,
    winner: winners[0] || null
  });

  // Record 15% House Cut in ledger if room had pot
  const houseCutSantim = room.potSantim - playerPrizePool;
  if (houseCutSantim > 0) {
    const houseLedgerId = crypto.randomUUID();
    await db.collection('walletLedger').doc(houseLedgerId).set({
      id: houseLedgerId,
      userId: 'system-house',
      type: WalletEntryType.HOUSE_CUT,
      amountSantim: houseCutSantim,
      balanceSantim: 0,
      gameId: roomId,
      createdAt: Date.now()
    });
  }

  await db.collection('games').doc(gameId).update({
    status: GameStatus.COMPLETED,
    winners,
    revealedAt: Date.now()
  });

  return { success: true, winners };
});

// Fraud flag logic — implements all 5 criteria from spec §4.3
async function evaluateFraudFlags(
  db: admin.firestore.Firestore,
  win: WinnerRecord,
  gameId?: string
): Promise<boolean> {
  const userRef = db.collection('users').doc(win.userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return true;
  const userData = userDoc.data()!;

  // Rule 1 (§4.3): First-time depositor wins on their very first game
  const winLedgerSnap = await db.collection('walletLedger')
    .where('userId', '==', win.userId)
    .where('type', '==', WalletEntryType.WIN)
    .get();
  const isFirstWin = winLedgerSnap.empty;

  if (isFirstWin) {
    const depositSnap = await db.collection('walletLedger')
      .where('userId', '==', win.userId)
      .where('type', '==', WalletEntryType.DEPOSIT)
      .get();
    if (!depositSnap.empty && depositSnap.size === 1) {
      return true; // High bonus-abuse signal
    }
  }

  // Rule 2 (§4.3): Player wins more than 3 games in a rolling 6-hour window
  const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
  const recentWinsSnap = await db.collection('walletLedger')
    .where('userId', '==', win.userId)
    .where('type', '==', WalletEntryType.WIN)
    .where('createdAt', '>=', sixHoursAgo)
    .get();

  if (recentWinsSnap.size >= 3) {
    return true;
  }

  // Rule 3 (§4.3): Player's win rate in the last 20 games exceeds 30%
  // Count games played (entry_fee entries) and wins in recent history
  const recentEntryFeesSnap = await db.collection('walletLedger')
    .where('userId', '==', win.userId)
    .where('type', '==', WalletEntryType.ENTRY_FEE)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  if (recentEntryFeesSnap.size >= 10) {
    // Only evaluate win rate if player has enough game history
    const allWinsSnap = await db.collection('walletLedger')
      .where('userId', '==', win.userId)
      .where('type', '==', WalletEntryType.WIN)
      .get();

    const winRate = allWinsSnap.size / recentEntryFeesSnap.size;
    if (winRate > 0.30) {
      return true;
    }
  }

  // Rule 4 (§4.3): Multiple wins from the same device fingerprint within 24h across different accounts
  const deviceFingerprint = userData.deviceFingerprint;
  if (deviceFingerprint) {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    // Find other users sharing this device fingerprint
    const sameDeviceUsersSnap = await db.collection('users')
      .where('deviceFingerprint', '==', deviceFingerprint)
      .get();

    const otherUids = sameDeviceUsersSnap.docs
      .map(d => d.id)
      .filter(uid => uid !== win.userId);

    if (otherUids.length > 0) {
      // Check if any of those other accounts won in last 24h
      for (const otherUid of otherUids) {
        const otherWinsSnap = await db.collection('walletLedger')
          .where('userId', '==', otherUid)
          .where('type', '==', WalletEntryType.WIN)
          .where('createdAt', '>=', twentyFourHoursAgo)
          .limit(1)
          .get();

        if (!otherWinsSnap.empty) {
          return true; // Same device, different account, won within 24h
        }
      }
    }
  }

  // Rule 5 (§4.3): Game had fewer than 4 unique player device fingerprints (collusion ring)
  if (gameId) {
    const cardsSnap = await db.collection('rooms').doc(gameId).collection('cards').get();
    const playerUids = new Set(cardsSnap.docs.map(d => d.data().userId));

    const fingerprints = new Set<string>();
    for (const uid of playerUids) {
      const pDoc = await db.collection('users').doc(uid).get();
      if (pDoc.exists) {
        const fp = pDoc.data()?.deviceFingerprint;
        if (fp) fingerprints.add(fp);
      }
    }

    if (fingerprints.size < 4 && playerUids.size >= 2) {
      return true; // Too few unique devices for the number of players
    }
  }

  return false;
}

export const addMockPlayers = onCall(SECURE_CALL_OPTIONS, async (request) => {
  if (process.env.FUNCTIONS_EMULATOR !== 'true' && process.env.VITEST !== 'true') {
    throw new HttpsError('permission-denied', 'This function is only available in emulator mode.');
  }

  const { roomId, count } = request.data as { roomId: string; count?: number };
  if (!roomId) {
    throw new HttpsError('invalid-argument', 'Missing roomId.');
  }

  const db = admin.firestore();
  const rtdb = admin.database();
  const roomRef = db.collection('rooms').doc(roomId);

  const mockCount = count || 3;
  const mockPlayersInfo = [];

  const roomDoc = await roomRef.get();
  if (!roomDoc.exists) {
    throw new HttpsError('not-found', 'Room not found.');
  }
  const room = roomDoc.data() as RoomRecord;
  if (room.status !== RoomStatus.WAITING) {
    throw new HttpsError('failed-precondition', 'Cannot add mock players: game is not in waiting state.');
  }

  const allExistingCards = await roomRef.collection('cards').get();
  const existingFingerprints = new Set(allExistingCards.docs.map(doc => doc.data().fingerprint));

  const crypto = await import('crypto');

  for (let i = 1; i <= mockCount; i++) {
    const mockUid = `mock-player-${i}-${crypto.randomBytes(4).toString('hex')}`;
    const displayName = `Mock Bot ${i}`;
    const phone = `+25199900000${i}`;

    const userRef = db.collection('users').doc(mockUid);
    const mockUser = {
      uid: mockUid,
      phone,
      displayName,
      dob: '1998-08-08',
      kycStatus: 'verified',
      walletBalanceSantim: 100000,
      deviceFingerprint: `mock-fingerprint-${mockUid}`,
      referralCode: `MOCK${i}`,
      referredBy: null,
      createdAt: Date.now(),
      isBanned: false,
    };
    await userRef.set(mockUser);

    const cardCount = 1;
    const totalCost = room.entryFeeSantim * cardCount;

    const card = generateUniqueCard(existingFingerprints);
    existingFingerprints.add(card.fingerprint);

    await roomRef.collection('cards').doc(card.id).set({
      id: card.id,
      userId: mockUid,
      numbersJson: JSON.stringify(card.numbers),
      fingerprint: card.fingerprint,
      createdAt: Date.now(),
    });

    const nextBalance = mockUser.walletBalanceSantim - totalCost;
    await userRef.update({ walletBalanceSantim: nextBalance });

    const ledgerId = crypto.randomUUID();
    await db.collection('walletLedger').doc(ledgerId).set({
      id: ledgerId,
      userId: mockUid,
      type: WalletEntryType.ENTRY_FEE,
      amountSantim: totalCost,
      balanceSantim: nextBalance,
      createdAt: Date.now(),
    });

    mockPlayersInfo.push({
      uid: mockUid,
      displayName,
      card
    });
  }

  const addedPot = room.entryFeeSantim * mockCount;
  const nextPlayerCount = room.playerCount + mockCount;
  const nextPot = room.potSantim + addedPot;

  await roomRef.update({
    playerCount: nextPlayerCount,
    potSantim: nextPot
  });

  const updates: Record<string, any> = {};
  for (const player of mockPlayersInfo) {
    const cardState = {
      id: player.card.id,
      numbers: player.card.numbers,
      marked: Array(5).fill(null).map(() => Array(5).fill(false)),
    };
    cardState.marked[2][2] = true;

    updates[`players/${player.uid}/cards/${player.card.id}`] = cardState;
    updates[`players/${player.uid}/displayName`] = player.displayName;
    updates[`players/${player.uid}/connected`] = true;
    updates[`players/${player.uid}/lastSeen`] = Date.now();
  }

  await rtdb.ref(`rooms/${roomId}`).update(updates);

  return { success: true, count: mockCount };
});

export const claimBingo = onCall(SECURE_CALL_OPTIONS, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const uid = auth.uid;
  const { roomId, cardId, winTier } = request.data as {
    roomId: string;
    cardId: string;
    winTier: WinTier;
  };

  if (!roomId || !cardId || !winTier) {
    throw new HttpsError('invalid-argument', 'Missing roomId, cardId, or winTier.');
  }

  const db = admin.firestore();
  const rtdb = admin.database();

  const gameRef = db.collection('games').doc(roomId);
  const cardRef = db.collection('rooms').doc(roomId).collection('cards').doc(cardId);

  // Evaluate fraud flags BEFORE beginning transaction to avoid Firestore transaction rules violations (all reads must happen before writes)
  const tempWinnerPlaceholder: WinnerRecord = {
    userId: uid,
    cardId,
    winTier,
    amountSantim: 0,
    creditedAt: Date.now()
  };
  const isFlagged = await evaluateFraudFlags(db, tempWinnerPlaceholder, roomId);

  const result = await db.runTransaction(async (transaction) => {
    // 1. Read game document
    const gameDoc = await transaction.get(gameRef);
    if (!gameDoc.exists) {
      throw new HttpsError('not-found', 'Game not found.');
    }
    const game = gameDoc.data() as GameRecord;
    if (game.status !== GameStatus.ACTIVE) {
      throw new HttpsError('failed-precondition', 'Game is not active.');
    }

    // Single Winner Rule: Check if ANY winner has already claimed
    if (game.winners && game.winners.length > 0) {
      throw new HttpsError('failed-precondition', 'A winner has already been declared for this game!');
    }

    // 2. Read card document
    const cardDoc = await transaction.get(cardRef);
    if (!cardDoc.exists) {
      throw new HttpsError('not-found', 'Card not found.');
    }
    const card = cardDoc.data();
    if (card?.userId !== uid) {
      throw new HttpsError('permission-denied', 'You do not own this card.');
    }

    const cardNumbers = JSON.parse(card.numbersJson) as number[][];

    // 3. Verify win pattern against numbers called so far
    const winCheck = checkWinPattern(cardNumbers, game.calledNumbers);
    let isValid = false;
    if (winTier === WinTier.LINE && winCheck.line) isValid = true;
    if (winTier === WinTier.CORNERS && winCheck.corners) isValid = true;
    if (winTier === WinTier.FULL_HOUSE && winCheck.fullHouse) isValid = true;

    if (!isValid) {
      throw new HttpsError('failed-precondition', `Invalid BINGO claim.`);
    }

    // 4. Calculate prize (Single winner takes 100% of player prize pool)
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await transaction.get(roomRef);
    const room = roomDoc.data() as RoomRecord;
    const playerPrizePool = Math.floor((room.potSantim * 85) / 100);
    const tierPrizePools = calculateTierPrizePools(playerPrizePool);
    const prizeAmount = tierPrizePools[winTier] || playerPrizePool;

    const newWinner: WinnerRecord = {
      userId: uid,
      cardId,
      winTier,
      amountSantim: prizeAmount,
      creditedAt: Date.now(),
    };

    const updatedWinners = [newWinner];

    // Update game record to COMPLETED immediately
    transaction.update(gameRef, { 
      winners: updatedWinners,
      status: GameStatus.COMPLETED,
      revealedAt: Date.now()
    });

    // Update room status to ENDED
    transaction.update(roomRef, { status: RoomStatus.ENDED });

    // 5. Credit or flag winner wallet
    if (isFlagged) {
      transaction.set(db.collection('flaggedWins').doc(crypto.randomUUID()), {
        ...newWinner,
        flaggedAt: Date.now(),
        status: 'pending_review',
      });
    } else {
      const userRef = db.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      if (userDoc.exists) {
        const currentBalance = userDoc.data()?.walletBalanceSantim || 0;
        const newBalance = currentBalance + prizeAmount;
        transaction.update(userRef, { walletBalanceSantim: newBalance });

        const ledgerId = crypto.randomUUID();
        const ledgerEntry: WalletLedgerEntry = {
          id: ledgerId,
          userId: uid,
          type: WalletEntryType.WIN,
          amountSantim: prizeAmount,
          balanceSantim: newBalance,
          gameId: roomId,
          createdAt: Date.now(),
        };
        transaction.set(db.collection('walletLedger').doc(ledgerId), ledgerEntry);
      }
    }

    return { success: true, winner: newWinner };
  });

  if (result.success && result.winner) {
    // Write winner & state to RTDB immediately so all connected clients see Victory Modal instantly
    await rtdb.ref(`rooms/${roomId}`).update({
      state: RoomStatus.ENDED,
      winner: result.winner,
      claims: {
        [winTier]: {
          userId: uid,
          cardId,
          timestamp: Date.now()
        }
      }
    });
  }

  return result;
});
