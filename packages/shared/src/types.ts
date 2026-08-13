// Enums
export enum RoomTier { BRONZE = 'bronze', SILVER = 'silver', GOLD = 'gold' }
export enum RoomStatus { WAITING = 'waiting', ACTIVE = 'active', ENDED = 'ended' }
export enum GameStatus { PENDING = 'pending', ACTIVE = 'active', COMPLETED = 'completed' }
export enum WalletEntryType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  WIN = 'win',
  BONUS = 'bonus',
  ENTRY_FEE = 'entry_fee',
  HOUSE_CUT = 'house_cut'
}
export enum WinTier { LINE = 'line', CORNERS = 'corners', FULL_HOUSE = 'full_house' }
export enum Gateway {
  CHAPA = 'chapa', TELEBIRR = 'telebirr', CBE = 'cbe', WEBIRR = 'webirr'
}
export enum AdminRole { VIEWER = 'viewer', OPERATOR = 'operator', SUPER_ADMIN = 'super-admin' }
export enum FlagReason {
  HIGH_VALUE = 'high_value',
  NEW_ACCOUNT = 'new_account',
  MULTI_CARD = 'multi_card',
  VELOCITY = 'velocity',
  COLLUSION_SUSPECT = 'collusion_suspect'
}

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
  revealedAt?: number;
  createdAt: number;
}

export interface WinnerRecord {
  userId: string;
  cardId: string;
  winTier: WinTier;
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
