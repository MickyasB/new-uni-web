import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkRateLimit } from '../middleware/rateLimit';
import { query, getClient } from '../db';

const router = Router();

// HMAC verification helper
function verifyHmac(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ─── GET /balance ──────────────────────────────────────────────────────────────
router.get('/balance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT wallet_balance_santim FROM users WHERE uid = $1', [req.user!.uid]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      balanceSantim: parseInt(result.rows[0].wallet_balance_santim, 10),
      balanceEtb: (parseInt(result.rows[0].wallet_balance_santim, 10) / 100).toFixed(2),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /history ──────────────────────────────────────────────────────────────
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM wallet_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user!.uid]
    );
    res.json({ success: true, entries: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /deposit ─────────────────────────────────────────────────────────────
router.post('/deposit', authenticate, async (req: AuthRequest, res: Response) => {
  const { amountEtb, gateway } = req.body;
  const uid = req.user!.uid;

  if (!amountEtb || amountEtb <= 0 || !gateway) {
    return res.status(400).json({ error: 'amountEtb and gateway are required' });
  }

  const amountSantim = Math.round(amountEtb * 100);
  const paymentRef = crypto.randomUUID();

  try {
    // Record pending payment
    await query(
      `INSERT INTO pending_payments (id, user_id, gateway, amount_santim, payment_ref, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
      [paymentRef, uid, gateway, amountSantim, paymentRef, Date.now()]
    );

    // In production, this would call the gateway API to get a checkout URL.
    // For now, return a mock checkout URL.
    const checkoutUrl = `${process.env.APP_URL || 'http://localhost:4000'}/api/wallet/mock-checkout?ref=${paymentRef}`;

    res.json({
      success: true,
      paymentRef,
      checkoutUrl,
      gateway,
      amountSantim,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /withdraw ────────────────────────────────────────────────────────────
router.post('/withdraw', authenticate, async (req: AuthRequest, res: Response) => {
  const { amountEtb, gateway, accountDetails } = req.body;
  const uid = req.user!.uid;

  if (!amountEtb || amountEtb <= 0 || !gateway || !accountDetails) {
    return res.status(400).json({ error: 'amountEtb, gateway, and accountDetails are required' });
  }

  // Rate limit: max 3 per 24h
  const allowed = await checkRateLimit(uid, 'withdrawal', 3, 24 * 60 * 60 * 1000);
  if (!allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded: max 3 withdrawal requests per 24 hours' });
  }

  const amountSantim = Math.round(amountEtb * 100);
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT wallet_balance_santim FROM users WHERE uid = $1 FOR UPDATE',
      [uid]
    );
    if (userRes.rowCount === 0) throw new Error('User not found');

    const currentBalance = parseInt(userRes.rows[0].wallet_balance_santim, 10);
    if (currentBalance < amountSantim) {
      throw new Error('Insufficient balance');
    }

    const newBalance = currentBalance - amountSantim;
    await client.query('UPDATE users SET wallet_balance_santim = $1 WHERE uid = $2', [newBalance, uid]);

    const requestId = crypto.randomUUID();
    await client.query(
      `INSERT INTO withdrawal_requests (id, user_id, gateway, amount_santim, account_details, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
      [requestId, uid, gateway, amountSantim, accountDetails, Date.now()]
    );

    const ledgerId = crypto.randomUUID();
    await client.query(
      `INSERT INTO wallet_ledger (id, user_id, type, amount_santim, balance_santim, gateway, created_at)
       VALUES ($1, $2, 'withdrawal', $3, $4, $5, $6)`,
      [ledgerId, uid, amountSantim, newBalance, gateway, Date.now()]
    );

    await client.query('COMMIT');

    res.json({ success: true, requestId, newBalance });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── Webhook Handlers ──────────────────────────────────────────────────────────

async function processWebhook(
  gateway: string,
  transactionId: string,
  userId: string,
  amountSantim: number,
  signatureValid: boolean,
  res: Response
) {
  if (!signatureValid) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Idempotency check — try to insert, fail if duplicate
    const existing = await client.query(
      'SELECT transaction_id FROM processed_webhooks WHERE transaction_id = $1',
      [transactionId]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      await client.query('COMMIT');
      return res.json({ success: true, duplicate: true });
    }

    // Record webhook
    await client.query(
      `INSERT INTO processed_webhooks (transaction_id, gateway, user_id, amount_santim, signature_valid, processing_result, created_at)
       VALUES ($1, $2, $3, $4, $5, 'credited', $6)`,
      [transactionId, gateway, userId, amountSantim, signatureValid, Date.now()]
    );

    // Credit user wallet
    const userRes = await client.query(
      'SELECT wallet_balance_santim FROM users WHERE uid = $1 FOR UPDATE',
      [userId]
    );
    if (userRes.rowCount === 0) throw new Error('User not found');

    const currentBalance = parseInt(userRes.rows[0].wallet_balance_santim, 10);
    const newBalance = currentBalance + amountSantim;

    await client.query('UPDATE users SET wallet_balance_santim = $1 WHERE uid = $2', [newBalance, userId]);

    // Ledger entry
    const ledgerId = crypto.randomUUID();
    await client.query(
      `INSERT INTO wallet_ledger (id, user_id, type, amount_santim, balance_santim, gateway, transaction_id, created_at)
       VALUES ($1, $2, 'deposit', $3, $4, $5, $6, $7)`,
      [ledgerId, userId, amountSantim, newBalance, gateway, transactionId, Date.now()]
    );

    // Clear any matching pending payment
    await client.query(
      `UPDATE pending_payments SET status = 'completed' WHERE user_id = $1 AND gateway = $2 AND status = 'pending'`,
      [userId, gateway]
    );

    await client.query('COMMIT');
    res.json({ success: true, credited: true });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(`[Webhook ${gateway}] Error:`, err.message);
    res.status(500).json({ error: 'Processing failed' });
  } finally {
    client.release();
  }
}

// Chapa webhook
router.post('/webhooks/chapa', async (req: Request, res: Response) => {
  const secret = process.env.CHAPA_WEBHOOK_SECRET || 'chapa_test_secret';
  const signature = (req.headers['x-chapa-signature'] || req.headers['chapa-signature'] || '') as string;
  const body = JSON.stringify(req.body);
  const valid = signature ? verifyHmac(body, signature, secret) : true; // relaxed in dev

  const { tx_ref, amount, currency, status: txStatus } = req.body;
  if (txStatus !== 'success') return res.json({ received: true });

  const userId = req.body.meta?.userId || req.body.customization?.userId || '';
  const amountSantim = Math.round((parseFloat(amount) || 0) * 100);

  await processWebhook('chapa', tx_ref, userId, amountSantim, valid, res);
});

// Telebirr webhook
router.post('/webhooks/telebirr', async (req: Request, res: Response) => {
  const secret = process.env.TELEBIRR_WEBHOOK_SECRET || 'telebirr_test_secret';
  const signature = (req.headers['x-telebirr-signature'] || '') as string;
  const body = JSON.stringify(req.body);
  const valid = signature ? verifyHmac(body, signature, secret) : true;

  const { outTradeNo, totalAmount, tradeStatus, msisdn } = req.body;
  if (tradeStatus !== 'SUCCESS') return res.json({ received: true });

  const amountSantim = Math.round((parseFloat(totalAmount) || 0) * 100);
  // Resolve user by phone
  const userRes = await query('SELECT uid FROM users WHERE phone = $1', [msisdn || '']);
  const userId = userRes.rows[0]?.uid || '';

  await processWebhook('telebirr', outTradeNo, userId, amountSantim, valid, res);
});

// WeBirr webhook
router.post('/webhooks/webirr', async (req: Request, res: Response) => {
  const secret = process.env.WEBIRR_WEBHOOK_SECRET || 'webirr_test_secret';
  const signature = (req.headers['x-webirr-signature'] || '') as string;
  const body = JSON.stringify(req.body);
  const valid = signature ? verifyHmac(body, signature, secret) : true;

  const { paymentId, amount, status: txStatus, merchantOrderId } = req.body;
  if (txStatus !== 'COMPLETED') return res.json({ received: true });

  const userId = req.body.userId || '';
  const amountSantim = Math.round((parseFloat(amount) || 0) * 100);

  await processWebhook('webirr', paymentId || merchantOrderId, userId, amountSantim, valid, res);
});

// CBE webhook
router.post('/webhooks/cbe', async (req: Request, res: Response) => {
  const secret = process.env.CBE_WEBHOOK_SECRET || 'cbe_test_secret';
  const signature = (req.headers['x-cbe-signature'] || '') as string;
  const body = JSON.stringify(req.body);
  const valid = signature ? verifyHmac(body, signature, secret) : true;

  const { referenceNumber, amount, transactionStatus } = req.body;
  if (transactionStatus !== 'COMPLETED') return res.json({ received: true });

  const userId = req.body.userId || '';
  const amountSantim = Math.round((parseFloat(amount) || 0) * 100);

  await processWebhook('cbe', referenceNumber, userId, amountSantim, valid, res);
});

export default router;
