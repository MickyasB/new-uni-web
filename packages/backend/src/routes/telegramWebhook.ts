import { Router, Request, Response } from 'express';
import { TelegramBotService } from '../services/telegramBotService';
import { PaymentVerificationService } from '../services/paymentVerification';

const router = Router();

// ─── POST /webhook ─────────────────────────────────────────────────────────────
// Handles Telegram Webhook callbacks (inline button clicks, slash commands)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    if (!update) return res.sendStatus(200);

    // Handle Callback Queries (Inline button clicks)
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = cq.data || '';
      const from = cq.from || {};
      const username = from.username || from.first_name || String(from.id);

      // Check admin authorization
      if (!TelegramBotService.isAuthorizedAdmin(from.id)) {
        await TelegramBotService.answerCallbackQuery(cq.id, '⛔ You are not authorized to approve deposits.', true);
        return res.sendStatus(200);
      }

      if (data.startsWith('dep_approve:')) {
        const depositId = data.replace('dep_approve:', '');
        const result = await PaymentVerificationService.approveDeposit(depositId, `@${username}`);

        if (result.success) {
          await TelegramBotService.answerCallbackQuery(cq.id, `✅ Approved & Credited!`, false);
        } else {
          await TelegramBotService.answerCallbackQuery(cq.id, `⚠️ Error: ${result.error}`, true);
        }
      } else if (data.startsWith('dep_reject:')) {
        const depositId = data.replace('dep_reject:', '');
        const result = await PaymentVerificationService.rejectDeposit(depositId, `@${username}`, 'Rejected via Telegram Admin Bot');

        if (result.success) {
          await TelegramBotService.answerCallbackQuery(cq.id, `❌ Deposit Rejected.`, false);
        } else {
          await TelegramBotService.answerCallbackQuery(cq.id, `⚠️ Error: ${result.error}`, true);
        }
      }
    }

    res.sendStatus(200);
  } catch (err: any) {
    console.error('[TelegramWebhook] Error handling update:', err);
    res.sendStatus(200); // Always return 200 to Telegram so it doesn't endlessly retry
  }
});

// ─── GET /test-alert ────────────────────────────────────────────────────────────
// Helper to test if Telegram Bot alerts are properly configured
router.get('/test-alert', async (req: Request, res: Response) => {
  try {
    const result = await TelegramBotService.sendDepositNotification({
      id: 'dep_test_' + Date.now(),
      userId: 'usr_test_123',
      displayName: 'Test Player',
      phone: '+251911223344',
      gateway: 'cbe',
      ftNumber: 'FT24082599999',
      amountEtb: 100,
      amountSantim: 10000,
      ocrConfidence: 95,
      status: 'pending',
      createdAt: Date.now(),
    });

    res.json({ success: result.success, message: result.success ? 'Test alert sent to Telegram!' : 'Failed to send alert (check TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID)' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
