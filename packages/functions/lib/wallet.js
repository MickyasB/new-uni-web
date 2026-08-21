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
exports.requestWithdrawal = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const shared_1 = require("@bingo/shared");
const santim_1 = require("./utils/santim");
const rateLimit_1 = require("./utils/rateLimit");
const appCheck_1 = require("./utils/appCheck");
exports.requestWithdrawal = (0, https_1.onCall)(appCheck_1.SECURE_CALL_OPTIONS, async (request) => {
    const { auth } = request;
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { amountEtb, gateway, accountDetails } = request.data;
    if (!amountEtb || amountEtb <= 0 || !gateway || !accountDetails) {
        throw new https_1.HttpsError('invalid-argument', 'Missing or invalid parameters: amountEtb, gateway, accountDetails.');
    }
    // Rate limit: max 3 withdrawal requests per user per 24-hour window (spec §4.4)
    const allowed = await (0, rateLimit_1.checkRateLimit)(auth.uid, 'withdrawal', 3, 24 * 60 * 60 * 1000);
    if (!allowed) {
        throw new https_1.HttpsError('resource-exhausted', 'Rate limit exceeded: max 3 withdrawal requests per 24 hours.');
    }
    const amountSantim = (0, santim_1.ethToSantim)(amountEtb);
    const uid = auth.uid;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const requestId = crypto.randomUUID();
    const withdrawalRequestRef = db.collection('withdrawalRequests').doc(requestId);
    const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'User record not found.');
        }
        const userData = userDoc.data();
        const balance = userData?.walletBalanceSantim || 0;
        if (balance < amountSantim) {
            throw new https_1.HttpsError('failed-precondition', `Insufficient funds: balance is ${balance} santim, withdrawal requested is ${amountSantim} santim.`);
        }
        const newBalance = (0, santim_1.subtractSantim)(balance, amountSantim);
        // 1. Deduct balance instantly
        transaction.update(userRef, { walletBalanceSantim: newBalance });
        // 2. Write to withdrawalRequests
        transaction.set(withdrawalRequestRef, {
            id: requestId,
            userId: uid,
            amountSantim,
            gateway,
            accountDetails,
            status: 'pending',
            createdAt: Date.now()
        });
        // 3. Write to walletLedger
        const ledgerId = crypto.randomUUID();
        const ledgerEntry = {
            id: ledgerId,
            userId: uid,
            type: shared_1.WalletEntryType.WITHDRAWAL,
            amountSantim,
            balanceSantim: newBalance,
            gateway,
            transactionId: requestId,
            createdAt: Date.now()
        };
        transaction.set(db.collection('walletLedger').doc(ledgerId), ledgerEntry);
        return { success: true, requestId };
    });
    return result;
});
//# sourceMappingURL=wallet.js.map