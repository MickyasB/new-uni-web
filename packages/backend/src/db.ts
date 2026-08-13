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
  platform_config: Record<string, any>;
}

function loadStore(): LocalStore {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      // ignore
    }
  }
  return {
    users: {},
    rooms: {
      'room-bronze-default': {
        id: 'room-bronze-default',
        tier: 'bronze',
        entry_fee_santim: 1000,
        mode: 'auto',
        type: 'open',
        min_players: 2,
        max_cards: 6,
        status: 'waiting',
        player_count: 0,
        pot_santim: 0,
        created_at: Date.now()
      },
      'room-silver-default': {
        id: 'room-silver-default',
        tier: 'silver',
        entry_fee_santim: 5000,
        mode: 'auto',
        type: 'open',
        min_players: 3,
        max_cards: 6,
        status: 'waiting',
        player_count: 0,
        pot_santim: 0,
        created_at: Date.now()
      }
    },
    games: {},
    bingo_cards: {},
    wallet_ledger: {},
    flagged_wins: {},
    withdrawal_requests: {},
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
      const list = Object.values(store.rooms);
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

  if (upperSql.startsWith('INSERT INTO ROOMS')) {
    if (params) {
      const [id, tier, fee, mode, type, minP, maxC, status, count, pot, createdAt] = params;
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
        created_at: createdAt || Date.now()
      };
      store.rooms[id] = newRoom;
      saveStore(store);
      return { rows: [newRoom], rowCount: 1 };
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
