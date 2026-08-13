import crypto from 'crypto';
import { Server } from 'socket.io';
import { getClient, query } from '../db';

// ── Shared Utils (ported from packages/functions/src/utils) ────────────────────

/** CSRNG shuffle using Fisher-Yates with crypto.randomInt */
function generateBingoSequence(): number[] {
  const numbers = Array.from({ length: 75 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

/** SHA-256 hash of the sequence for commit-reveal */
function computeSeedHash(sequence: number[]): string {
  return crypto.createHash('sha256').update(sequence.join(',')).digest('hex');
}

/** Check win patterns on a 5x5 card */
function checkWinPattern(
  cardNumbers: number[][],
  calledNumbers: number[]
): { line: boolean; corners: boolean; fullHouse: boolean } {
  const calledSet = new Set(calledNumbers);
  calledSet.add(0); // FREE cell

  const isMarked = (r: number, c: number) => calledSet.has(cardNumbers[r][c]);

  // Line check
  let hasLine = false;
  for (let r = 0; r < 5 && !hasLine; r++) {
    if ([0,1,2,3,4].every(c => isMarked(r, c))) hasLine = true;
  }
  for (let c = 0; c < 5 && !hasLine; c++) {
    if ([0,1,2,3,4].every(r => isMarked(r, c))) hasLine = true;
  }
  if (!hasLine && [0,1,2,3,4].every(i => isMarked(i, i))) hasLine = true;
  if (!hasLine && [0,1,2,3,4].every(i => isMarked(i, 4 - i))) hasLine = true;

  const corners = isMarked(0,0) && isMarked(0,4) && isMarked(4,0) && isMarked(4,4);

  let fullHouse = true;
  for (let r = 0; r < 5 && fullHouse; r++) {
    for (let c = 0; c < 5 && fullHouse; c++) {
      if (!isMarked(r, c)) fullHouse = false;
    }
  }

  return { line: hasLine, corners, fullHouse };
}

/** Bingo card generator */
function generateBingoCard(): number[][] {
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  const ranges = [[1,15],[16,30],[31,45],[46,60],[61,75]];

  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];
    const nums: number[] = [];
    while (nums.length < 5) {
      const r = crypto.randomInt(min, max + 1);
      if (!nums.includes(r)) nums.push(r);
    }
    nums.sort((a, b) => a - b);
    for (let row = 0; row < 5; row++) grid[row][col] = nums[row];
  }
  grid[2][2] = 0; // FREE
  return grid;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Store active game loops to prevent duplicates
const activeGames = new Set<string>();

// ── Start Game Loop ────────────────────────────────────────────────────────────

export async function startGameLoop(roomId: string, io: Server): Promise<any> {
  if (activeGames.has(roomId)) {
    throw new Error('Game already running for this room');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const roomRes = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [roomId]);
    if (roomRes.rowCount === 0) throw new Error('Room not found');
    const room = roomRes.rows[0];

    if (room.status !== 'waiting') throw new Error('Room is not in waiting state');

    const cardsRes = await client.query('SELECT COUNT(*) as count FROM bingo_cards WHERE room_id = $1', [roomId]);
    const cardCount = parseInt(cardsRes.rows[0].count, 10);
    if (cardCount < room.min_players) throw new Error(`Need at least ${room.min_players} players`);

    // Generate sequence
    const sequence = generateBingoSequence();
    const seedHash = computeSeedHash(sequence);

    const gameId = crypto.randomUUID();
    await client.query(
      `INSERT INTO games (id, room_id, seed_hash, sequence, called_numbers, status, last_processed_index, winners, created_at)
       VALUES ($1, $2, $3, $4, '[]'::jsonb, 'active', -1, '[]'::jsonb, $5)`,
      [gameId, roomId, seedHash, JSON.stringify(sequence), Date.now()]
    );

    await client.query("UPDATE rooms SET status = 'active' WHERE id = $1", [roomId]);
    await client.query('COMMIT');

    // Broadcast game start
    io.to(roomId).emit('gameStarted', { gameId, seedHash, roomId });

    activeGames.add(roomId);

    // Run number calling loop (async, don't await)
    runNumberCallingLoop(roomId, gameId, sequence, room, io).catch(err => {
      console.error(`[GameEngine] Loop error for room ${roomId}:`, err.message);
    }).finally(() => {
      activeGames.delete(roomId);
    });

    return { success: true, gameId, seedHash };
  } catch (err: any) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Number Calling Loop ────────────────────────────────────────────────────────

async function runNumberCallingLoop(
  roomId: string,
  gameId: string,
  sequence: number[],
  room: any,
  io: Server
) {
  const sleepMs = room.mode === 'auto' ? 5000 : 10000;
  const calledNumbers: number[] = [];
  let winners: any[] = [];

  for (let i = 0; i < sequence.length; i++) {
    const number = sequence[i];
    calledNumbers.push(number);

    // Update game state in DB
    await query(
      'UPDATE games SET called_numbers = $1, last_processed_index = $2 WHERE id = $3',
      [JSON.stringify(calledNumbers), i, gameId]
    );

    // Broadcast to all players in the room
    io.to(roomId).emit('numberCalled', {
      number,
      index: i,
      calledNumbers: [...calledNumbers],
    });

    // Server-side auto-detection for bot players (testing)
    if (process.env.NODE_ENV !== 'production') {
      const allCards = await query(
        'SELECT * FROM bingo_cards WHERE room_id = $1',
        [roomId]
      );

      for (const card of allCards.rows) {
        const nums = typeof card.numbers_json === 'string' ? JSON.parse(card.numbers_json) : card.numbers_json;
        const winCheck = checkWinPattern(nums, calledNumbers);

        if (winCheck.fullHouse || winCheck.line || winCheck.corners) {
          const tier = winCheck.fullHouse ? 'full_house' : winCheck.corners ? 'corners' : 'line';
          // Auto-claim for bots
          if (card.user_id.startsWith('bot_')) {
            try {
              const result = await claimWin(roomId, gameId, card.user_id, card.id, tier, room);
              if (result.success) {
                winners = result.winners;
                io.to(roomId).emit('winnerDeclared', result.winner);
                break;
              }
            } catch (e) { /* already claimed */ }
          }
        }
      }
    }

    // Check if winner has been claimed
    const gameState = await query('SELECT winners FROM games WHERE id = $1', [gameId]);
    const currentWinners = gameState.rows[0]?.winners || [];
    if (currentWinners.length > 0) {
      winners = currentWinners;
      break;
    }

    await sleep(sleepMs);
  }

  // End the game
  await query(
    "UPDATE games SET status = 'completed', winners = $1, revealed_at = $2 WHERE id = $3",
    [JSON.stringify(winners), Date.now(), gameId]
  );
  await query("UPDATE rooms SET status = 'ended' WHERE id = $1", [roomId]);

  // Record house cut
  const potSantim = parseInt(room.pot_santim, 10);
  if (potSantim > 0) {
    const houseCut = Math.floor(potSantim * 0.15);
    const ledgerId = crypto.randomUUID();
    await query(
      `INSERT INTO wallet_ledger (id, user_id, type, amount_santim, balance_santim, game_id, created_at)
       VALUES ($1, 'system-house', 'house_cut', $2, 0, $3, $4)`,
      [ledgerId, houseCut, roomId, Date.now()]
    );
  }

  io.to(roomId).emit('gameEnded', {
    roomId,
    gameId,
    winners,
    sequence,
  });
}

// ── Claim Win ──────────────────────────────────────────────────────────────────

export async function claimWin(
  roomId: string,
  gameId: string,
  userId: string,
  cardId: string,
  winTier: string,
  room?: any
): Promise<any> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Read game
    const gameRes = await client.query('SELECT * FROM games WHERE id = $1 FOR UPDATE', [gameId]);
    if (gameRes.rowCount === 0) throw new Error('Game not found');
    const game = gameRes.rows[0];

    if (game.status !== 'active') throw new Error('Game is not active');

    const currentWinners = game.winners || [];
    if (currentWinners.length > 0) throw new Error('A winner has already been declared');

    // 2. Read card
    const cardRes = await client.query('SELECT * FROM bingo_cards WHERE id = $1', [cardId]);
    if (cardRes.rowCount === 0) throw new Error('Card not found');
    const card = cardRes.rows[0];
    if (card.user_id !== userId) throw new Error('You do not own this card');

    // 3. Verify win
    const cardNumbers = typeof card.numbers_json === 'string' ? JSON.parse(card.numbers_json) : card.numbers_json;
    const calledNumbers = typeof game.called_numbers === 'string' ? JSON.parse(game.called_numbers) : game.called_numbers;
    const winCheck = checkWinPattern(cardNumbers, calledNumbers);

    let isValid = false;
    if (winTier === 'line' && winCheck.line) isValid = true;
    if (winTier === 'corners' && winCheck.corners) isValid = true;
    if (winTier === 'full_house' && winCheck.fullHouse) isValid = true;
    if (!isValid) throw new Error('Invalid BINGO claim');

    // 4. Calculate prize (single winner takes 85% of pot)
    if (!room) {
      const roomRes = await client.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
      room = roomRes.rows[0];
    }
    const potSantim = parseInt(room.pot_santim, 10);
    const prizeAmount = Math.floor(potSantim * 0.85);

    const winner = {
      userId,
      cardId,
      winTier,
      amountSantim: prizeAmount,
      creditedAt: Date.now(),
    };

    // 5. Fraud check (basic)
    const isFlagged = await evaluateFraudFlags(client, userId, roomId);

    if (isFlagged) {
      const flagId = crypto.randomUUID();
      await client.query(
        `INSERT INTO flagged_wins (id, user_id, card_id, win_tier, amount_santim, reason, status, flagged_at, created_at)
         VALUES ($1, $2, $3, $4, $5, 'auto_flagged', 'pending_review', $6, $6)`,
        [flagId, userId, cardId, winTier, prizeAmount, Date.now()]
      );
    } else {
      // Credit winner directly
      await client.query(
        'UPDATE users SET wallet_balance_santim = wallet_balance_santim + $1 WHERE uid = $2',
        [prizeAmount, userId]
      );

      const ledgerId = crypto.randomUUID();
      const userRes = await client.query('SELECT wallet_balance_santim FROM users WHERE uid = $1', [userId]);
      const newBalance = parseInt(userRes.rows[0].wallet_balance_santim, 10);

      await client.query(
        `INSERT INTO wallet_ledger (id, user_id, type, amount_santim, balance_santim, game_id, created_at)
         VALUES ($1, $2, 'win', $3, $4, $5, $6)`,
        [ledgerId, userId, prizeAmount, newBalance, roomId, Date.now()]
      );
    }

    // 6. Update game
    await client.query(
      "UPDATE games SET winners = $1, status = 'completed', revealed_at = $2 WHERE id = $3",
      [JSON.stringify([winner]), Date.now(), gameId]
    );
    await client.query("UPDATE rooms SET status = 'ended' WHERE id = $1", [roomId]);

    await client.query('COMMIT');

    return { success: true, winner, winners: [winner], isFlagged };
  } catch (err: any) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Fraud Detection (SQL version) ──────────────────────────────────────────────

async function evaluateFraudFlags(client: any, userId: string, roomId: string): Promise<boolean> {
  // Rule 1: First-time depositor wins first game
  const winsRes = await client.query(
    "SELECT COUNT(*) as count FROM wallet_ledger WHERE user_id = $1 AND type = 'win'",
    [userId]
  );
  const isFirstWin = parseInt(winsRes.rows[0].count, 10) === 0;

  if (isFirstWin) {
    const depositsRes = await client.query(
      "SELECT COUNT(*) as count FROM wallet_ledger WHERE user_id = $1 AND type = 'deposit'",
      [userId]
    );
    if (parseInt(depositsRes.rows[0].count, 10) === 1) return true;
  }

  // Rule 2: >3 wins in rolling 6h
  const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
  const recentWins = await client.query(
    "SELECT COUNT(*) as count FROM wallet_ledger WHERE user_id = $1 AND type = 'win' AND created_at >= $2",
    [userId, sixHoursAgo]
  );
  if (parseInt(recentWins.rows[0].count, 10) >= 3) return true;

  // Rule 3: Win rate >30% in last 20 games
  const gamesPlayed = await client.query(
    "SELECT COUNT(*) as count FROM wallet_ledger WHERE user_id = $1 AND type = 'entry_fee' ORDER BY created_at DESC LIMIT 20",
    [userId]
  );
  const totalGames = parseInt(gamesPlayed.rows[0].count, 10);
  if (totalGames >= 10) {
    const totalWins = parseInt(winsRes.rows[0].count, 10);
    if (totalWins / totalGames > 0.30) return true;
  }

  // Rule 4: Same device fingerprint wins across different accounts in 24h
  const userRes = await client.query('SELECT device_fingerprint FROM users WHERE uid = $1', [userId]);
  const fp = userRes.rows[0]?.device_fingerprint;
  if (fp) {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const otherWins = await client.query(
      `SELECT COUNT(*) as count FROM wallet_ledger wl
       JOIN users u ON wl.user_id = u.uid
       WHERE u.device_fingerprint = $1 AND u.uid != $2 AND wl.type = 'win' AND wl.created_at >= $3`,
      [fp, userId, twentyFourHoursAgo]
    );
    if (parseInt(otherWins.rows[0].count, 10) > 0) return true;
  }

  // Rule 5: Game had < 4 unique device fingerprints
  const playersRes = await client.query(
    `SELECT COUNT(DISTINCT u.device_fingerprint) as fp_count, COUNT(DISTINCT bc.user_id) as player_count
     FROM bingo_cards bc JOIN users u ON bc.user_id = u.uid
     WHERE bc.room_id = $1 AND u.device_fingerprint IS NOT NULL`,
    [roomId]
  );
  const fpCount = parseInt(playersRes.rows[0].fp_count, 10);
  const playerCount = parseInt(playersRes.rows[0].player_count, 10);
  if (fpCount < 4 && playerCount >= 2) return true;

  return false;
}

// ── Add Mock/Bot Players (dev only) ────────────────────────────────────────────

export async function addMockPlayers(roomId: string, count: number = 3): Promise<any> {
  const client = await getClient();
  const players: any[] = [];

  try {
    await client.query('BEGIN');

    const roomRes = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [roomId]);
    if (roomRes.rowCount === 0) throw new Error('Room not found');
    const room = roomRes.rows[0];
    const entryFee = parseInt(room.entry_fee_santim, 10);

    for (let i = 0; i < count; i++) {
      const botId = `bot_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`;
      const botName = `Bot_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create bot user if not exists
      await client.query(
        `INSERT INTO users (uid, phone, display_name, dob, wallet_balance_santim, referral_code, created_at)
         VALUES ($1, $2, $3, '2000-01-01', $4, $5, $6)
         ON CONFLICT (uid) DO NOTHING`,
        [botId, `+2519${Date.now()}${i}`, botName, entryFee * 2, `BOT${Math.random().toString(36).substring(2,8).toUpperCase()}`, Date.now()]
      );

      // Generate and insert card
      const grid = generateBingoCard();
      const cardId = `card_bot_${Date.now()}_${i}`;
      const fingerprint = crypto.createHash('sha256').update(JSON.stringify(grid)).digest('hex').slice(0, 16);

      await client.query(
        `INSERT INTO bingo_cards (id, room_id, user_id, fingerprint, numbers_json, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [cardId, roomId, botId, fingerprint, JSON.stringify(grid), Date.now()]
      );

      players.push({ id: botId, name: botName, cardId });
    }

    // Update room
    const newPot = parseInt(room.pot_santim, 10) + (entryFee * count);
    const newPlayerCount = parseInt(room.player_count, 10) + count;
    await client.query(
      'UPDATE rooms SET pot_santim = $1, player_count = $2 WHERE id = $3',
      [newPot, newPlayerCount, roomId]
    );

    await client.query('COMMIT');
    return { success: true, count, players };
  } catch (err: any) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
