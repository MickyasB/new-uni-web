import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Simple file-backed JSON store as fallback if MySQL fails
const DB_FILE = path.join(process.cwd(), 'bingo_db_store.json');

interface LocalStore {
  users: Record<string, any>;
  rooms: Record<string, any>;
  games: Record<string, any>;
  bingo_cards: Record<string, any>;
  wallet_ledger: Record<string, any>;
  flagged_wins: Record<string, any>;
  withdrawal_requests: Record<string, any>;
  manual_deposits: Record<string, any>;
  platform_config: Record<string, any>;
}

function loadStore(): LocalStore {
  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (!parsed.manual_deposits) parsed.manual_deposits = {};
      return parsed;
    } catch (e) {
      // ignore
    }
  }
  return {
    users: {},
    rooms: {
      'room-classic-hall': {
        id: 'room-classic-hall',
        tier: 'silver',
        entry_fee_santim: 1000,
        mode: 'auto',
        type: 'open',
        min_players: 2,
        max_cards: 6,
        status: 'waiting',
        player_count: 3,
        pot_santim: 5000,
        created_at: Date.now()
      },
      'room-gold-lounge': {
        id: 'room-gold-lounge',
        tier: 'gold',
        entry_fee_santim: 5000,
        mode: 'auto',
        type: 'open',
        min_players: 3,
        max_cards: 6,
        status: 'waiting',
        player_count: 5,
        pot_santim: 25000,
        created_at: Date.now()
      }
    },
    games: {},
    bingo_cards: {},
    wallet_ledger: {},
    flagged_wins: {},
    withdrawal_requests: {},
    manual_deposits: {},
    platform_config: {
      global: {
        key: 'global',
        value: JSON.stringify({ killSwitchEnabled: false, winSlaMinutes: 30 }),
        updated_at: Date.now()
      }
    }
  };
}

function saveStore(store: LocalStore) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('[Fallback DB] Save error:', e);
  }
}

let store = loadStore();
let useFallback = false;

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'gymtragh_bingo',
  password: process.env.DB_PASS || 'Gym@2026',
  database: process.env.DB_NAME || 'gymtragh_bingo',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function convertPgQueryToMysql(text: string): string {
  return text.replace(/\$(\d+)/g, '?');
}

export async function query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
  if (!useFallback) {
    try {
      const mysqlSql = convertPgQueryToMysql(text);
      const [rows] = await pool.query(mysqlSql, params || []);
      const list = Array.isArray(rows) ? (rows as any[]) : [rows];
      return { rows: list, rowCount: list.length };
    } catch (err: any) {
      console.warn('[DB] MySQL query failed, activating local file fallback store. Error:', err.message);
      useFallback = true;
    }
  }

  // Fallback memory/file execution
  const sql = text.trim();
  const upperSql = sql.toUpperCase();

  if (upperSql.startsWith('SELECT')) {
    if (upperSql.includes('FROM ROOMS')) {
      let list = Object.values(store.rooms);
      if (params && params.length > 0) {
        const val = params[0];
        list = list.filter((r: any) => r.id === val);
      }
      return { rows: list, rowCount: list.length };
    }
    if (upperSql.includes('FROM USERS')) {
      if (params && params.length > 0) {
        const val = params[0];
        const list = Object.values(store.users).filter(
          u => u.phone === val || u.uid === val
        );
        return { rows: list, rowCount: list.length };
      }
      const list = Object.values(store.users);
      return { rows: list, rowCount: list.length };
    }
    if (upperSql.includes('FROM PLATFORM_CONFIG')) {
      const list = Object.values(store.platform_config);
      return { rows: list, rowCount: list.length };
    }
    if (upperSql.includes('FROM WALLET_LEDGER')) {
      const list = Object.values(store.wallet_ledger);
      return { rows: list, rowCount: list.length };
    }
    if (upperSql.includes('FROM FLAGGED_WINS')) {
      const list = Object.values(store.flagged_wins);
      return { rows: list, rowCount: list.length };
    }
    if (upperSql.includes('FROM WITHDRAWAL_REQUESTS')) {
      const list = Object.values(store.withdrawal_requests);
      return { rows: list, rowCount: list.length };
    }
    if (upperSql.includes('FROM GAMES')) {
      let list = Object.values(store.games || {});
      if (params && params.length > 0) {
        const val = params[0];
        list = list.filter((g: any) => g.id === val || g.room_id === val || g.roomId === val);
      }
      return { rows: list, rowCount: list.length };
    }
    if (upperSql.includes('FROM BINGO_CARDS')) {
      let list = Object.values(store.bingo_cards || {});
      if (params && params.length > 0) {
        const val = params[0];
        list = list.filter((c: any) => c.id === val || c.room_id === val || c.roomId === val);
      }
      return { rows: list, rowCount: list.length };
    }
    if (upperSql.includes('FROM MANUAL_DEPOSITS')) {
      let list = Object.values(store.manual_deposits || {});
      if (params && params.length > 0) {
        const val = params[0];
        if (upperSql.includes('FT_NUMBER =')) {
          list = list.filter((d: any) => d.ft_number === val || d.ftNumber === val);
        } else if (upperSql.includes('ID =')) {
          list = list.filter((d: any) => d.id === val);
        } else if (upperSql.includes('USER_ID =')) {
          list = list.filter((d: any) => d.user_id === val || d.userId === val);
        }
      }
      if (upperSql.includes("STATUS = 'PENDING'")) {
        list = list.filter((d: any) => d.status === 'pending');
      }
      return { rows: list, rowCount: list.length };
    }
    return { rows: [], rowCount: 0 };
  }

  if (upperSql.startsWith('INSERT INTO USERS')) {
    if (params) {
      const [uid, phone, displayName, dob, walletBalance, refCode, refBy, createdAt] = params;
      const newUser = {
        uid,
        phone,
        display_name: displayName,
        dob,
        wallet_balance_santim: walletBalance || 100000,
        referral_code: refCode,
        referred_by: refBy,
        kyc_status: 'verified',
        role: 'player',
        created_at: createdAt || Date.now()
      };
      store.users[uid] = newUser;
      saveStore(store);
      return { rows: [newUser], rowCount: 1 };
    }
  }

  if (upperSql.startsWith('INSERT INTO MANUAL_DEPOSITS')) {
    if (params) {
      const [id, userId, gateway, ftNumber, amountEtb, amountSantim, payerName, payerPhone, receiptImageUrl, ocrRawText, ocrConfidence, status, createdAt] = params;
      const newDep = {
        id,
        user_id: userId,
        gateway,
        ft_number: ftNumber,
        amount_etb: amountEtb,
        amount_santim: amountSantim,
        payer_name: payerName,
        payer_phone: payerPhone,
        receipt_image_url: receiptImageUrl,
        ocr_raw_text: ocrRawText,
        ocr_confidence: ocrConfidence,
        status: status || 'pending',
        created_at: createdAt || Date.now()
      };
      if (!store.manual_deposits) store.manual_deposits = {};
      store.manual_deposits[id] = newDep;
      saveStore(store);
      return { rows: [newDep], rowCount: 1 };
    }
  }

  if (upperSql.startsWith('INSERT INTO WALLET_LEDGER')) {
    if (params) {
      const [id, userId, type, amountSantim, balanceSantim, gateway, txId, createdAt] = params;
      const newEntry = {
        id,
        user_id: userId,
        type,
        amount_santim: amountSantim,
        balance_santim: balanceSantim,
        gateway,
        transaction_id: txId,
        created_at: createdAt || Date.now()
      };
      store.wallet_ledger[id] = newEntry;
      saveStore(store);
      return { rows: [newEntry], rowCount: 1 };
    }
  }

  if (upperSql.startsWith('UPDATE USERS SET WALLET_BALANCE_SANTIM')) {
    if (params) {
      const [newBalance, uid] = params;
      if (store.users[uid]) {
        store.users[uid].wallet_balance_santim = newBalance;
        saveStore(store);
        return { rows: [store.users[uid]], rowCount: 1 };
      }
    }
  }

  if (upperSql.startsWith('UPDATE MANUAL_DEPOSITS')) {
    if (params && params.length >= 2) {
      const id = params[params.length - 1];
      if (store.manual_deposits && store.manual_deposits[id]) {
        if (upperSql.includes("STATUS = 'APPROVED'")) {
          store.manual_deposits[id].status = 'approved';
          store.manual_deposits[id].processed_by = params[0];
          store.manual_deposits[id].processed_at = params[1];
        } else if (upperSql.includes("STATUS = 'REJECTED'")) {
          store.manual_deposits[id].status = 'rejected';
          store.manual_deposits[id].rejection_reason = params[0];
          store.manual_deposits[id].processed_by = params[1];
          store.manual_deposits[id].processed_at = params[2];
        } else if (upperSql.includes('TELEGRAM_MESSAGE_ID')) {
          store.manual_deposits[id].telegram_message_id = params[0];
          store.manual_deposits[id].telegram_chat_id = params[1];
        }
        saveStore(store);
        return { rows: [store.manual_deposits[id]], rowCount: 1 };
      }
    }
  }

  if (upperSql.startsWith('INSERT INTO GAMES')) {
    if (params) {
      const [id, roomId, seedHash, sequence, calledNumbers, status, lastIndex, winners, blockedCards, createdAt] = params;
      const newGame = {
        id,
        room_id: roomId,
        seed_hash: seedHash,
        sequence,
        called_numbers: calledNumbers || '[]',
        status: status || 'active',
        last_processed_index: lastIndex || 0,
        winners: winners || '[]',
        blocked_cards: blockedCards || '[]',
        created_at: createdAt || Date.now(),
      };
      if (!store.games) store.games = {};
      store.games[id] = newGame;
      saveStore(store);
      return { rows: [newGame], rowCount: 1 };
    }
  }

  if (upperSql.startsWith('INSERT INTO BINGO_CARDS')) {
    if (params) {
      const [id, roomId, userId, fingerprint, numbersJson, createdAt] = params;
      const newCard = {
        id,
        room_id: roomId,
        user_id: userId,
        fingerprint,
        numbers_json: numbersJson,
        created_at: createdAt || Date.now(),
      };
      if (!store.bingo_cards) store.bingo_cards = {};
      store.bingo_cards[id] = newCard;
      saveStore(store);
      return { rows: [newCard], rowCount: 1 };
    }
  }

  if (upperSql.startsWith('UPDATE GAMES')) {
    if (params && params.length >= 2) {
      const gameId = params[params.length - 1];
      if (store.games && store.games[gameId]) {
        if (upperSql.includes('BLOCKED_CARDS =')) {
          store.games[gameId].blocked_cards = params[0];
        } else if (upperSql.includes('CALLED_NUMBERS =')) {
          store.games[gameId].called_numbers = params[0];
        } else if (upperSql.includes('WINNERS =')) {
          store.games[gameId].winners = params[0];
          store.games[gameId].status = 'completed';
        }
        saveStore(store);
        return { rows: [store.games[gameId]], rowCount: 1 };
      }
    }
  }

  if (upperSql.startsWith('INSERT INTO ROOMS')) {
    if (params) {
      const [id, tier, fee, mode, type, minP, maxC, status, count, pot, createdAt, patternId] = params;
      const newRoom = {
        id,
        tier,
        entry_fee_santim: fee,
        mode: mode || 'auto',
        type: type || 'open',
        min_players: minP || 2,
        max_cards: maxC || 6,
        status: status || 'waiting',
        player_count: count || 0,
        pot_santim: pot || 0,
        pattern_id: patternId || 'horizontal_line',
        created_at: createdAt || Date.now()
      };
      store.rooms[id] = newRoom;
      saveStore(store);
      return { rows: [newRoom], rowCount: 1 };
    }
  }

  if (upperSql.startsWith('UPDATE ROOMS')) {
    if (params && params.length >= 2) {
      const roomId = params[params.length - 1];
      if (store.rooms && store.rooms[roomId]) {
        if (upperSql.includes('PATTERN_ID =')) {
          store.rooms[roomId].pattern_id = params[0];
        } else if (upperSql.includes("STATUS = 'ENDED'")) {
          store.rooms[roomId].status = 'ended';
        }
        saveStore(store);
        return { rows: [store.rooms[roomId]], rowCount: 1 };
      }
    }
  }

  return { rows: [], rowCount: 0 };
}

export async function getClient() {
  return {
    query: async (text: string, params?: any[]) => query(text, params),
    release: () => {},
  };
}

export async function initDb() {
  console.log('[DB] Database module initialized with auto-fallback.');
}
