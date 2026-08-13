import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { 
  Gateway, 
  WalletLedgerEntry, 
  WalletEntryType 
} from '@bingo/shared';
import { ethToSantim, subtractSantim } from './utils/santim';
import { checkRateLimit } from './utils/rateLimit';
import { SECURE_CALL_OPTIONS } from './utils/appCheck';

export const requestWithdrawal = onCall(SECURE_CALL_OPTIONS, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { amountEtb, gateway, accountDetails } = request.data as {
    amountEtb: number;
    gateway: Gateway;
    accountDetails: string;
  };

  if (!amountEtb || amountEtb <= 0 || !gateway || !accountDetails) {
    throw new HttpsError('invalid-argument', 'Missing or invalid parameters: amountEtb, gateway, accountDetails.');
  }

  // Rate limit: max 3 withdrawal requests per user per 24-hour window (spec §4.4)
  const allowed = await checkRateLimit(auth.uid, 'withdrawal', 3, 24 * 60 * 60 * 1000);
  if (!allowed) {
    throw new HttpsError('resource-exhausted', 'Rate limit exceeded: max 3 withdrawal requests per 24 hours.');
  }

  const amountSantim = ethToSantim(amountEtb);
  const uid = auth.uid;
  const db = admin.firestore();
  
  const userRef = db.collection('users').doc(uid);
  const requestId = crypto.randomUUID();
  const withdrawalRequestRef = db.collection('withdrawalRequests').doc(requestId);

  const result = await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User record not found.');
    }

    const userData = userDoc.data();
    const balance = userData?.walletBalanceSantim || 0;

    if (balance < amountSantim) {
      throw new HttpsError('failed-precondition', `Insufficient funds: balance is ${balance} santim, withdrawal requested is ${amountSantim} santim.`);
    }

    const newBalance = subtractSantim(balance, amountSantim);

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
    const ledgerEntry: WalletLedgerEntry = {
      id: ledgerId,
      userId: uid,
      type: WalletEntryType.WITHDRAWAL,
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
