/**
 * Centralized Platform Data Engine & Store
 * Features:
 * - 0-based persistent state
 * - Real-time subscribers
 * - 3-day rolling Game History (auto-purged after 72 hours)
 * - User transaction ledger with Pending, Approved, and Rejected states
 * - Admin entry fee and winning price configuration (patterns automated by system)
 */

export interface DbUser {
  uid: string;
  phone: string;
  password?: string;
  displayName: string;
  walletBalanceSantim: number; // in santim (100 santim = 1 ETB)
  referralCode: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  banned: boolean;
  createdAt: string;
  totalDepositsETB: number;
  totalWithdrawalsETB: number;
}

export interface DbDeposit {
  id: string;
  playerId: string;
  playerName: string;
  playerPhone: string;
  amountETB: number;
  ftNumber: string;
  screenshotUrl?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  processedAt?: string;
}

export interface DbWithdrawal {
  id: string;
  playerId: string;
  playerName: string;
  playerPhone: string;
  amountETB: number;
  method: string;
  accountNumber: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  processedAt?: string;
}

export interface DbTransfer {
  id: string;
  senderId: string;
  senderName: string;
  senderPhone: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  amountETB: number;
  note?: string;
  createdAt: string;
  status: 'completed';
}

export interface DbUserTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer_out' | 'transfer_in';
  amountETB: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  method: string;
  reference: string;
  createdAt: string;
  rejectionReason?: string;
  processedAt?: string;
  counterpartName?: string;
  counterpartPhone?: string;
}

export interface DbRoom {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold';
  entryFeeETB: number;
  potETB: number;
  playerCount: number;
  maxPlayers: number;
  minPlayers?: number;
  winningPatternId?: string;
  winningPatternName?: string;
  lastGameResult?: DbGameHistory | null;
  status: 'waiting' | 'active' | 'completed';
  lastStartedAt?: string;
}

export interface DbGameHistory {
  id: string;
  roomId: string;
  roomName: string;
  tier: 'bronze' | 'silver' | 'gold';
  potETB: number;
  entryFeeETB: number;
  winnerId: string;
  winnerName: string;
  winningPatternName: string;
  winningCardId: string;
  calledNumbersCount: number;
  calledNumbers: number[];
  playedAt: string;
  timestamp: number; // Unix timestamp in milliseconds for clean 3-day purge
}

const STORAGE_KEYS = {
  USERS: 'bingo_db_users_v2',
  DEPOSITS: 'bingo_db_deposits_v2',
  WITHDRAWALS: 'bingo_db_withdrawals_v2',
  TRANSFERS: 'bingo_db_transfers_v2',
  ROOMS: 'bingo_db_rooms_v2',
  GAME_HISTORY: 'bingo_db_game_history_v2',
  CURRENT_USER: 'bingo_current_user_session',
  LAST_JOINED_ROOM: 'bingo_last_joined_room',
};

// 3 Days in milliseconds: 3 * 24 * 60 * 60 * 1000 = 259,200,000 ms
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// Initial state starts clean from 0
const DEFAULT_ROOMS: DbRoom[] = [
  {
    id: 'room-classic-hall',
    name: 'Classic Hall',
    tier: 'silver',
    entryFeeETB: 10,
    potETB: 50,
    playerCount: 0,
    maxPlayers: 20,
    status: 'waiting',
  },
  {
    id: 'room-gold-lounge',
    name: 'Gold Lounge',
    tier: 'gold',
    entryFeeETB: 50,
    potETB: 250,
    playerCount: 0,
    maxPlayers: 15,
    status: 'waiting',
  },
];

class DatabaseService {
  private users: DbUser[] = [];
  private deposits: DbDeposit[] = [];
  private withdrawals: DbWithdrawal[] = [];
  private transfers: DbTransfer[] = [];
  private rooms: DbRoom[] = DEFAULT_ROOMS;
  private gameHistory: DbGameHistory[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.load();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('dbService listener error:', e);
      }
    });
  }

  private purgeOldGameHistory(records: DbGameHistory[]): DbGameHistory[] {
    const now = Date.now();
    return records.filter((g) => {
      const age = now - (g.timestamp || new Date(g.playedAt).getTime());
      return age < THREE_DAYS_MS;
    });
  }

  private load() {
    if (typeof window === 'undefined') return;
    try {
      const u = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = u ? JSON.parse(u) : [];

      const d = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
      this.deposits = d ? JSON.parse(d) : [];

      const w = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
      this.withdrawals = w ? JSON.parse(w) : [];

      const tr = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      this.transfers = tr ? JSON.parse(tr) : [];

      const r = localStorage.getItem(STORAGE_KEYS.ROOMS);
      this.rooms = r ? JSON.parse(r) : DEFAULT_ROOMS;

      const gh = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
      const rawHistory: DbGameHistory[] = gh ? JSON.parse(gh) : [];
      this.gameHistory = this.purgeOldGameHistory(rawHistory);
    } catch (e) {
      console.warn('Database load error, initialized with empty state:', e);
      this.users = [];
      this.deposits = [];
      this.withdrawals = [];
      this.transfers = [];
      this.rooms = DEFAULT_ROOMS;
      this.gameHistory = [];
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      this.gameHistory = this.purgeOldGameHistory(this.gameHistory);

      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(this.deposits));
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(this.withdrawals));
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(this.transfers));
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(this.rooms));
      localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(this.gameHistory));
      this.notify();
    } catch (e) {
      console.error('Database save error:', e);
    }
  }

  // ── RESET ALL TO 0 ──
  public resetDatabaseToZero() {
    this.users = [];
    this.deposits = [];
    this.withdrawals = [];
    this.transfers = [];
    this.gameHistory = [];
    this.rooms = [
      {
        id: 'room-classic-hall',
        name: 'Classic Hall',
        tier: 'silver',
        entryFeeETB: 10,
        potETB: 0,
        playerCount: 0,
        maxPlayers: 20,
        status: 'waiting',
      },
      {
        id: 'room-gold-lounge',
        name: 'Gold Lounge',
        tier: 'gold',
        entryFeeETB: 50,
        potETB: 0,
        playerCount: 0,
        maxPlayers: 15,
        status: 'waiting',
      },
    ];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('bingo_jwt_token');
      localStorage.removeItem(STORAGE_KEYS.LAST_JOINED_ROOM);
    }
    this.save();
  }

  // ── USERS ──
  public getUsers(): DbUser[] {
    return [...this.users];
  }

  public getUserById(uid: string): DbUser | undefined {
    return this.users.find((u) => u.uid === uid);
  }

  public getUserByPhone(phone: string): DbUser | undefined {
    return this.users.find((u) => u.phone === phone);
  }

  public registerUser(params: {
    displayName: string;
    phone: string;
    password?: string;
    dob?: string;
    referralCode?: string;
  }): DbUser {
    const trimmedName = params.displayName.trim() || 'Player';
    const trimmedPhone = params.phone.trim();

    // Check if phone already registered
    const existing = this.getUserByPhone(trimmedPhone);
    if (existing) {
      existing.displayName = trimmedName;
      this.save();
      return existing;
    }

    const newUser: DbUser = {
      uid: 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      phone: trimmedPhone,
      password: params.password || '',
      displayName: trimmedName,
      walletBalanceSantim: 0, // Starts at 0
      referralCode: params.referralCode || 'SB' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      kycStatus: 'pending',
      banned: false,
      createdAt: new Date().toISOString(),
      totalDepositsETB: 0,
      totalWithdrawalsETB: 0,
    };

    this.users.unshift(newUser);
    this.save();
    return newUser;
  }

  public updateUser(uid: string, updates: Partial<DbUser>): DbUser | undefined {
    const user = this.getUserById(uid);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  public toggleBan(uid: string): boolean {
    const user = this.getUserById(uid);
    if (!user) return false;
    user.banned = !user.banned;
    this.save();
    return user.banned;
  }

  public verifyKyc(uid: string): boolean {
    const user = this.getUserById(uid);
    if (!user) return false;
    user.kycStatus = 'verified';
    this.save();
    return true;
  }

  public adjustUserBalance(uid: string, deltaSantim: number): number {
    const user = this.getUserById(uid);
    if (!user) return 0;
    user.walletBalanceSantim = Math.max(0, user.walletBalanceSantim + deltaSantim);
    this.save();
    return user.walletBalanceSantim;
  }

  // ── DEPOSITS ──
  public getDeposits(): DbDeposit[] {
    return [...this.deposits];
  }

  public createDeposit(params: {
    playerId: string;
    amountETB: number;
    ftNumber: string;
    screenshotUrl?: string;
  }): DbDeposit {
    const user = this.getUserById(params.playerId);
    const newDeposit: DbDeposit = {
      id: 'dep-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      playerId: params.playerId,
      playerName: user ? user.displayName : 'Player',
      playerPhone: user ? user.phone : '',
      amountETB: params.amountETB,
      ftNumber: params.ftNumber.trim() || 'FT' + Date.now().toString().slice(-8),
      screenshotUrl: params.screenshotUrl,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.deposits.unshift(newDeposit);
    this.save();
    return newDeposit;
  }

  public approveDeposit(depositId: string): boolean {
    const deposit = this.deposits.find((d) => d.id === depositId);
    if (!deposit || deposit.status !== 'pending') return false;

    deposit.status = 'approved';
    deposit.processedAt = new Date().toISOString();

    // Credit user's wallet
    const user = this.getUserById(deposit.playerId);
    if (user) {
      user.walletBalanceSantim += deposit.amountETB * 100;
      user.totalDepositsETB += deposit.amountETB;
    }

    this.save();
    return true;
  }

  public rejectDeposit(depositId: string, reason?: string): boolean {
    const deposit = this.deposits.find((d) => d.id === depositId);
    if (!deposit || deposit.status !== 'pending') return false;

    deposit.status = 'rejected';
    deposit.rejectionReason = reason || 'Verification failed';
    deposit.processedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // ── WITHDRAWALS ──
  public getWithdrawals(): DbWithdrawal[] {
    return [...this.withdrawals];
  }

  public createWithdrawal(params: {
    playerId: string;
    amountETB: number;
    method: string;
    accountNumber: string;
  }): { success: boolean; error?: string; withdrawal?: DbWithdrawal } {
    const user = this.getUserById(params.playerId);
    if (!user) return { success: false, error: 'User not found' };

    const santimNeeded = params.amountETB * 100;
    if (user.walletBalanceSantim < santimNeeded) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Deduct balance upfront during pending status
    user.walletBalanceSantim -= santimNeeded;

    const newWithdrawal: DbWithdrawal = {
      id: 'with-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      playerId: params.playerId,
      playerName: user.displayName,
      playerPhone: user.phone,
      amountETB: params.amountETB,
      method: params.method,
      accountNumber: params.accountNumber,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.withdrawals.unshift(newWithdrawal);
    this.save();
    return { success: true, withdrawal: newWithdrawal };
  }

  public approveWithdrawal(withdrawalId: string): boolean {
    const withdrawal = this.withdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal || withdrawal.status !== 'pending') return false;

    withdrawal.status = 'approved';
    withdrawal.processedAt = new Date().toISOString();

    const user = this.getUserById(withdrawal.playerId);
    if (user) {
      user.totalWithdrawalsETB += withdrawal.amountETB;
    }

    this.save();
    return true;
  }

  public rejectWithdrawal(withdrawalId: string, reason?: string): boolean {
    const withdrawal = this.withdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal || withdrawal.status !== 'pending') return false;

    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason || 'Payment rejected by operator';
    withdrawal.processedAt = new Date().toISOString();

    // Refund player balance
    const user = this.getUserById(withdrawal.playerId);
    if (user) {
      user.walletBalanceSantim += withdrawal.amountETB * 100;
    }

    this.save();
    return true;
  }

  // ── P2P WALLET TRANSFERS (PHONE-TO-PHONE) ──
  public getTransfers(): DbTransfer[] {
    return [...this.transfers];
  }

  public transferBalance(params: {
    senderId: string;
    recipientPhone: string;
    amountETB: number;
    note?: string;
  }): { success: boolean; error?: string; transfer?: DbTransfer } {
    const sender = this.getUserById(params.senderId);
    if (!sender) {
      return { success: false, error: 'Sender account not found.' };
    }

    if (params.amountETB <= 0) {
      return { success: false, error: 'Please enter a valid transfer amount.' };
    }

    const santimNeeded = Math.round(params.amountETB * 100);
    if (sender.walletBalanceSantim < santimNeeded) {
      return { success: false, error: 'Insufficient wallet balance.' };
    }

    // Clean phone format
    const cleanPhone = params.recipientPhone.trim();
    const recipient = this.users.find(
      (u) =>
        u.phone === cleanPhone ||
        u.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '') ||
        u.phone.endsWith(cleanPhone.slice(-9))
    );

    if (!recipient) {
      return {
        success: false,
        error: `No registered player found with phone number ${cleanPhone}. Please verify the number.`,
      };
    }

    if (recipient.uid === sender.uid) {
      return { success: false, error: 'You cannot transfer funds to your own account.' };
    }

    if (recipient.banned) {
      return { success: false, error: 'Recipient account is currently suspended.' };
    }

    // Execute transfer
    sender.walletBalanceSantim -= santimNeeded;
    recipient.walletBalanceSantim += santimNeeded;

    const newTransfer: DbTransfer = {
      id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      senderId: sender.uid,
      senderName: sender.displayName,
      senderPhone: sender.phone,
      recipientId: recipient.uid,
      recipientName: recipient.displayName,
      recipientPhone: recipient.phone,
      amountETB: params.amountETB,
      note: params.note?.trim() || '',
      createdAt: new Date().toISOString(),
      status: 'completed',
    };

    this.transfers.unshift(newTransfer);
    this.save();

    return { success: true, transfer: newTransfer };
  }

  // ── USER TRANSACTION FEED (WITH PENDING, APPROVED, REJECTED, AND TRANSFER STATES) ──
  public getUserTransactions(playerId: string): DbUserTransaction[] {
    const userDeposits: DbUserTransaction[] = this.deposits
      .filter((d) => d.playerId === playerId)
      .map((d) => ({
        id: d.id,
        type: 'deposit' as const,
        amountETB: d.amountETB,
        status: d.status,
        method: 'Telebirr / CBE Transfer',
        reference: d.ftNumber,
        createdAt: d.createdAt,
        rejectionReason: d.rejectionReason,
        processedAt: d.processedAt,
      }));

    const userWithdrawals: DbUserTransaction[] = this.withdrawals
      .filter((w) => w.playerId === playerId)
      .map((w) => ({
        id: w.id,
        type: 'withdrawal' as const,
        amountETB: w.amountETB,
        status: w.status,
        method: w.method || 'Payout',
        reference: w.accountNumber,
        createdAt: w.createdAt,
        rejectionReason: w.rejectionReason,
        processedAt: w.processedAt,
      }));

    const userTransfersOut: DbUserTransaction[] = this.transfers
      .filter((t) => t.senderId === playerId)
      .map((t) => ({
        id: t.id,
        type: 'transfer_out' as const,
        amountETB: t.amountETB,
        status: 'completed' as const,
        method: 'P2P Transfer (Sent)',
        reference: `To: ${t.recipientName} (${t.recipientPhone})`,
        counterpartName: t.recipientName,
        counterpartPhone: t.recipientPhone,
        createdAt: t.createdAt,
        processedAt: t.createdAt,
      }));

    const userTransfersIn: DbUserTransaction[] = this.transfers
      .filter((t) => t.recipientId === playerId)
      .map((t) => ({
        id: t.id,
        type: 'transfer_in' as const,
        amountETB: t.amountETB,
        status: 'completed' as const,
        method: 'P2P Transfer (Received)',
        reference: `From: ${t.senderName} (${t.senderPhone})`,
        counterpartName: t.senderName,
        counterpartPhone: t.senderPhone,
        createdAt: t.createdAt,
        processedAt: t.createdAt,
      }));

    const combined = [...userDeposits, ...userWithdrawals, ...userTransfersOut, ...userTransfersIn];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
  }

  // ── ROOMS & ADMIN CONTROLS ──
  public getRooms(): DbRoom[] {
    return [...this.rooms];
  }

  public addRoom(room: Omit<DbRoom, 'id'>): DbRoom {
    const newRoom: DbRoom = {
      ...room,
      id: 'room-' + Date.now(),
    };
    this.rooms.push(newRoom);
    this.save();
    return newRoom;
  }

  public updateRoomSettings(roomId: string, settings: {
    entryFeeETB?: number;
    potETB?: number;
    minPlayers?: number;
    maxPlayers?: number;
    winningPatternId?: string;
    winningPatternName?: string;
  }): boolean {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return false;
    if (settings.entryFeeETB !== undefined) room.entryFeeETB = Math.max(1, settings.entryFeeETB);
    if (settings.potETB !== undefined) room.potETB = Math.max(0, settings.potETB);
    if (settings.minPlayers !== undefined) room.minPlayers = Math.max(1, settings.minPlayers);
    if (settings.maxPlayers !== undefined) room.maxPlayers = Math.max(1, settings.maxPlayers);
    if (settings.winningPatternId !== undefined) room.winningPatternId = settings.winningPatternId;
    if (settings.winningPatternName !== undefined) room.winningPatternName = settings.winningPatternName;
    this.save();
    return true;
  }

  public updateRoomPricing(roomId: string, entryFeeETB: number, potETB: number): boolean {
    return this.updateRoomSettings(roomId, { entryFeeETB, potETB });
  }

  public resetRoomToWaiting(roomId: string, lastResult?: DbGameHistory): boolean {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return false;
    room.status = 'waiting';
    if (lastResult) {
      room.lastGameResult = lastResult;
    }
    this.save();
    return true;
  }

  public getLastGameResult(roomId?: string): DbGameHistory | null {
    if (roomId) {
      const room = this.rooms.find((r) => r.id === roomId);
      if (room?.lastGameResult) return room.lastGameResult;
      const match = this.gameHistory.find((g) => g.roomId === roomId);
      if (match) return match;
    }
    return this.gameHistory.length > 0 ? this.gameHistory[0] : null;
  }

  public toggleRoomStatus(roomId: string): boolean {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return false;
    room.status = room.status === 'active' ? 'waiting' : 'active';
    this.save();
    return true;
  }

  public triggerRoomGameStart(roomId: string): boolean {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return false;
    room.status = 'active';
    room.lastStartedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // ── 3-DAY ROLLING GAME HISTORY ──
  public getGameHistory(): DbGameHistory[] {
    this.gameHistory = this.purgeOldGameHistory(this.gameHistory);
    return [...this.gameHistory];
  }

  public recordGameResult(history: Omit<DbGameHistory, 'id' | 'timestamp' | 'playedAt'>): DbGameHistory {
    const now = Date.now();
    const entry: DbGameHistory = {
      ...history,
      id: 'game-' + now + '-' + Math.floor(Math.random() * 1000),
      playedAt: new Date(now).toISOString(),
      timestamp: now,
    };

    this.gameHistory.unshift(entry);
    this.gameHistory = this.purgeOldGameHistory(this.gameHistory);
    this.save();
    return entry;
  }

  // ── ACTIVE JOINED ROOM STORAGE ──
  public setLastJoinedRoom(roomId: string | null) {
    if (typeof window === 'undefined') return;
    if (roomId) {
      localStorage.setItem(STORAGE_KEYS.LAST_JOINED_ROOM, roomId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_JOINED_ROOM);
    }
  }

  public getLastJoinedRoom(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.LAST_JOINED_ROOM) || 'room-classic-hall';
  }

  // ── ANALYTICS ──
  public getAnalytics() {
    const totalUsers = this.users.length;
    const totalApprovedDepositsETB = this.deposits
      .filter((d) => d.status === 'approved')
      .reduce((sum, d) => sum + d.amountETB, 0);

    const totalApprovedWithdrawalsETB = this.withdrawals
      .filter((w) => w.status === 'approved')
      .reduce((sum, w) => sum + w.amountETB, 0);

    const pendingDepositsCount = this.deposits.filter((d) => d.status === 'pending').length;
    const pendingWithdrawalsCount = this.withdrawals.filter((w) => w.status === 'pending').length;
    const activeRoomsCount = this.rooms.filter((r) => r.status === 'active').length;
    const netRevenueETB = totalApprovedDepositsETB - totalApprovedWithdrawalsETB;

    return {
      totalUsers,
      activeToday: Math.min(totalUsers, Math.max(0, totalUsers > 0 ? 1 : 0)),
      totalDepositsETB: totalApprovedDepositsETB,
      totalWithdrawalsETB: totalApprovedWithdrawalsETB,
      pendingDepositsCount,
      pendingWithdrawalsCount,
      activeRoomsCount,
      netRevenueETB,
    };
  }

  // Session helper
  public getCurrentSessionUser(): DbUser | null {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return this.getUserById(parsed.uid) || parsed;
    } catch {
      return null;
    }
  }

  public setCurrentSessionUser(user: DbUser | null) {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }
}

export const dbService = new DatabaseService();
