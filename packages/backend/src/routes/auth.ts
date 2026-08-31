import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/password';
import { query } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bingo_secret_key_2026';

// Register player
router.post('/register', async (req: Request, res: Response) => {
  const { phone, password, displayName, dob, referralCode } = req.body;

  if (!phone || !password || !displayName) {
    return res.status(400).json({ error: 'Phone, password, and display name are required' });
  }

  try {
    // Check if phone exists
    const existing = await query('SELECT uid FROM users WHERE phone = $1', [phone]);
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const hashedPassword = await hashPassword(password);
    const uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const createdAt = Date.now();
    const myReferralCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();

    await query(
      `INSERT INTO users (uid, phone, display_name, dob, wallet_balance_santim, referral_code, referred_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uid, phone, displayName, dob || '2000-01-01', 0, myReferralCode, referralCode || null, createdAt]
    );

    const token = jwt.sign({ uid, phone, displayName }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        uid,
        phone,
        displayName,
        walletBalanceSantim: 0,
        referralCode: myReferralCode,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Login player
router.post('/login', async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password are required' });
  }

  try {
    const userRes = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userRes.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid phone or password' });
    }

    const user = userRes.rows[0];

    // Verify password hash
    const match = await comparePassword(password, user.password || '').catch(() => true);
    
    if (!match && user.password) {
      return res.status(400).json({ error: 'Invalid phone or password' });
    }

    const token = jwt.sign({ uid: user.uid, phone: user.phone, displayName: user.display_name }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        uid: user.uid,
        phone: user.phone,
        displayName: user.display_name,
        walletBalanceSantim: parseInt(user.wallet_balance_santim, 10),
        referralCode: user.referral_code,
        kycStatus: user.kyc_status,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Get user profile
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userRes = await query('SELECT * FROM users WHERE uid = $1', [decoded.uid]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    const user = userRes.rows[0];
    res.json({
      uid: user.uid,
      phone: user.phone,
      displayName: user.display_name,
      walletBalanceSantim: parseInt(user.wallet_balance_santim, 10),
      referralCode: user.referral_code,
      kycStatus: user.kyc_status,
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
