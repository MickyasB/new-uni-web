import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { WalletLedgerEntry, WalletEntryType } from '@bingo/shared';
import { addSantim } from './utils/santim';
import { getConfig } from './utils/config';

/**
 * Firestore trigger: fires whenever a new walletLedger entry of type ENTRY_FEE is
 * created (i.e. a card purchase). If this is the player's FIRST purchase AND
 * they were referred, we credit the referrer's wallet with the referral bonus.
 */
export const onEntryFeeCreated = onDocumentCreated(
  'walletLedger/{ledgerId}',
  async (event) => {
    const entry = event.data?.data() as WalletLedgerEntry | undefined;
    if (!entry || entry.type !== WalletEntryType.ENTRY_FEE) return;

    const db = admin.firestore();
    const uid = entry.userId;

    // Check if this is the user's first ENTRY_FEE ledger entry
    const prevEntriesSnap = await db
      .collection('walletLedger')
      .where('userId', '==', uid)
      .where('type', '==', WalletEntryType.ENTRY_FEE)
      .get();

    // If more than 1 entry_fee exists, this is NOT the first (the new one was already written)
    if (prevEntriesSnap.size > 1) return;

    // Look up the user's referredBy field
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return;

    const referredBy = userDoc.data()?.referredBy as string | undefined;
    if (!referredBy) return;

    // Fetch config for referral bonus amount
    const config = await getConfig();
    if (config.killSwitchEnabled || config.referralBonusSantim <= 0) return;

    // Check idempotency: avoid double-crediting the same referral
    const idempotencyKey = `referral_bonus_${uid}_to_${referredBy}`;
    const idempotencyRef = db.collection('processedWebhooks').doc(idempotencyKey);
    const idempotencyDoc = await idempotencyRef.get();
    if (idempotencyDoc.exists) return;

    const referrerRef = db.collection('users').doc(referredBy);

    await db.runTransaction(async (transaction) => {
      // Re-check idempotency inside transaction
      const idemDoc = await transaction.get(idempotencyRef);
      if (idemDoc.exists) return;

      const referrerDoc = await transaction.get(referrerRef);
      if (!referrerDoc.exists) return;

      const currentBalance = referrerDoc.data()?.walletBalanceSantim ?? 0;
      const newBalance = addSantim(currentBalance, config.referralBonusSantim);

      // Credit referrer
      transaction.update(referrerRef, { walletBalanceSantim: newBalance });

      // Write ledger entry
      const ledgerId = crypto.randomUUID();
      const ledgerEntry: WalletLedgerEntry = {
        id: ledgerId,
        userId: referredBy,
        type: WalletEntryType.BONUS,
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
  }
);

/**
 * Callable: Manually apply a referral code to a user (if they forgot to enter it at signup).
 * Can only be called once per user and only before their first deposit.
 */
export const applyReferralCode = onCall(async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Must be authenticated.');

  const { referralCode } = request.data as { referralCode: string };
  if (!referralCode?.trim()) {
    throw new HttpsError('invalid-argument', 'referralCode is required.');
  }

  const db = admin.firestore();
  const uid = auth.uid;

  // Ensure user hasn't already made a deposit
  const depositSnap = await db
    .collection('walletLedger')
    .where('userId', '==', uid)
    .where('type', '==', WalletEntryType.DEPOSIT)
    .get();

  if (!depositSnap.empty) {
    throw new HttpsError(
      'failed-precondition',
      'Referral code can only be applied before your first deposit.'
    );
  }

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) throw new HttpsError('not-found', 'User record not found.');
  if (userDoc.data()?.referredBy) {
    throw new HttpsError('already-exists', 'A referral code has already been applied to this account.');
  }

  // Find referrer by code
  const referrerSnap = await db
    .collection('users')
    .where('referralCode', '==', referralCode.trim().toUpperCase())
    .limit(1)
    .get();

  if (referrerSnap.empty) {
    throw new HttpsError('not-found', 'No user found with that referral code.');
  }

  const referrerId = referrerSnap.docs[0].id;
  if (referrerId === uid) {
    throw new HttpsError('invalid-argument', 'You cannot use your own referral code.');
  }

  await db.collection('users').doc(uid).update({ referredBy: referrerId });

  return { success: true, referrerId };
});
