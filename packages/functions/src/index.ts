import * as admin from 'firebase-admin';

// Core modules
import { registerPlayer, getDevCustomToken } from './auth';
import { createRoom, buyCards, startGame, addMockPlayers, claimBingo } from './game';

// Phase 3: Payments
import {
  createDepositRequest,
  handleChapaWebhook,
  handleTelebirrWebhook,
  handleWebirrWebhook,
  handleCbeWebhook,
} from './payments';

// Phase 3: Wallet
import { requestWithdrawal } from './wallet';

// Phase 3: Admin
import {
  updatePlayerStatus,
  approveWithdrawal,
  rejectWithdrawal,
  approveFlaggedWin,
  rejectFlaggedWin,
  getDashboardAnalytics,
  runManualReconciliation,
} from './admin';

// Phase 3: Bonus
import { onEntryFeeCreated, applyReferralCode } from './bonus';

// Phase 4: Notifications & SLA
import { registerFcmToken, autoApproveStaleFlaggedWins } from './notifications';

if (!admin.apps.length) {
  admin.initializeApp();
}

// ── Callable function groups ──────────────────────────────────────────────────
export const auth = { registerPlayer, getDevCustomToken };
export const game = { createRoom, buyCards, startGame, addMockPlayers, claimBingo };

export const payments = {
  createDepositRequest,
  // HTTP webhooks — exported individually so they get distinct URLs
  handleChapaWebhook,
  handleTelebirrWebhook,
  handleWebirrWebhook,
  handleCbeWebhook,
};

export const wallet = { requestWithdrawal };

export const adminFns = {
  updatePlayerStatus,
  approveWithdrawal,
  rejectWithdrawal,
  approveFlaggedWin,
  rejectFlaggedWin,
  getDashboardAnalytics,
  runManualReconciliation,
};

export const bonus = {
  onEntryFeeCreated,   // Firestore trigger — auto-registered
  applyReferralCode,
};

// Phase 4: Notifications — FCM push + SLA auto-approve scheduler
export const notifications = {
  registerFcmToken,
  autoApproveStaleFlaggedWins,  // Scheduled: every 5 min, auto-approves flagged wins past 30-min SLA
};
