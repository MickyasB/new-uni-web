import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkRateLimit } from '../middleware/rateLimit';
import { query, getClient } from '../db';
import { startGameLoop, claimWin, addMockPlayers } from '../services/gameEngine';

const router = Router();

// Store Socket.io server reference (set from index.ts)
let ioRef: any = null;
export function setIoRef(io: any) { ioRef = io; }

// Helper: Generate Bingo Card numbers 5x5 grid
function generateBingoCard(): number[][] {
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  const ranges = [[1,15],[16,30],[31,45],[46,60],[61,75]];

  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];
    const nums: number[] = [];
    while (nums.length < 5) {
      const r = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!nums.includes(r)) nums.push(r);
    }
    nums.sort((a, b) => a - b);
    for (let row = 0; row < 5; row++) grid[row][col] = nums[row];
  }
  grid[2][2] = 0; // FREE
  return grid;
}

// ─── GET /rooms ────────────────────────────────────────────────────────────────
router.get('/rooms', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM rooms ORDER BY created_at DESC');
    res.json({ success: true, rooms: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /rooms/:id ────────────────────────────────────────────────────────────
router.get('/rooms/:id', async (req: Request, res: Response) => {
  try {
    const roomRes = await query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (roomRes.rowCount === 0) return res.status(404).json({ error: 'Room not found' });
    res.json({ success: true, room: roomRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /buyCards ────────────────────────────────────────────────────────────
router.post('/buyCards', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId, cardCount } = req.body;
  const userId = req.user!.uid;

  if (!roomId || !cardCount || cardCount < 1 || cardCount > 6) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  // Rate limit: max 6 card purchases per user per minute
  const allowed = await checkRateLimit(userId, 'buyCards', 6, 60 * 1000);
  if (!allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded: max 6 card purchases per minute' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const roomRes = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [roomId]);
    if (roomRes.rowCount === 0) throw new Error('Room not found');
    const room = roomRes.rows[0];

    const userRes = await client.query('SELECT wallet_balance_santim FROM users WHERE uid = $1 FOR UPDATE', [userId]);
    if (userRes.rowCount === 0) throw new Error('User not found');

    const totalCost = parseInt(room.entry_fee_santim, 10) * cardCount;
    const currentBalance = parseInt(userRes.rows[0].wallet_balance_santim, 10);

    if (currentBalance < totalCost) throw new Error('Insufficient wallet balance');

    const newBalance = currentBalance - totalCost;
    await client.query('UPDATE users SET wallet_balance_santim = $1 WHERE uid = $2', [newBalance, userId]);

    // Ledger
    const ledgerId = crypto.randomUUID();
    await client.query(
      `INSERT INTO wallet_ledger (id, user_id, type, amount_santim, balance_santim, created_at)
       VALUES ($1, $2, 'entry_fee', $3, $4, $5)`,
      [ledgerId, userId, totalCost, newBalance, Date.now()]
    );

    // Create cards
    const createdCards = [];
    for (let i = 0; i < cardCount; i++) {
      const cardId = crypto.randomUUID();
      const grid = generateBingoCard();
      const fingerprint = crypto.createHash('sha256').update(JSON.stringify(grid)).digest('hex').slice(0, 16);

      await client.query(
        `INSERT INTO bingo_cards (id, room_id, user_id, fingerprint, numbers_json, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [cardId, roomId, userId, fingerprint, JSON.stringify(grid), Date.now()]
      );

      createdCards.push({ id: cardId, numbers: grid, fingerprint });
    }

    // Update room pot & player count
    const newPot = parseInt(room.pot_santim, 10) + totalCost;
    const newPlayerCount = parseInt(room.player_count, 10) + 1;
    await client.query(
      'UPDATE rooms SET pot_santim = $1, player_count = $2 WHERE id = $3',
      [newPot, newPlayerCount, roomId]
    );

    await client.query('COMMIT');

    // Notify room via Socket.io
    if (ioRef) {
      ioRef.to(roomId).emit('playerJoined', { userId, cardCount, newPlayerCount });
    }

    res.json({ success: true, newBalance, cards: createdCards });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message || 'Failed to buy cards' });
  } finally {
    client.release();
  }
});

// ─── GET /myCards/:roomId ──────────────────────────────────────────────────────
router.get('/myCards/:roomId', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.uid;
  try {
    const result = await query(
      'SELECT * FROM bingo_cards WHERE room_id = $1 AND user_id = $2',
      [req.params.roomId, userId]
    );
    const cards = result.rows.map((row: any) => ({
      id: row.id,
      numbers: typeof row.numbers_json === 'string' ? JSON.parse(row.numbers_json) : row.numbers_json,
      fingerprint: row.fingerprint,
    }));
    res.json({ success: true, cards });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /start ───────────────────────────────────────────────────────────────
router.post('/start', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: 'roomId is required' });

  try {
    if (!ioRef) throw new Error('Socket.io server not initialized');
    const result = await startGameLoop(roomId, ioRef);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── POST /claim ───────────────────────────────────────────────────────────────
router.post('/claim', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId, cardId, winTier } = req.body;
  const userId = req.user!.uid;

  if (!roomId || !cardId) {
    return res.status(400).json({ error: 'roomId and cardId are required' });
  }

  try {
    // Look up gameId from roomId
    const gameRes = await query(
      "SELECT id FROM games WHERE room_id = $1 AND status = 'active' LIMIT 1",
      [roomId]
    );
    if (gameRes.rowCount === 0) {
      return res.status(400).json({ error: 'No active game found for this room' });
    }
    const gameId = gameRes.rows[0].id;

    const result = await claimWin(roomId, gameId, userId, cardId, winTier || 'line');

    if (result.miscalled) {
      // Broadcast miscall alert to the room
      if (ioRef) {
        ioRef.to(roomId).emit('playerMiscalled', {
          roomId,
          userId,
          cardId,
          message: 'False Bingo claim! Card is blocked for this round.',
        });
      }
      return res.status(400).json(result);
    }

    // Broadcast win via Socket.io
    if (ioRef && result.success) {
      ioRef.to(roomId).emit('winnerDeclared', result.winner);
    }

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to process claim' });
  }
});

// ─── GET /:roomId/state ────────────────────────────────────────────────────────
router.get('/:roomId/state', async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;

    const roomRes = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomRes.rowCount === 0) return res.status(404).json({ error: 'Room not found' });

    const gameRes = await query(
      'SELECT id, seed_hash, called_numbers, status, winners, last_processed_index FROM games WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1',
      [roomId]
    );

    res.json({
      success: true,
      room: roomRes.rows[0],
      game: gameRes.rows[0] || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /addBots (dev only) ──────────────────────────────────────────────────
router.post('/addBots', authenticate, async (req: AuthRequest, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const { roomId, count } = req.body;
  if (!roomId) return res.status(400).json({ error: 'roomId required' });

  try {
    const result = await addMockPlayers(roomId, count || 3);

    if (ioRef) {
      ioRef.to(roomId).emit('botsAdded', { count: result.count });
    }

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

