// server/telegram-notify.js — Administrative Notification Service for Telegram
// Sends summary alerts for new registrations or applications (strictly non-sensitive data).

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8613266324:AAH_XyegD48W-Yx9_aC_MKl5OgZ1cT9fd9M';
let cachedChatId = process.env.TELEGRAM_CHAT_ID || '';

/**
 * Fetch latest chat ID dynamically from bot updates if not pre-configured
 */
async function resolveChatId() {
  if (cachedChatId) return cachedChatId;

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
    const data = await res.json();
    if (data.ok && data.result && data.result.length > 0) {
      // Find the most recent message with a chat id
      for (let i = data.result.length - 1; i >= 0; i--) {
        const item = data.result[i];
        const chat = item.message?.chat || item.callback_query?.message?.chat || item.my_chat_member?.chat;
        if (chat && chat.id) {
          cachedChatId = String(chat.id);
          console.log(`[Telegram Alert] Auto-detected active Telegram Chat ID: ${cachedChatId}`);
          return cachedChatId;
        }
      }
    }
  } catch (err) {
    console.warn('[Telegram Alert] Error resolving dynamic chat ID:', err.message);
  }
  return null;
}

/**
 * Send an administrative notification message to the configured Telegram chat.
 * @param {Object} details - Summary details (Name, Email, Country, Phone, Event)
 */
export async function sendTelegramAdminAlert({ fullName, email, country, phone, eventType = 'New User Registration' }) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[Telegram Alert] No Bot Token configured.');
    return false;
  }

  const chatId = await resolveChatId();
  if (!chatId) {
    console.log('[Telegram Alert] ⚠️ No active Telegram chat detected yet.');
    console.log('[Telegram Alert] To connect your Telegram account:');
    console.log('1. Open Telegram and search for your bot.');
    console.log('2. Send "/start" or any message to your bot.');
    console.log('3. The server will auto-link your chat and send notifications.');
    return false;
  }

  const messageText = `
🎓 <b>University of Edinburgh Portal Alert</b>
<b>Event:</b> ${escapeHtml(eventType)}
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Candidate Name:</b> ${escapeHtml(fullName || 'N/A')}
📧 <b>Email:</b> ${escapeHtml(email || 'N/A')}
🌍 <b>Country:</b> ${escapeHtml(country || 'N/A')}
📞 <b>Phone:</b> ${escapeHtml(phone || 'N/A')}
⏱️ <b>Timestamp:</b> ${new Date().toUTCString()}
━━━━━━━━━━━━━━━━━━━━━
🏛️ <i>View full application details in the Admin Portal (/#/admin)</i>
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    if (data.ok) {
      console.log(`[Telegram Alert] ✅ Notification delivered to Chat ${chatId} for: ${email}`);
      return true;
    } else {
      console.warn(`[Telegram Alert] ⚠️ Telegram API error:`, data.description);
      return false;
    }
  } catch (error) {
    console.error(`[Telegram Alert] ❌ Failed to dispatch message:`, error.message);
    return false;
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default { sendTelegramAdminAlert };
