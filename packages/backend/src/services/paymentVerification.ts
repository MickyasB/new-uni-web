import crypto from 'crypto';
import { ManualDepositRecord } from '@bingo/shared';
import { query, getClient } from '../db';
import { TelegramBotService } from './telegramBotService';

export class PaymentVerificationService {
  /**
   * Submits a manual deposit request with FT number and optional receipt screenshot
   */
  static async submitDeposit(params: {
    userId: string;
    gateway: 'telebirr' | 'cbe' | 'cbe_birr';
    ftNumber: string;
    amountEtb: number;
    payerName?: string;
    payerPhone?: string;
    receiptImageUrl?: string;
    ocrRawText?: string;
    ocrConfidence?: number;
  }): Promise<{ success: boolean; deposit?: ManualDepositRecord; error?: string }> {
    const { userId, gateway, ftNumber, amountEtb, payerName, payerPhone, receiptImageUrl, ocrRawText, ocrConfidence } = params;

    const cleanFt = ftNumber ? ftNumber.trim().toUpperCase() : '';
    if (!cleanFt) {
      return { success: false, error: 'FT / Transaction number is required' };
    }
    if (!amountEtb || amountEtb <= 0 || amountEtb > 500000) {
      return { success: false, error: 'Invalid deposit amount' };
    }

    const amountSantim = Math.round(amountEtb * 100);
    const id = `dep_${crypto.randomUUID().slice(0, 12)}`;
    const now = Date.now();

    try {
      // 1. Anti-fraud check: Ensure FT number has never been submitted before
      const existingFt = await query('SELECT id, status, created_at FROM manual_deposits WHERE ft_number = $1', [cleanFt]);
      if (existingFt.rowCount && existingFt.rowCount > 0) {
        return {
          success: false,
          error: `Transaction Reference / FT Number (${cleanFt}) has already been submitted and cannot be reused.`,
        };
      }

      // 2. Fetch user display info for the notification
      const userRes = await query('SELECT display_name, phone FROM users WHERE uid = $1', [userId]);
      const displayName = userRes.rowCount ? userRes.rows[0].display_name : 'Player';
      const phone = userRes.rowCount ? userRes.rows[0].phone : undefined;

      // 3. Insert record into database
      await query(
        `INSERT INTO manual_deposits (
          id, user_id, gateway, ft_number, amount_etb, amount_santim,
          payer_name, payer_phone, receipt_image_url, ocr_raw_text,
          ocr_confidence, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          userId,
          gateway,
          cleanFt,
          amountEtb,
          amountSantim,
          payerName || null,
          payerPhone || phone || null,
          receiptImageUrl || null,
          ocrRawText || null,
          ocrConfidence || 0,
          'pending',
          now,
        ]
      );

      const depositRecord: ManualDepositRecord = {
        id,
        userId,
        displayName,
        phone,
        gateway,
        ftNumber: cleanFt,
        amountEtb,
        amountSantim,
        payerName,
        payerPhone,
        receiptImageUrl,
        ocrRawText,
        ocrConfidence,
        status: 'pending',
        createdAt: now,
      };

      // 4. Send Telegram Notification to Admin
      try {
        const tgRes = await TelegramBotService.sendDepositNotification(depositRecord);
        if (tgRes.success && tgRes.messageId && tgRes.chatId) {
          await query(
            'UPDATE manual_deposits SET telegram_message_id = $1, telegram_chat_id = $2 WHERE id = $3',
            [tgRes.messageId, tgRes.chatId, id]
          );
          depositRecord.telegramMessageId = tgRes.messageId;
          depositRecord.telegramChatId = tgRes.chatId;
        }
      } catch (tgErr) {
        console.warn('[PaymentVerificationService] Telegram notification failed:', tgErr);
      }

      return { success: true, deposit: depositRecord };
    } catch (err: any) {
      console.error('[PaymentVerificationService] Error submitting deposit:', err);
      return { success: false, error: err.message || 'Database error processing deposit' };
    }
  }

  /**
   * Approves a manual deposit, credits the user's wallet atomically, and logs the ledger entry
   */
  static async approveDeposit(depositId: string, processedBy: string): Promise<{ success: boolean; error?: string }> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Lock deposit record for update
      const depRes = await client.query('SELECT * FROM manual_deposits WHERE id = $1 FOR UPDATE', [depositId]);
      if (depRes.rowCount === 0) {
        throw new Error('Deposit request not found');
      }

      const deposit = depRes.rows[0];
      if (deposit.status !== 'pending') {
        throw new Error(`Deposit already processed with status: ${deposit.status}`);
      }

      const amountSantim = parseInt(deposit.amount_santim, 10);
      const userId = deposit.user_id;

      // 2. Lock user wallet balance and update
      const userRes = await client.query('SELECT wallet_balance_santim, display_name, phone FROM users WHERE uid = $1 FOR UPDATE', [userId]);
      if (userRes.rowCount === 0) {
        throw new Error('Associated user not found');
      }

      const currentBalance = parseInt(userRes.rows[0].wallet_balance_santim, 10);
      const newBalance = currentBalance + amountSantim;

      await client.query('UPDATE users SET wallet_balance_santim = $1 WHERE uid = $2', [newBalance, userId]);

      // 3. Insert ledger entry
      const ledgerId = `led_${crypto.randomUUID().slice(0, 12)}`;
      const now = Date.now();
      await client.query(
        `INSERT INTO wallet_ledger (id, user_id, type, amount_santim, balance_santim, gateway, transaction_id, created_at)
         VALUES ($1, $2, 'deposit', $3, $4, $5, $6, $7)`,
        [ledgerId, userId, amountSantim, newBalance, deposit.gateway, deposit.ft_number, now]
      );

      // 4. Mark deposit as approved
      await client.query(
        `UPDATE manual_deposits SET status = 'approved', processed_by = $1, processed_at = $2 WHERE id = $3`,
        [processedBy, now, depositId]
      );

      // 5. Commit transaction
      await client.query('COMMIT');

      // 6. Update Telegram Bot message if message_id exists
      if (deposit.telegram_message_id && deposit.telegram_chat_id) {
        const fullRecord: ManualDepositRecord = {
          id: deposit.id,
          userId: deposit.user_id,
          displayName: userRes.rows[0].display_name,
          phone: userRes.rows[0].phone,
          gateway: deposit.gateway,
          ftNumber: deposit.ft_number,
          amountEtb: parseFloat(deposit.amount_etb),
          amountSantim,
          status: 'approved',
          createdAt: parseInt(deposit.created_at, 10),
        };
        TelegramBotService.updateDepositMessageStatus(
          deposit.telegram_chat_id,
          deposit.telegram_message_id,
          fullRecord,
          'approved',
          processedBy
        ).catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[PaymentVerificationService] Approval error:', err);
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  }

  /**
   * Rejects a manual deposit request
   */
  static async rejectDeposit(depositId: string, processedBy: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const depRes = await query('SELECT * FROM manual_deposits WHERE id = $1', [depositId]);
      if (depRes.rowCount === 0) {
        return { success: false, error: 'Deposit request not found' };
      }

      const deposit = depRes.rows[0];
      if (deposit.status !== 'pending') {
        return { success: false, error: `Deposit already processed with status: ${deposit.status}` };
      }

      const now = Date.now();
      await query(
        `UPDATE manual_deposits SET status = 'rejected', rejection_reason = $1, processed_by = $2, processed_at = $3 WHERE id = $4`,
        [reason || 'Verification rejected by admin', processedBy, now, depositId]
      );

      // Update Telegram Bot message
      if (deposit.telegram_message_id && deposit.telegram_chat_id) {
        const fullRecord: ManualDepositRecord = {
          id: deposit.id,
          userId: deposit.user_id,
          gateway: deposit.gateway,
          ftNumber: deposit.ft_number,
          amountEtb: parseFloat(deposit.amount_etb),
          amountSantim: parseInt(deposit.amount_santim, 10),
          status: 'rejected',
          rejectionReason: reason,
          createdAt: parseInt(deposit.created_at, 10),
        };
        TelegramBotService.updateDepositMessageStatus(
          deposit.telegram_chat_id,
          deposit.telegram_message_id,
          fullRecord,
          'rejected',
          processedBy
        ).catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      console.error('[PaymentVerificationService] Rejection error:', err);
      return { success: false, error: err.message };
    }
  }
}
