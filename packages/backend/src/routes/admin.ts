import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';
import { query, getClient } from '../db';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

// Helper: write audit log
async function auditLog(actorId: string, actionType: string, target: string, before?: any, after?: any) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO admin_audit_logs (id, actor_id, action_type, target, before_value, after_value, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, actorId, actionType, target, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, Date.now()]
  );
}

// ─── GET /analytics ────────────────────────────────────────────────────────────
router.get('/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const [users, deposits, withdrawals, wins, house, rooms] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query("SELECT COALESCE(SUM(amount_santim), 0) as total FROM wallet_ledger WHERE type = 'deposit'"),
      query("SELECT COALESCE(SUM(amount_santim), 0) as total FROM wallet_ledger WHERE type = 'withdrawal'"),
      query("SELECT COALESCE(SUM(amount_santim), 0) as total FROM wallet_ledger WHERE type = 'win'"),
      query("SELECT COALESCE(SUM(amount_santim), 0) as total FROM wallet_ledger WHERE type = 'house_cut'"),
      query('SELECT COUNT(*) as count, COALESCE(AVG(player_count), 0) as avg_fill FROM rooms'),
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers: parseInt(users.rows[0].count, 10),
        totalDepositedEtb: parseInt(deposits.rows[0].total, 10) / 100,
        totalWithdrawnEtb: parseInt(withdrawals.rows[0].total, 10) / 100,
        totalWinningsPaidEtb: parseInt(wins.rows[0].total, 10) / 100,
        totalHouseCommissionEtb: parseInt(house.rows[0].total, 10) / 100,
        totalRooms: parseInt(rooms.rows[0].count, 10),
        avgRoomFill: parseFloat(rooms.rows[0].avg_fill).toFixed(1),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /users ────────────────────────────────────────────────────────────────
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    let result;
    if (search) {
      result = await query(
        `SELECT uid, phone, display_name, wallet_balance_santim, kyc_status, is_banned, device_fingerprint, referral_code, created_at
         FROM users WHERE uid ILIKE $1 OR phone ILIKE $1 OR display_name ILIKE $1
         ORDER BY created_at DESC LIMIT 50`,
        [`%${search}%`]
      );
    } else {
      result = await query(
        `SELECT uid, phone, display_name, wallet_balance_santim, kyc_status, is_banned, device_fingerprint, referral_code, created_at
         FROM users ORDER BY created_at DESC LIMIT 50`
      );
    }
    res.json({ success: true, users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /users/:uid/ban ──────────────────────────────────────────────────────
router.post('/users/:uid/ban', async (req: AuthRequest, res: Response) => {
  const { uid } = req.params;
  const { isBanned } = req.body;

  try {
    const before = await query('SELECT is_banned FROM users WHERE uid = $1', [uid]);
    if (before.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    await query('UPDATE users SET is_banned = $1 WHERE uid = $2', [!!isBanned, uid]);
    await auditLog(req.user!.uid, isBanned ? 'ban_user' : 'unban_user', uid, before.rows[0], { is_banned: isBanned });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /users/:uid/kyc ─────────────────────────────────────────────────────
router.post('/users/:uid/kyc', async (req: AuthRequest, res: Response) => {
  const { uid } = req.params;
  const { kycStatus } = req.body;

  try {
    await query('UPDATE users SET kyc_status = $1 WHERE uid = $2', [kycStatus, uid]);
    await auditLog(req.user!.uid, 'update_kyc', uid, null, { kyc_status: kycStatus });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /withdrawals ──────────────────────────────────────────────────────────
router.get('/withdrawals', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM withdrawal_requests ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ success: true, withdrawals: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /withdrawals/:id/approve ─────────────────────────────────────────────
router.post('/withdrawals/:id/approve', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await query(
      `UPDATE withdrawal_requests SET status = 'approved', processed_at = $1, processed_by = $2 WHERE id = $3`,
      [Date.now(), req.user!.uid, id]
    );
    await auditLog(req.user!.uid, 'approve_withdrawal', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /withdrawals/:id/reject ──────────────────────────────────────────────
router.post('/withdrawals/:id/reject', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get the withdrawal details to refund
    const wrRes = await client.query('SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE', [id]);
    if (wrRes.rowCount === 0) throw new Error('Withdrawal not found');
    const wr = wrRes.rows[0];

    if (wr.status !== 'pending') throw new Error('Withdrawal already processed');

    // Refund user
    await client.query(
      'UPDATE users SET wallet_balance_santim = wallet_balance_santim + $1 WHERE uid = $2',
      [parseInt(wr.amount_santim, 10), wr.user_id]
    );

    await client.query(
      `UPDATE withdrawal_requests SET status = 'rejected', processed_at = $1, processed_by = $2 WHERE id = $3`,
      [Date.now(), req.user!.uid, id]
    );

    await client.query('COMMIT');
    await auditLog(req.user!.uid, 'reject_withdrawal', id);
    res.json({ success: true });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── GET /flagged-wins ─────────────────────────────────────────────────────────
router.get('/flagged-wins', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM flagged_wins ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, flaggedWins: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /flagged-wins/:id/approve ────────────────────────────────────────────
router.post('/flagged-wins/:id/approve', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const fwRes = await client.query('SELECT * FROM flagged_wins WHERE id = $1 FOR UPDATE', [id]);
    if (fwRes.rowCount === 0) throw new Error('Flagged win not found');
    const fw = fwRes.rows[0];

    if (fw.status !== 'pending_review') throw new Error('Already processed');

    // Credit the winner
    const userRes = await client.query('SELECT wallet_balance_santim FROM users WHERE uid = $1 FOR UPDATE', [fw.user_id]);
    if (userRes.rowCount === 0) throw new Error('User not found');

    const currentBalance = parseInt(userRes.rows[0].wallet_balance_santim, 10);
    const newBalance = currentBalance + parseInt(fw.amount_santim, 10);

    await client.query('UPDATE users SET wallet_balance_santim = $1 WHERE uid = $2', [newBalance, fw.user_id]);

    // Ledger
    const ledgerId = crypto.randomUUID();
    await client.query(
      `INSERT INTO wallet_ledger (id, user_id, type, amount_santim, balance_santim, game_id, created_at)
       VALUES ($1, $2, 'win', $3, $4, $5, $6)`,
      [ledgerId, fw.user_id, fw.amount_santim, newBalance, fw.card_id, Date.now()]
    );

    // Mark approved
    await client.query(
      `UPDATE flagged_wins SET status = 'approved', processed_at = $1, processed_by = $2 WHERE id = $3`,
      [Date.now(), req.user!.uid, id]
    );

    await client.query('COMMIT');
    await auditLog(req.user!.uid, 'approve_flagged_win', id);
    res.json({ success: true });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── POST /flagged-wins/:id/reject ─────────────────────────────────────────────
router.post('/flagged-wins/:id/reject', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await query(
      `UPDATE flagged_wins SET status = 'rejected', processed_at = $1, processed_by = $2 WHERE id = $3`,
      [Date.now(), req.user!.uid, id]
    );
    await auditLog(req.user!.uid, 'reject_flagged_win', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /rooms ───────────────────────────────────────────────────────────────
router.post('/rooms', async (req: AuthRequest, res: Response) => {
  const { tier, mode, type, scheduledAt } = req.body;

  if (!tier || !mode || !type) {
    return res.status(400).json({ error: 'tier, mode, and type are required' });
  }

  const tiers: Record<string, { fee: number; min: number }> = {
    bronze: { fee: 1000, min: 2 },
    silver: { fee: 5000, min: 3 },
    gold: { fee: 10000, min: 5 },
  };

  const config = tiers[tier];
  if (!config) return res.status(400).json({ error: 'Invalid tier' });

  const roomId = crypto.randomUUID();

  try {
    await query(
      `INSERT INTO rooms (id, tier, entry_fee_santim, mode, type, scheduled_at, min_players, max_cards, status, player_count, pot_santim, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 6, 'waiting', 0, 0, $8)`,
      [roomId, tier, config.fee, mode, type, scheduledAt || null, config.min, Date.now()]
    );

    await auditLog(req.user!.uid, 'create_room', roomId, null, { tier, mode, type });
    res.json({ success: true, roomId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /audit-log ────────────────────────────────────────────────────────────
router.get('/audit-log', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM admin_audit_logs ORDER BY timestamp DESC LIMIT 100');
    res.json({ success: true, logs: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /ledger ───────────────────────────────────────────────────────────────
router.get('/ledger', async (req: AuthRequest, res: Response) => {
  try {
    const filterType = req.query.type as string;
    let result;
    if (filterType) {
      result = await query(
        'SELECT * FROM wallet_ledger WHERE type = $1 ORDER BY created_at DESC LIMIT 200',
        [filterType]
      );
    } else {
      result = await query('SELECT * FROM wallet_ledger ORDER BY created_at DESC LIMIT 200');
    }
    res.json({ success: true, entries: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /reconciliation ──────────────────────────────────────────────────────
router.post('/reconciliation', async (req: AuthRequest, res: Response) => {
  try {
    // Compare processed_webhooks against wallet_ledger deposits
    const webhooks = await query("SELECT transaction_id, amount_santim, gateway FROM processed_webhooks");
    const deposits = await query("SELECT transaction_id, amount_santim FROM wallet_ledger WHERE type = 'deposit' AND transaction_id IS NOT NULL");

    const depositMap = new Map(deposits.rows.map((d: any) => [d.transaction_id, d.amount_santim]));
    const mismatches: any[] = [];

    for (const wh of webhooks.rows) {
      if (!depositMap.has(wh.transaction_id)) {
        mismatches.push({ id: wh.transaction_id, issue: `Webhook processed but no ledger entry (${wh.gateway})` });
      }
    }

    await auditLog(req.user!.uid, 'run_reconciliation', 'manual', null, { mismatchCount: mismatches.length });

    res.json({
      success: true,
      mismatchCount: mismatches.length,
      mismatches,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
