import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { 
  WalletLedgerEntry, 
  WalletEntryType,
  AdminRole
} from '@bingo/shared';
import { addSantim } from './utils/santim';

// Role helper
function verifyAdminRole(auth: any, minRole: AdminRole = AdminRole.VIEWER) {
  if (process.env.FUNCTIONS_EMULATOR === 'true' || process.env.VITEST === 'true') {
    return; // Allow in emulator/testing
  }
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Admin must be authenticated.');
  }
  const role = auth.token.role as AdminRole;
  if (!role) {
    throw new HttpsError('permission-denied', 'No admin credentials found.');
  }

  if (minRole === AdminRole.SUPER_ADMIN && role !== AdminRole.SUPER_ADMIN) {
    throw new HttpsError('permission-denied', 'Super admin role required.');
  }
  if (minRole === AdminRole.OPERATOR && role === AdminRole.VIEWER) {
    throw new HttpsError('permission-denied', 'Operator role required.');
  }
}

// Audit log helper
async function writeAuditLog(
  db: admin.firestore.Firestore,
  actorId: string,
  actionType: string,
  target: string,
  beforeValue: any,
  afterValue: any
) {
  const logId = crypto.randomUUID();
  await db.collection('adminAuditLogs').doc(logId).set({
    id: logId,
    actorId,
    actionType,
    target,
    beforeValue: beforeValue ? JSON.stringify(beforeValue) : '',
    afterValue: afterValue ? JSON.stringify(afterValue) : '',
    timestamp: Date.now()
  });
}

// 1. Suspend/Ban Player
export const updatePlayerStatus = onCall(async (request) => {
  const { auth } = request;
  verifyAdminRole(auth, AdminRole.OPERATOR);

  const { targetUid, isBanned } = request.data as {
    targetUid: string;
    isBanned: boolean;
  };

  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'Missing targetUid.');
  }

  const db = admin.firestore();
  const userRef = db.collection('users').doc(targetUid);

  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Player not found.');
  }

  const before = userDoc.data();
  await userRef.update({ isBanned });

  const actorId = auth?.uid || 'system-emulator';
  await writeAuditLog(db, actorId, 'update_player_ban_status', targetUid, before, { isBanned });

  return { success: true };
});

// 2. Approve Withdrawal
export const approveWithdrawal = onCall(async (request) => {
  const { auth } = request;
  verifyAdminRole(auth, AdminRole.OPERATOR);

  const { requestId } = request.data as { requestId: string };
  if (!requestId) {
    throw new HttpsError('invalid-argument', 'Missing requestId.');
  }

  const db = admin.firestore();
  const requestRef = db.collection('withdrawalRequests').doc(requestId);

  await db.runTransaction(async (transaction) => {
    const requestDoc = await transaction.get(requestRef);
    if (!requestDoc.exists) {
      throw new HttpsError('not-found', 'Withdrawal request not found.');
    }

    const requestData = requestDoc.data();
    if (requestData?.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Withdrawal request is already processed.');
    }

    // Update withdrawal request status to approved
    transaction.update(requestRef, {
      status: 'approved',
      processedAt: Date.now(),
      processedBy: auth?.uid || 'operator-emulator'
    });

    return { success: true, amountSantim: requestData.amountSantim, userId: requestData.userId };
  });

  const actorId = auth?.uid || 'operator-emulator';
  await writeAuditLog(db, actorId, 'approve_withdrawal', requestId, { status: 'pending' }, { status: 'approved' });

  return { success: true };
});

// 3. Reject Withdrawal
export const rejectWithdrawal = onCall(async (request) => {
  const { auth } = request;
  verifyAdminRole(auth, AdminRole.OPERATOR);

  const { requestId } = request.data as { requestId: string };
  if (!requestId) {
    throw new HttpsError('invalid-argument', 'Missing requestId.');
  }

  const db = admin.firestore();
  const requestRef = db.collection('withdrawalRequests').doc(requestId);

  const result = await db.runTransaction(async (transaction) => {
    const requestDoc = await transaction.get(requestRef);
    if (!requestDoc.exists) {
      throw new HttpsError('not-found', 'Withdrawal request not found.');
    }

    const requestData = requestDoc.data();
    if (requestData?.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Withdrawal request is already processed.');
    }

    const userRef = db.collection('users').doc(requestData.userId);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User record not found.');
    }

    // Refund escrow amount to wallet balance
    const currentBalance = userDoc.data()?.walletBalanceSantim || 0;
    const newBalance = addSantim(currentBalance, requestData.amountSantim);

    transaction.update(userRef, { walletBalanceSantim: newBalance });

    // Record refund in Ledger as type BONUS or DEPOSIT
    const ledgerId = crypto.randomUUID();
    const ledgerEntry: WalletLedgerEntry = {
      id: ledgerId,
      userId: requestData.userId,
      type: WalletEntryType.DEPOSIT, // Deposit-style refund
      amountSantim: requestData.amountSantim,
      balanceSantim: newBalance,
      transactionId: requestId,
      createdAt: Date.now()
    };
    transaction.set(db.collection('walletLedger').doc(ledgerId), ledgerEntry);

    // Update status to rejected
    transaction.update(requestRef, {
      status: 'rejected',
      processedAt: Date.now(),
      processedBy: auth?.uid || 'operator-emulator'
    });

    return { success: true };
  });

  const actorId = auth?.uid || 'operator-emulator';
  await writeAuditLog(db, actorId, 'reject_withdrawal', requestId, { status: 'pending' }, { status: 'rejected' });

  return result;
});

// 4. Approve Flagged Win
export const approveFlaggedWin = onCall(async (request) => {
  const { auth } = request;
  verifyAdminRole(auth, AdminRole.OPERATOR);

  const { flaggedWinId } = request.data as { flaggedWinId: string };
  if (!flaggedWinId) {
    throw new HttpsError('invalid-argument', 'Missing flaggedWinId.');
  }

  const db = admin.firestore();
  const flaggedRef = db.collection('flaggedWins').doc(flaggedWinId);

  const result = await db.runTransaction(async (transaction) => {
    const flaggedDoc = await transaction.get(flaggedRef);
    if (!flaggedDoc.exists) {
      throw new HttpsError('not-found', 'Flagged win record not found.');
    }

    const winData = flaggedDoc.data();
    if (winData?.status !== 'pending_review') {
      throw new HttpsError('failed-precondition', 'Flagged win is already processed.');
    }

    const userRef = db.collection('users').doc(winData.userId);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User record not found.');
    }

    // Credit winnings to wallet
    const currentBalance = userDoc.data()?.walletBalanceSantim || 0;
    const newBalance = addSantim(currentBalance, winData.amountSantim);

    transaction.update(userRef, { walletBalanceSantim: newBalance });

    // Record in ledger
    const ledgerId = crypto.randomUUID();
    const ledgerEntry: WalletLedgerEntry = {
      id: ledgerId,
      userId: winData.userId,
      type: WalletEntryType.WIN,
      amountSantim: winData.amountSantim,
      balanceSantim: newBalance,
      createdAt: Date.now()
    };
    transaction.set(db.collection('walletLedger').doc(ledgerId), ledgerEntry);

    // Update flagged win status
    transaction.update(flaggedRef, {
      status: 'approved',
      processedAt: Date.now(),
      processedBy: auth?.uid || 'operator-emulator'
    });

    return { success: true };
  });

  const actorId = auth?.uid || 'operator-emulator';
  await writeAuditLog(db, actorId, 'approve_flagged_win', flaggedWinId, { status: 'pending_review' }, { status: 'approved' });

  return result;
});

// 5. Reject Flagged Win
export const rejectFlaggedWin = onCall(async (request) => {
  const { auth } = request;
  verifyAdminRole(auth, AdminRole.OPERATOR);

  const { flaggedWinId } = request.data as { flaggedWinId: string };
  if (!flaggedWinId) {
    throw new HttpsError('invalid-argument', 'Missing flaggedWinId.');
  }

  const db = admin.firestore();
  const flaggedRef = db.collection('flaggedWins').doc(flaggedWinId);

  await db.runTransaction(async (transaction) => {
    const flaggedDoc = await transaction.get(flaggedRef);
    if (!flaggedDoc.exists) {
      throw new HttpsError('not-found', 'Flagged win record not found.');
    }

    const winData = flaggedDoc.data();
    if (winData?.status !== 'pending_review') {
      throw new HttpsError('failed-precondition', 'Flagged win is already processed.');
    }

    transaction.update(flaggedRef, {
      status: 'rejected',
      processedAt: Date.now(),
      processedBy: auth?.uid || 'operator-emulator'
    });
  });

  const actorId = auth?.uid || 'operator-emulator';
  await writeAuditLog(db, actorId, 'reject_flagged_win', flaggedWinId, { status: 'pending_review' }, { status: 'rejected' });

  return { success: true };
});

// 6. Get Dashboard Analytics
export const getDashboardAnalytics = onCall(async (request) => {
  const { auth } = request;
  verifyAdminRole(auth, AdminRole.VIEWER);

  const db = admin.firestore();
  
  // Total Users
  const usersSnap = await db.collection('users').get();
  const totalUsers = usersSnap.size;

  // Ledger Aggregations
  const ledgerSnap = await db.collection('walletLedger').get();
  let totalDeposited = 0;
  let totalWithdrawn = 0;
  let totalWinningsPaid = 0;
  let totalHouseCommission = 0;

  ledgerSnap.forEach((doc) => {
    const data = doc.data() as WalletLedgerEntry;
    if (data.type === WalletEntryType.DEPOSIT) {
      totalDeposited += data.amountSantim;
    } else if (data.type === WalletEntryType.WITHDRAWAL) {
      totalWithdrawn += data.amountSantim;
    } else if (data.type === WalletEntryType.WIN) {
      totalWinningsPaid += data.amountSantim;
    } else if (data.type === WalletEntryType.HOUSE_CUT) {
      totalHouseCommission += data.amountSantim;
    }
  });

  // Rooms and fill rates
  const roomsSnap = await db.collection('rooms').get();
  const totalRooms = roomsSnap.size;
  let totalPlayersAcrossRooms = 0;
  roomsSnap.forEach((doc) => {
    totalPlayersAcrossRooms += doc.data().playerCount || 0;
  });
  const avgRoomFill = totalRooms > 0 ? (totalPlayersAcrossRooms / totalRooms).toFixed(1) : '0';

  return {
    success: true,
    analytics: {
      totalUsers,
      totalDepositedEtb: totalDeposited / 100,
      totalWithdrawnEtb: totalWithdrawn / 100,
      totalWinningsPaidEtb: totalWinningsPaid / 100,
      totalHouseCommissionEtb: totalHouseCommission / 100,
      totalRooms,
      avgRoomFill
    }
  };
});

// 7. Manual Reconciliation Trigger
export const runManualReconciliation = onCall(async (request) => {
  const { auth } = request;
  verifyAdminRole(auth, AdminRole.OPERATOR);

  const db = admin.firestore();
  
  // Mismatches checklist
  const processedWebhooksSnap = await db.collection('processedWebhooks').get();
  const pendingPaymentsSnap = await db.collection('pendingPayments').get();

  const webhooks = new Map<string, any>();
  processedWebhooksSnap.forEach((doc) => {
    webhooks.set(doc.id, doc.data());
  });

  const mismatches: Array<{ id: string; issue: string; details: any }> = [];

  pendingPaymentsSnap.forEach((doc) => {
    const data = doc.data();
    const isWebhookProcessed = webhooks.has(doc.id);
    
    if (data.status === 'completed' && !isWebhookProcessed) {
      mismatches.push({
        id: doc.id,
        issue: 'payment_completed_webhook_missing',
        details: data
      });
    }
  });

  const actorId = auth?.uid || 'operator-emulator';
  await writeAuditLog(db, actorId, 'run_reconciliation', 'all', {}, { mismatchCount: mismatches.length });

  return { success: true, mismatchCount: mismatches.length, mismatches };
});
