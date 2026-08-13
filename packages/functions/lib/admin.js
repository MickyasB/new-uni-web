"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runManualReconciliation = exports.getDashboardAnalytics = exports.rejectFlaggedWin = exports.approveFlaggedWin = exports.rejectWithdrawal = exports.approveWithdrawal = exports.updatePlayerStatus = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const shared_1 = require("@bingo/shared");
const santim_1 = require("./utils/santim");
// Role helper
function verifyAdminRole(auth, minRole = shared_1.AdminRole.VIEWER) {
    if (process.env.FUNCTIONS_EMULATOR === 'true' || process.env.VITEST === 'true') {
        return; // Allow in emulator/testing
    }
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'Admin must be authenticated.');
    }
    const role = auth.token.role;
    if (!role) {
        throw new https_1.HttpsError('permission-denied', 'No admin credentials found.');
    }
    if (minRole === shared_1.AdminRole.SUPER_ADMIN && role !== shared_1.AdminRole.SUPER_ADMIN) {
        throw new https_1.HttpsError('permission-denied', 'Super admin role required.');
    }
    if (minRole === shared_1.AdminRole.OPERATOR && role === shared_1.AdminRole.VIEWER) {
        throw new https_1.HttpsError('permission-denied', 'Operator role required.');
    }
}
// Audit log helper
async function writeAuditLog(db, actorId, actionType, target, beforeValue, afterValue) {
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
exports.updatePlayerStatus = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    verifyAdminRole(auth, shared_1.AdminRole.OPERATOR);
    const { targetUid, isBanned } = request.data;
    if (!targetUid) {
        throw new https_1.HttpsError('invalid-argument', 'Missing targetUid.');
    }
    const db = admin.firestore();
    const userRef = db.collection('users').doc(targetUid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Player not found.');
    }
    const before = userDoc.data();
    await userRef.update({ isBanned });
    const actorId = auth?.uid || 'system-emulator';
    await writeAuditLog(db, actorId, 'update_player_ban_status', targetUid, before, { isBanned });
    return { success: true };
});
// 2. Approve Withdrawal
exports.approveWithdrawal = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    verifyAdminRole(auth, shared_1.AdminRole.OPERATOR);
    const { requestId } = request.data;
    if (!requestId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing requestId.');
    }
    const db = admin.firestore();
    const requestRef = db.collection('withdrawalRequests').doc(requestId);
    await db.runTransaction(async (transaction) => {
        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Withdrawal request not found.');
        }
        const requestData = requestDoc.data();
        if (requestData?.status !== 'pending') {
            throw new https_1.HttpsError('failed-precondition', 'Withdrawal request is already processed.');
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
exports.rejectWithdrawal = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    verifyAdminRole(auth, shared_1.AdminRole.OPERATOR);
    const { requestId } = request.data;
    if (!requestId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing requestId.');
    }
    const db = admin.firestore();
    const requestRef = db.collection('withdrawalRequests').doc(requestId);
    const result = await db.runTransaction(async (transaction) => {
        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Withdrawal request not found.');
        }
        const requestData = requestDoc.data();
        if (requestData?.status !== 'pending') {
            throw new https_1.HttpsError('failed-precondition', 'Withdrawal request is already processed.');
        }
        const userRef = db.collection('users').doc(requestData.userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'User record not found.');
        }
        // Refund escrow amount to wallet balance
        const currentBalance = userDoc.data()?.walletBalanceSantim || 0;
        const newBalance = (0, santim_1.addSantim)(currentBalance, requestData.amountSantim);
        transaction.update(userRef, { walletBalanceSantim: newBalance });
        // Record refund in Ledger as type BONUS or DEPOSIT
        const ledgerId = crypto.randomUUID();
        const ledgerEntry = {
            id: ledgerId,
            userId: requestData.userId,
            type: shared_1.WalletEntryType.DEPOSIT, // Deposit-style refund
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
exports.approveFlaggedWin = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    verifyAdminRole(auth, shared_1.AdminRole.OPERATOR);
    const { flaggedWinId } = request.data;
    if (!flaggedWinId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing flaggedWinId.');
    }
    const db = admin.firestore();
    const flaggedRef = db.collection('flaggedWins').doc(flaggedWinId);
    const result = await db.runTransaction(async (transaction) => {
        const flaggedDoc = await transaction.get(flaggedRef);
        if (!flaggedDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Flagged win record not found.');
        }
        const winData = flaggedDoc.data();
        if (winData?.status !== 'pending_review') {
            throw new https_1.HttpsError('failed-precondition', 'Flagged win is already processed.');
        }
        const userRef = db.collection('users').doc(winData.userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'User record not found.');
        }
        // Credit winnings to wallet
        const currentBalance = userDoc.data()?.walletBalanceSantim || 0;
        const newBalance = (0, santim_1.addSantim)(currentBalance, winData.amountSantim);
        transaction.update(userRef, { walletBalanceSantim: newBalance });
        // Record in ledger
        const ledgerId = crypto.randomUUID();
        const ledgerEntry = {
            id: ledgerId,
            userId: winData.userId,
            type: shared_1.WalletEntryType.WIN,
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
exports.rejectFlaggedWin = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    verifyAdminRole(auth, shared_1.AdminRole.OPERATOR);
    const { flaggedWinId } = request.data;
    if (!flaggedWinId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing flaggedWinId.');
    }
    const db = admin.firestore();
    const flaggedRef = db.collection('flaggedWins').doc(flaggedWinId);
    await db.runTransaction(async (transaction) => {
        const flaggedDoc = await transaction.get(flaggedRef);
        if (!flaggedDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Flagged win record not found.');
        }
        const winData = flaggedDoc.data();
        if (winData?.status !== 'pending_review') {
            throw new https_1.HttpsError('failed-precondition', 'Flagged win is already processed.');
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
exports.getDashboardAnalytics = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    verifyAdminRole(auth, shared_1.AdminRole.VIEWER);
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
        const data = doc.data();
        if (data.type === shared_1.WalletEntryType.DEPOSIT) {
            totalDeposited += data.amountSantim;
        }
        else if (data.type === shared_1.WalletEntryType.WITHDRAWAL) {
            totalWithdrawn += data.amountSantim;
        }
        else if (data.type === shared_1.WalletEntryType.WIN) {
            totalWinningsPaid += data.amountSantim;
        }
        else if (data.type === shared_1.WalletEntryType.HOUSE_CUT) {
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
exports.runManualReconciliation = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    verifyAdminRole(auth, shared_1.AdminRole.OPERATOR);
    const db = admin.firestore();
    // Mismatches checklist
    const processedWebhooksSnap = await db.collection('processedWebhooks').get();
    const pendingPaymentsSnap = await db.collection('pendingPayments').get();
    const webhooks = new Map();
    processedWebhooksSnap.forEach((doc) => {
        webhooks.set(doc.id, doc.data());
    });
    const mismatches = [];
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
//# sourceMappingURL=admin.js.map