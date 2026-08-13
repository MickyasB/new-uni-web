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
exports.handleCbeWebhook = exports.handleWebirrWebhook = exports.handleTelebirrWebhook = exports.handleChapaWebhook = exports.createDepositRequest = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const shared_1 = require("@bingo/shared");
const santim_1 = require("./utils/santim");
const config_1 = require("./utils/config");
// 1. Create Deposit Request Call
exports.createDepositRequest = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { amountEtb, gateway } = request.data;
    if (!amountEtb || amountEtb <= 0 || !gateway) {
        throw new https_1.HttpsError('invalid-argument', 'Missing or invalid parameters: amountEtb, gateway.');
    }
    const amountSantim = (0, santim_1.ethToSantim)(amountEtb);
    const paymentId = crypto.randomUUID();
    const db = admin.firestore();
    // Create a checkout url which redirect to our simulation panel on localhost, or actual checkout page in production
    const checkoutUrl = `http://localhost:5000/wallet?checkoutId=${paymentId}`;
    const pendingPayment = {
        id: paymentId,
        userId: auth.uid,
        gateway,
        amountSantim,
        status: 'pending',
        checkoutUrl,
        createdAt: Date.now()
    };
    await db.collection('pendingPayments').doc(paymentId).set(pendingPayment);
    return { success: true, checkoutUrl, paymentId };
});
// Helper: Verify webhook signature and process deposit
async function processGatewayWebhook(gateway, transactionId, amountSantim, userId, rawBody, signatureHeader, bypassSignature) {
    const db = admin.firestore();
    // 1. Webhook Signature Check
    if (!bypassSignature) {
        // Secret key from env or emulator config
        const secret = process.env.HMAC_SECRET || 'test_hmac_secret';
        if (!signatureHeader) {
            throw new Error('Signature header missing.');
        }
        const computedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');
        if (computedSignature !== signatureHeader) {
            throw new Error('HMAC verification failed.');
        }
    }
    // 2. Transaction Idempotency and Wallet updates
    const processedWebhookRef = db.collection('processedWebhooks').doc(transactionId);
    const userRef = db.collection('users').doc(userId);
    const pendingPaymentRef = db.collection('pendingPayments').doc(transactionId);
    // Queries are not supported inside Firestore transactions, perform check outside
    const priorDepositsQueryRef = db.collection('walletLedger')
        .where('userId', '==', userId)
        .where('type', '==', shared_1.WalletEntryType.DEPOSIT)
        .limit(1);
    const priorDepositsSnap = await priorDepositsQueryRef.get();
    const isFirstDeposit = priorDepositsSnap.empty;
    const config = await (0, config_1.getConfig)();
    const result = await db.runTransaction(async (transaction) => {
        // 1. ALL READS FIRST
        const webhookDoc = await transaction.get(processedWebhookRef);
        if (webhookDoc.exists) {
            return { success: true, duplicate: true };
        }
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new Error(`User ${userId} not found.`);
        }
        const pendingPaymentSnap = await transaction.get(pendingPaymentRef);
        // 2. COMPUTATION
        const userData = userDoc.data();
        const balance = userData?.walletBalanceSantim || 0;
        const newBalance = (0, santim_1.addSantim)(balance, amountSantim);
        // 3. ALL WRITES
        // Write idempotency key
        const processedWebhook = {
            gateway,
            amountSantim,
            userId,
            processedAt: Date.now()
        };
        transaction.set(processedWebhookRef, processedWebhook);
        // Update wallet balance
        transaction.update(userRef, { walletBalanceSantim: newBalance });
        // Record Ledger entry
        const ledgerId = crypto.randomUUID();
        const ledgerEntry = {
            id: ledgerId,
            userId,
            type: shared_1.WalletEntryType.DEPOSIT,
            amountSantim,
            balanceSantim: newBalance,
            gateway,
            transactionId,
            createdAt: Date.now()
        };
        transaction.set(db.collection('walletLedger').doc(ledgerId), ledgerEntry);
        // Handle First Deposit Bonus matching if applicable
        let bonusApplied = false;
        let bonusAmountSantim = 0;
        if (isFirstDeposit) {
            if (!config.killSwitchEnabled && config.bonusFirstDepositPercent > 0) {
                // Calculate bonus
                const calculatedBonus = Math.floor((amountSantim * config.bonusFirstDepositPercent) / 100);
                bonusAmountSantim = Math.min(calculatedBonus, config.bonusFirstDepositCapSantim);
                if (bonusAmountSantim > 0) {
                    const finalBalance = (0, santim_1.addSantim)(newBalance, bonusAmountSantim);
                    transaction.update(userRef, { walletBalanceSantim: finalBalance });
                    // Record Bonus ledger entry
                    const bonusLedgerId = crypto.randomUUID();
                    const bonusLedgerEntry = {
                        id: bonusLedgerId,
                        userId,
                        type: shared_1.WalletEntryType.BONUS,
                        amountSantim: bonusAmountSantim,
                        balanceSantim: finalBalance,
                        createdAt: Date.now()
                    };
                    transaction.set(db.collection('walletLedger').doc(bonusLedgerId), bonusLedgerEntry);
                    bonusApplied = true;
                }
            }
        }
        // Mark pending payment as completed
        if (pendingPaymentSnap.exists) {
            transaction.update(pendingPaymentRef, {
                status: 'completed',
                completedAt: Date.now()
            });
        }
        return {
            success: true,
            duplicate: false,
            bonusApplied,
            bonusAmount: bonusAmountSantim
        };
    });
    return result;
}
// 2. HTTP Webhook Handlers
exports.handleChapaWebhook = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    try {
        const signature = req.headers['x-chapa-signature'];
        const bypassSignature = req.headers['x-sandbox-bypass'] === 'true' && process.env.FUNCTIONS_EMULATOR === 'true';
        const body = req.body;
        // Extract properties
        const { transaction_id, amount_santim, user_id } = body;
        if (!transaction_id || !amount_santim || !user_id) {
            res.status(400).send('Missing body fields.');
            return;
        }
        const rawBody = JSON.stringify(body);
        const result = await processGatewayWebhook(shared_1.Gateway.CHAPA, transaction_id, amount_santim, user_id, rawBody, signature, bypassSignature);
        res.status(200).json(result);
    }
    catch (err) {
        console.error("Chapa webhook error:", err);
        res.status(400).send(err.message || 'Webhook error');
    }
});
exports.handleTelebirrWebhook = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    try {
        const signature = req.headers['x-telebirr-signature'];
        const bypassSignature = req.headers['x-sandbox-bypass'] === 'true' && process.env.FUNCTIONS_EMULATOR === 'true';
        const body = req.body;
        const { transaction_id, amount_santim, user_id } = body;
        if (!transaction_id || !amount_santim || !user_id) {
            res.status(400).send('Missing body fields.');
            return;
        }
        const rawBody = JSON.stringify(body);
        const result = await processGatewayWebhook(shared_1.Gateway.TELEBIRR, transaction_id, amount_santim, user_id, rawBody, signature, bypassSignature);
        res.status(200).json(result);
    }
    catch (err) {
        console.error("Telebirr webhook error:", err);
        res.status(400).send(err.message || 'Webhook error');
    }
});
exports.handleWebirrWebhook = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    try {
        const signature = req.headers['x-webirr-signature'];
        const bypassSignature = req.headers['x-sandbox-bypass'] === 'true' && process.env.FUNCTIONS_EMULATOR === 'true';
        const body = req.body;
        const { transaction_id, amount_santim, user_id } = body;
        if (!transaction_id || !amount_santim || !user_id) {
            res.status(400).send('Missing body fields.');
            return;
        }
        const rawBody = JSON.stringify(body);
        const result = await processGatewayWebhook(shared_1.Gateway.WEBIRR, transaction_id, amount_santim, user_id, rawBody, signature, bypassSignature);
        res.status(200).json(result);
    }
    catch (err) {
        console.error("WeBirr webhook error:", err);
        res.status(400).send(err.message || 'Webhook error');
    }
});
exports.handleCbeWebhook = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    try {
        const signature = req.headers['x-cbe-signature'];
        const bypassSignature = req.headers['x-sandbox-bypass'] === 'true' && process.env.FUNCTIONS_EMULATOR === 'true';
        const body = req.body;
        const { transaction_id, amount_santim, user_id } = body;
        if (!transaction_id || !amount_santim || !user_id) {
            res.status(400).send('Missing body fields.');
            return;
        }
        const rawBody = JSON.stringify(body);
        const result = await processGatewayWebhook(shared_1.Gateway.CBE, transaction_id, amount_santim, user_id, rawBody, signature, bypassSignature);
        res.status(200).json(result);
    }
    catch (err) {
        console.error("CBE webhook error:", err);
        res.status(400).send(err.message || 'Webhook error');
    }
});
//# sourceMappingURL=payments.js.map