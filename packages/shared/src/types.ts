// Runtime Enums & Constants
export const RoomTier = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold'
} as const;
export type RoomTier = (typeof RoomTier)[keyof typeof RoomTier];

export const RoomStatus = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  ENDED: 'ended'
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const GameStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed'
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const WalletEntryType = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  WIN: 'win',
  BONUS: 'bonus',
  ENTRY_FEE: 'entry_fee',
  HOUSE_CUT: 'house_cut'
} as const;
export type WalletEntryType = (typeof WalletEntryType)[keyof typeof WalletEntryType];

export const WinTier = {
  LINE: 'line',
  CORNERS: 'corners',
  FULL_HOUSE: 'full_house'
} as const;
export type WinTier = (typeof WinTier)[keyof typeof WinTier];

export const Gateway = {
  CHAPA: 'chapa',
  TELEBIRR: 'telebirr',
  CBE: 'cbe',
  WEBIRR: 'webirr'
} as const;
export type Gateway = (typeof Gateway)[keyof typeof Gateway];

export const AdminRole = {
  VIEWER: 'viewer',
  OPERATOR: 'operator',
  SUPER_ADMIN: 'super-admin'
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export const FlagReason = {
  HIGH_VALUE: 'high_value',
  NEW_ACCOUNT: 'new_account',
  MULTI_CARD: 'multi_card',
  VELOCITY: 'velocity',
  COLLUSION_SUSPECT: 'collusion_suspect'
} as const;
export type FlagReason = (typeof FlagReason)[keyof typeof FlagReason];

// Core entities
export interface UserRecord {
  uid: string;
  phone: string;
  displayName: string;
  dob: string; // ISO date
  kycStatus: 'pending' | 'verified' | 'rejected';
  walletBalanceSantim: number; // integer only
  deviceFingerprint: string; // server-computed
  referralCode: string;
  referredBy?: string | null;
  createdAt: number; // Unix ms
  isBanned: boolean;
  deletedAt?: number; // tombstone for deleted accounts
}

export interface WalletLedgerEntry {
  id: string;
  userId: string;
  type: WalletEntryType;
  amountSantim: number; // always positive; sign implicit in type
  balanceSantim: number; // running balance snapshot after this entry
  gateway?: Gateway;
  transactionId?: string;
  gameId?: string;
  createdAt: number;
}

export interface RoomRecord {
  id: string;
  tier: RoomTier;
  entryFeeSantim: number;
  mode: 'auto' | 'manual';
  type: 'open' | 'scheduled';
  scheduledAt?: number | null;
  minPlayers: number;
  maxCards: number;
  status: RoomStatus;
  playerCount: number;
  potSantim: number;
  patternId?: string; // Assigned winning pattern rule
  createdAt: number;
}

export interface GameRecord {
  id: string;
  roomId: string;
  seedHash: string; // SHA-256 of sequence — committed before game starts
  sequence: number[]; // revealed only after game ends
  calledNumbers: number[];
  status: GameStatus;
  lastProcessedIndex: number; // optimistic lock for win detection
  winners: WinnerRecord[];
  patternId?: string; // Winning pattern rule for this game
  revealedAt?: number;
  createdAt: number;
}

export interface WinnerRecord {
  userId: string;
  userDisplayId?: string;
  displayName?: string;
  cardId: string;
  winTier: WinTier;
  patternName?: string;
  amountSantim: number;
  creditedAt: number;
}

export interface BingoCard {
  id: string;
  fingerprint: string; // SHA-256 of numbers for tie-breaking
  numbers: number[][]; // 5x5 grid
}

// RTDB live state (read-only for clients)
export interface RoomLiveState {
  state: RoomStatus;
  currentNumber: number | null;
  calledNumbers: number[];
  seedHash: string;
  nextCallAt: number;
  patternId?: string;
  patternName?: string;
  patternDescription?: string;
  patternMatrix?: boolean[][];
  players: Record<string, PlayerLiveState>;
  reactions: Record<string, { emoji: string; timestamp: number }>;
  winner?: WinnerRecord | null;
}

export interface PlayerLiveState {
  displayName: string;
  connected: boolean;
  lastSeen: number;
  cards: Record<string, CardLiveState>;
}

export interface CardLiveState {
  numbers: number[][];
  marked: boolean[][]; // SERVER-WRITTEN ONLY — never trusted from client
}

// Payment
export interface PendingPayment {
  id: string;
  userId: string;
  gateway: Gateway;
  amountSantim: number;
  status: 'pending' | 'completed' | 'failed';
  checkoutUrl: string;
  createdAt: number;
  completedAt?: number;
}

export interface ProcessedWebhook {
  gateway: Gateway;
  amountSantim: number;
  userId: string;
  processedAt: number;
}

// Platform config (read from Firestore at function invocation — never hardcoded)
export interface PlatformConfig {
  killSwitchEnabled: boolean;
  amlSingleDepositThresholdSantim: number; // default: 1_000_000 (10,000 ETB)
  amlRolling30DayThresholdSantim: number;  // default: 5_000_000 (50,000 ETB)
  bonusFirstDepositPercent: number;
  bonusFirstDepositCapSantim: number;
  referralBonusSantim: number;
  maxCardsPerPlayer: number;
  ipAllowlist: string[];
  winAutoApproveThresholdSantim: number; // below this, skip fraud queue
  winSlaMinutes: number; // SLA before auto-approve (default: 30)
}
