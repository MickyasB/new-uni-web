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
exports.applyReferralCode = exports.onEntryFeeCreated = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const shared_1 = require("@bingo/shared");
const santim_1 = require("./utils/santim");
const config_1 = require("./utils/config");
/**
 * Firestore trigger: fires whenever a new walletLedger entry of type ENTRY_FEE is
 * created (i.e. a card purchase). If this is the player's FIRST purchase AND
 * they were referred, we credit the referrer's wallet with the referral bonus.
 */
exports.onEntryFeeCreated = (0, firestore_1.onDocumentCreated)('walletLedger/{ledgerId}', async (event) => {
    const entry = event.data?.data();
    if (!entry || entry.type !== shared_1.WalletEntryType.ENTRY_FEE)
        return;
    const db = admin.firestore();
    const uid = entry.userId;
    // Check if this is the user's first ENTRY_FEE ledger entry
    const prevEntriesSnap = await db
        .collection('walletLedger')
        .where('userId', '==', uid)
        .where('type', '==', shared_1.WalletEntryType.ENTRY_FEE)
        .get();
    // If more than 1 entry_fee exists, this is NOT the first (the new one was already written)
    if (prevEntriesSnap.size > 1)
        return;
    // Look up the user's referredBy field
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists)
        return;
    const referredBy = userDoc.data()?.referredBy;
    if (!referredBy)
        return;
    // Fetch config for referral bonus amount
    const config = await (0, config_1.getConfig)();
    if (config.killSwitchEnabled || config.referralBonusSantim <= 0)
        return;
    // Check idempotency: avoid double-crediting the same referral
    const idempotencyKey = `referral_bonus_${uid}_to_${referredBy}`;
    const idempotencyRef = db.collection('processedWebhooks').doc(idempotencyKey);
    const idempotencyDoc = await idempotencyRef.get();
    if (idempotencyDoc.exists)
        return;
    const referrerRef = db.collection('users').doc(referredBy);
    await db.runTransaction(async (transaction) => {
        // Re-check idempotency inside transaction
        const idemDoc = await transaction.get(idempotencyRef);
        if (idemDoc.exists)
            return;
        const referrerDoc = await transaction.get(referrerRef);
        if (!referrerDoc.exists)
            return;
        const currentBalance = referrerDoc.data()?.walletBalanceSantim ?? 0;
        const newBalance = (0, santim_1.addSantim)(currentBalance, config.referralBonusSantim);
        // Credit referrer
        transaction.update(referrerRef, { walletBalanceSantim: newBalance });
        // Write ledger entry
        const ledgerId = crypto.randomUUID();
        const ledgerEntry = {
            id: ledgerId,
            userId: referredBy,
            type: shared_1.WalletEntryType.BONUS,
            amountSantim: config.referralBonusSantim,
            balanceSantim: newBalance,
            createdAt: Date.now(),
        };
        transaction.set(db.collection('walletLedger').doc(ledgerId), ledgerEntry);
        // Mark idempotency
        transaction.set(idempotencyRef, {
            type: 'referral_bonus',
            referredUid: uid,
            referrerUid: referredBy,
            amountSantim: config.referralBonusSantim,
            processedAt: Date.now(),
        });
    });
});
/**
 * Callable: Manually apply a referral code to a user (if they forgot to enter it at signup).
 * Can only be called once per user and only before their first deposit.
 */
exports.applyReferralCode = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    if (!auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated.');
    const { referralCode } = request.data;
    if (!referralCode?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'referralCode is required.');
    }
    const db = admin.firestore();
    const uid = auth.uid;
    // Ensure user hasn't already made a deposit
    const depositSnap = await db
        .collection('walletLedger')
        .where('userId', '==', uid)
        .where('type', '==', shared_1.WalletEntryType.DEPOSIT)
        .get();
    if (!depositSnap.empty) {
        throw new https_1.HttpsError('failed-precondition', 'Referral code can only be applied before your first deposit.');
    }
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists)
        throw new https_1.HttpsError('not-found', 'User record not found.');
    if (userDoc.data()?.referredBy) {
        throw new https_1.HttpsError('already-exists', 'A referral code has already been applied to this account.');
    }
    // Find referrer by code
    const referrerSnap = await db
        .collection('users')
        .where('referralCode', '==', referralCode.trim().toUpperCase())
        .limit(1)
        .get();
    if (referrerSnap.empty) {
        throw new https_1.HttpsError('not-found', 'No user found with that referral code.');
    }
    const referrerId = referrerSnap.docs[0].id;
    if (referrerId === uid) {
        throw new https_1.HttpsError('invalid-argument', 'You cannot use your own referral code.');
    }
    await db.collection('users').doc(uid).update({ referredBy: referrerId });
    return { success: true, referrerId };
});
//# sourceMappingURL=bonus.js.map