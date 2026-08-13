import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { 
  Gateway, 
  PendingPayment, 
  WalletLedgerEntry, 
  WalletEntryType,
  ProcessedWebhook
} from '@bingo/shared';
import { ethToSantim, addSantim } from './utils/santim';
import { getConfig } from './utils/config';
import { SECURE_CALL_OPTIONS } from './utils/appCheck';

// 1. Create Deposit Request Call
export const createDepositRequest = onCall(SECURE_CALL_OPTIONS, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { amountEtb, gateway } = request.data as {
    amountEtb: number;
    gateway: Gateway;
  };

  if (!amountEtb || amountEtb <= 0 || !gateway) {
    throw new HttpsError('invalid-argument', 'Missing or invalid parameters: amountEtb, gateway.');
  }

  const amountSantim = ethToSantim(amountEtb);
  const paymentId = crypto.randomUUID();
  const db = admin.firestore();

  // Create a checkout url which redirect to our simulation panel on localhost, or actual checkout page in production
  const checkoutUrl = `http://localhost:5000/wallet?checkoutId=${paymentId}`;

  const pendingPayment: PendingPayment = {
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
async function processGatewayWebhook(
  gateway: Gateway,
  transactionId: string,
  amountSantim: number,
  userId: string,
  rawBody: string,
  signatureHeader: string | undefined,
  bypassSignature: boolean
) {
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
    .where('type', '==', WalletEntryType.DEPOSIT)
    .limit(1);
  const priorDepositsSnap = await priorDepositsQueryRef.get();
  const isFirstDeposit = priorDepositsSnap.empty;

  const config = await getConfig();

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
    const newBalance = addSantim(balance, amountSantim);

    // 3. ALL WRITES
    // Write idempotency key
    const processedWebhook: ProcessedWebhook = {
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
    const ledgerEntry: WalletLedgerEntry = {
      id: ledgerId,
      userId,
      type: WalletEntryType.DEPOSIT,
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
          const finalBalance = addSantim(newBalance, bonusAmountSantim);
          transaction.update(userRef, { walletBalanceSantim: finalBalance });

          // Record Bonus ledger entry
          const bonusLedgerId = crypto.randomUUID();
          const bonusLedgerEntry: WalletLedgerEntry = {
            id: bonusLedgerId,
            userId,
            type: WalletEntryType.BONUS,
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
export const handleChapaWebhook = onRequest({ cors: true }, async (req, res) => {
  try {
    const signature = req.headers['x-chapa-signature'] as string;
    const bypassSignature = req.headers['x-sandbox-bypass'] === 'true' && process.env.FUNCTIONS_EMULATOR === 'true';
    const body = req.body;
    
    // Extract properties
    const { transaction_id, amount_santim, user_id } = body;

    if (!transaction_id || !amount_santim || !user_id) {
      res.status(400).send('Missing body fields.');
      return;
    }

    const rawBody = JSON.stringify(body);
    const result = await processGatewayWebhook(
      Gateway.CHAPA,
      transaction_id,
      amount_santim,
      user_id,
      rawBody,
      signature,
      bypassSignature
    );

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Chapa webhook error:", err);
    res.status(400).send(err.message || 'Webhook error');
  }
});

export const handleTelebirrWebhook = onRequest({ cors: true }, async (req, res) => {
  try {
    const signature = req.headers['x-telebirr-signature'] as string;
    const bypassSignature = req.headers['x-sandbox-bypass'] === 'true' && process.env.FUNCTIONS_EMULATOR === 'true';
    const body = req.body;
    
    const { transaction_id, amount_santim, user_id } = body;

    if (!transaction_id || !amount_santim || !user_id) {
      res.status(400).send('Missing body fields.');
      return;
    }

    const rawBody = JSON.stringify(body);
    const result = await processGatewayWebhook(
      Gateway.TELEBIRR,
      transaction_id,
      amount_santim,
      user_id,
      rawBody,
      signature,
      bypassSignature
    );

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Telebirr webhook error:", err);
    res.status(400).send(err.message || 'Webhook error');
  }
});

export const handleWebirrWebhook = onRequest({ cors: true }, async (req, res) => {
  try {
    const signature = req.headers['x-webirr-signature'] as string;
    const bypassSignature = req.headers['x-sandbox-bypass'] === 'true' && process.env.FUNCTIONS_EMULATOR === 'true';
    const body = req.body;
    
    const { transaction_id, amount_santim, user_id } = body;

    if (!transaction_id || !amount_santim || !user_id) {
      res.status(400).send('Missing body fields.');
      return;
    }

    const rawBody = JSON.stringify(body);
    const result = await processGatewayWebhook(
      Gateway.WEBIRR,
      transaction_id,
      amount_santim,
      user_id,
      rawBody,
      signature,
      bypassSignature
    );

    res.status(200).json(result);
  } catch (err: any) {
    console.error("WeBirr webhook error:", err);
    res.status(400).send(err.message || 'Webhook error');
  }
});

export const handleCbeWebhook = onRequest({ cors: true }, async (req, res) => {
  try {
    const signature = req.headers['x-cbe-signature'] as string;
    const bypassSignature = req.headers['x-sandbox-bypass'] === 'true' && process.env.FUNCTIONS_EMULATOR === 'true';
    const body = req.body;
    
    const { transaction_id, amount_santim, user_id } = body;

    if (!transaction_id || !amount_santim || !user_id) {
      res.status(400).send('Missing body fields.');
      return;
    }

    const rawBody = JSON.stringify(body);
    const result = await processGatewayWebhook(
      Gateway.CBE,
      transaction_id,
      amount_santim,
      user_id,
      rawBody,
      signature,
      bypassSignature
    );

    res.status(200).json(result);
  } catch (err: any) {
    console.error("CBE webhook error:", err);
    res.status(400).send(err.message || 'Webhook error');
  }
});
