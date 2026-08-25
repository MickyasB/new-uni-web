import https from 'https';
import { ManualDepositRecord } from '@bingo/shared';

export interface TelegramConfig {
  botToken: string;
  adminChatId: string;
  allowedAdminIds?: string[];
}

export class TelegramBotService {
  private static getBotToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  }

  private static getAdminChatId(): string {
    return process.env.TELEGRAM_ADMIN_CHAT_ID || '';
  }

  private static getAllowedAdminIds(): string[] {
    const raw = process.env.TELEGRAM_ALLOWED_ADMIN_IDS || '';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  /**
   * Helper to send HTTPS requests to Telegram Bot API
   */
  private static async callTelegramApi(method: string, payload: any): Promise<any> {
    const token = this.getBotToken();
    if (!token) {
      console.warn('[TelegramBotService] TELEGRAM_BOT_TOKEN is not configured.');
      return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
    }

    return new Promise((resolve) => {
      const data = JSON.stringify(payload);
      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/${method}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let resBody = '';
        res.on('data', (chunk) => {
          resBody += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resBody);
            resolve(parsed);
          } catch (e) {
            resolve({ ok: false, error: resBody });
          }
        });
      });

      req.on('error', (err) => {
        console.error('[TelegramBotService] HTTP error:', err.message);
        resolve({ ok: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Telegram API request timeout' });
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Dispatches a new deposit request alert to the Admin Telegram chat with inline action buttons
   */
  static async sendDepositNotification(deposit: ManualDepositRecord): Promise<{ messageId?: string; chatId?: string; success: boolean }> {
    const chatId = this.getAdminChatId();
    if (!chatId || !this.getBotToken()) {
      console.log('[TelegramBotService] Telegram bot or admin chat not configured, skipping dispatch.');
      return { success: false };
    }

    const gatewayName = deposit.gateway === 'telebirr' ? '📱 Telebirr' : '🏦 CBE / CBE Birr';
    const amountFormatted = `${deposit.amountEtb.toFixed(2)} ETB`;
    const ocrStatus = deposit.ocrConfidence && deposit.ocrConfidence > 60 ? `✅ High (${deposit.ocrConfidence}%)` : `⚠️ Manual Check (${deposit.ocrConfidence || 0}%)`;

    const caption = [
      `🚨 <b>NEW DEPOSIT VERIFICATION REQUEST</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🆔 <b>Request ID:</b> <code>${deposit.id}</code>`,
      `👤 <b>Player:</b> ${deposit.displayName || 'Player'} (${deposit.phone || deposit.userId})`,
      `💳 <b>Gateway:</b> ${gatewayName}`,
      `🔢 <b>FT / Tx Number:</b> <code>${deposit.ftNumber}</code> <i>(tap to copy)</i>`,
      `💵 <b>Amount:</b> <b>${amountFormatted}</b> (${deposit.amountSantim.toLocaleString()} Santim)`,
      `🤖 <b>OCR Match:</b> ${ocrStatus}`,
      `📅 <b>Submitted At:</b> ${new Date(deposit.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })} (EAT)`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `👇 <i>Tap below to approve or reject instantly:</i>`,
    ].join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: `✅ Approve (${amountFormatted})`, callback_data: `dep_approve:${deposit.id}` },
          { text: '❌ Reject', callback_data: `dep_reject:${deposit.id}` },
        ],
        [
          { text: '🔍 View In Admin Web', url: `${process.env.ADMIN_URL || 'http://localhost:3000'}/#/deposits` },
        ],
      ],
    };

    let result;
    if (deposit.receiptImageUrl && deposit.receiptImageUrl.startsWith('http')) {
      // Send photo with caption
      result = await this.callTelegramApi('sendPhoto', {
        chat_id: chatId,
        photo: deposit.receiptImageUrl,
        caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });
    } else {
      // Send formatted text message
      result = await this.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });
    }

    if (result && result.ok && result.result) {
      return {
        messageId: String(result.result.message_id),
        chatId: String(result.result.chat?.id || chatId),
        success: true,
      };
    }

    return { success: false };
  }

  /**
   * Updates an existing Telegram notification message after approval or rejection
   */
  static async updateDepositMessageStatus(
    chatId: string,
    messageId: string,
    deposit: ManualDepositRecord,
    status: 'approved' | 'rejected',
    adminUsername: string
  ): Promise<boolean> {
    if (!chatId || !messageId || !this.getBotToken()) return false;

    const gatewayName = deposit.gateway === 'telebirr' ? '📱 Telebirr' : '🏦 CBE / CBE Birr';
    const amountFormatted = `${deposit.amountEtb.toFixed(2)} ETB`;
    const statusHeader = status === 'approved' ? '✅ <b>DEPOSIT APPROVED & CREDITED</b>' : '❌ <b>DEPOSIT REJECTED</b>';
    const processedTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' });

    const newText = [
      statusHeader,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🆔 <b>Request ID:</b> <code>${deposit.id}</code>`,
      `👤 <b>Player:</b> ${deposit.displayName || 'Player'} (${deposit.phone || deposit.userId})`,
      `💳 <b>Gateway:</b> ${gatewayName}`,
      `🔢 <b>FT / Tx Number:</b> <code>${deposit.ftNumber}</code>`,
      `💵 <b>Amount:</b> <b>${amountFormatted}</b>`,
      `🛡️ <b>Processed By:</b> @${adminUsername}`,
      `⏰ <b>Processed At:</b> ${processedTime} (EAT)`,
      deposit.rejectionReason ? `⚠️ <b>Reason:</b> ${deposit.rejectionReason}` : `💰 <b>Wallet Balance:</b> Credited atomically`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
    ].join('\n');

    // Try editMessageCaption (if it was a photo) or editMessageText (if text)
    let res = await this.callTelegramApi('editMessageCaption', {
      chat_id: chatId,
      message_id: parseInt(messageId, 10),
      caption: newText,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [] }, // Remove action buttons
    });

    if (!res || !res.ok) {
      res = await this.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: parseInt(messageId, 10),
        text: newText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [] },
      });
    }

    return !!(res && res.ok);
  }

  /**
   * Answers a Telegram Callback Query to provide immediate tactile UI feedback
   */
  static async answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false): Promise<void> {
    await this.callTelegramApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    });
  }

  /**
   * Validates whether a Telegram user is authorized to perform admin actions
   */
  static isAuthorizedAdmin(telegramUserId: string | number): boolean {
    const allowed = this.getAllowedAdminIds();
    if (allowed.length === 0) return true; // If list is empty, all members of admin chat are allowed
    return allowed.includes(String(telegramUserId));
  }
}
