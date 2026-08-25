import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';
import { OCRService } from '../services/ocrService';
import { PaymentVerificationService } from '../services/paymentVerification';
import { query } from '../db';

const router = Router();

// ─── POST /ocr-scan ─────────────────────────────────────────────────────────────
// Scans an uploaded screenshot (base64) or SMS text and extracts FT number, amount, etc.
router.post('/ocr-scan', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { imageBase64, text } = req.body;
    if (!imageBase64 && !text) {
      return res.status(400).json({ error: 'imageBase64 or text is required' });
    }

    let parsedResult;
    if (imageBase64) {
      parsedResult = await OCRService.processImage(imageBase64);
    } else {
      parsedResult = OCRService.parseText(text);
    }

    res.json({
      success: true,
      data: parsedResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'OCR processing failed' });
  }
});

// ─── POST /submit ───────────────────────────────────────────────────────────────
// Player submits manual deposit confirmation (Telebirr or CBE)
router.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { gateway, ftNumber, amountEtb, payerName, payerPhone, receiptImageUrl, ocrRawText, ocrConfidence } = req.body;

    if (!gateway || !ftNumber || !amountEtb) {
      return res.status(400).json({ error: 'gateway, ftNumber, and amountEtb are required' });
    }

    const result = await PaymentVerificationService.submitDeposit({
      userId: uid,
      gateway,
      ftNumber,
      amountEtb: parseFloat(amountEtb),
      payerName,
      payerPhone,
      receiptImageUrl,
      ocrRawText,
      ocrConfidence,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      deposit: result.deposit,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /status/:id ───────────────────────────────────────────────────────────
// Check current status of a submitted deposit
router.get('/status/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const uid = req.user!.uid;

    const result = await query(
      'SELECT id, gateway, ft_number, amount_etb, amount_santim, status, rejection_reason, created_at, processed_at FROM manual_deposits WHERE id = $1 AND user_id = $2',
      [id, uid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Deposit request not found' });
    }

    res.json({
      success: true,
      deposit: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /my-deposits ──────────────────────────────────────────────────────────
// List recent deposits for the current user
router.get('/my-deposits', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const result = await query(
      'SELECT * FROM manual_deposits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [uid]
    );

    res.json({
      success: true,
      deposits: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN ROUTES ──────────────────────────────────────────────────────────────

// GET /pending (Admin only)
router.get('/pending', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT d.*, u.display_name, u.phone 
       FROM manual_deposits d 
       LEFT JOIN users u ON d.user_id = u.uid 
       WHERE d.status = 'pending' 
       ORDER BY d.created_at ASC LIMIT 50`
    );

    res.json({
      success: true,
      deposits: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/approve (Admin only)
router.post('/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!.uid;

    const result = await PaymentVerificationService.approveDeposit(id, adminUser);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/reject (Admin only)
router.post('/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUser = req.user!.uid;

    const result = await PaymentVerificationService.rejectDeposit(id, adminUser, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
