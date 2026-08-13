import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { WalletLedgerEntry, WalletEntryType } from '@bingo/shared';
import { addSantim } from './utils/santim';

/**
 * Send a push notification to a specific user via FCM.
 * Looks up the user's FCM token from Firestore `users/{uid}.fcmToken`.
 */
async function sendUserNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return;

  const fcmToken = userDoc.data()?.fcmToken;
  if (!fcmToken) return;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'bingo_game',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });
  } catch (err: any) {
    // Token may be invalid/expired — log but don't throw
    console.warn(`FCM send failed for user ${userId}:`, err.message);
    
    // Clean up invalid tokens
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token'
    ) {
      await db.collection('users').doc(userId).update({ fcmToken: admin.firestore.FieldValue.delete() });
    }
  }
}

/**
 * Notify winner(s) of a game when their prize is credited.
 */
export async function notifyWinCredit(
  userId: string,
  amountSantim: number,
  winTier: string
): Promise<void> {
  const amountEtb = (amountSantim / 100).toFixed(2);
  const tierLabel = winTier.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  await sendUserNotification(
    userId,
    '🏆 You Won!',
    `You won ${amountEtb} ETB (${tierLabel})! The prize has been credited to your wallet.`,
    { type: 'win_credit', amount: amountSantim.toString(), tier: winTier }
  );
}

/**
 * Notify a user when their deposit is confirmed and wallet is credited.
 */
export async function notifyDepositConfirmed(
  userId: string,
  amountSantim: number,
  gateway: string
): Promise<void> {
  const amountEtb = (amountSantim / 100).toFixed(2);
  
  await sendUserNotification(
    userId,
    '💰 Deposit Confirmed',
    `${amountEtb} ETB has been added to your wallet via ${gateway.toUpperCase()}.`,
    { type: 'deposit_confirmed', amount: amountSantim.toString(), gateway }
  );
}

/**
 * Notify all players in a room that the game is about to start.
 */
export async function notifyGameStart(
  roomId: string,
  tier: string
): Promise<void> {
  const db = admin.firestore();
  const cardsSnap = await db.collection('rooms').doc(roomId).collection('cards').get();
  
  const playerIds = new Set<string>();
  cardsSnap.docs.forEach(doc => playerIds.add(doc.data().userId));

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  
  const promises = Array.from(playerIds).map(uid =>
    sendUserNotification(
      uid,
      '🎱 Game Starting!',
      `Your ${tierLabel} Bingo game is starting now. Get ready!`,
      { type: 'game_start', roomId, tier }
    )
  );
  
  await Promise.allSettled(promises);
}

/**
 * Callable: Register or update a user's FCM token.
 */
export const registerFcmToken = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.');
  }

  const { token } = request.data as { token: string };
  if (!token) {
    throw new HttpsError('invalid-argument', 'FCM token is required.');
  }

  const db = admin.firestore();
  await db.collection('users').doc(auth.uid).update({ fcmToken: token });

  return { success: true };
});

/**
 * Scheduled function: Auto-approve flagged wins that have exceeded the 30-minute SLA.
 * Spec §4.3: "If no operator action is taken within 30 minutes, the win is auto-approved."
 * Runs every 5 minutes to catch SLA expirations promptly.
 */
export const autoApproveStaleFlaggedWins = onSchedule(
  { schedule: 'every 5 minutes', timeZone: 'Africa/Addis_Ababa' },
  async () => {
    const db = admin.firestore();
    const now = Date.now();
    const slaMs = 30 * 60 * 1000; // 30 minutes

    const staleWinsSnap = await db.collection('flaggedWins')
      .where('status', '==', 'pending_review')
      .get();

    for (const doc of staleWinsSnap.docs) {
      const data = doc.data();
      const flaggedAt = data.flaggedAt || data.createdAt || 0;

      if (now - flaggedAt < slaMs) {
        continue; // Still within SLA window
      }

      // Auto-approve: credit the winner's wallet
      try {
        await db.runTransaction(async (transaction) => {
          const flaggedRef = db.collection('flaggedWins').doc(doc.id);
          const flaggedDoc = await transaction.get(flaggedRef);
          if (!flaggedDoc.exists || flaggedDoc.data()?.status !== 'pending_review') return;

          const winData = flaggedDoc.data()!;
          const userRef = db.collection('users').doc(winData.userId);
          const userDoc = await transaction.get(userRef);

          if (userDoc.exists) {
            const currentBalance = userDoc.data()?.walletBalanceSantim || 0;
            const newBalance = addSantim(currentBalance, winData.amountSantim);

            transaction.update(userRef, { walletBalanceSantim: newBalance });

            // Record ledger entry
            const ledgerId = crypto.randomUUID();
            const ledgerEntry: WalletLedgerEntry = {
              id: ledgerId,
              userId: winData.userId,
              type: WalletEntryType.WIN,
              amountSantim: winData.amountSantim,
              balanceSantim: newBalance,
              createdAt: Date.now(),
            };
            transaction.set(db.collection('walletLedger').doc(ledgerId), ledgerEntry);
          }

          // Mark as auto-approved
          transaction.update(flaggedRef, {
            status: 'approved',
            processedAt: Date.now(),
            processedBy: 'system-auto-approve',
            autoApproved: true,
          });
        });

        // Write audit log
        const auditId = crypto.randomUUID();
        await db.collection('adminAuditLogs').doc(auditId).set({
          id: auditId,
          actorId: 'system-auto-approve',
          actionType: 'auto_approve_flagged_win',
          target: doc.id,
          beforeValue: JSON.stringify({ status: 'pending_review' }),
          afterValue: JSON.stringify({ status: 'approved', autoApproved: true }),
          timestamp: Date.now(),
        });

        // Notify the winner
        await notifyWinCredit(data.userId, data.amountSantim, data.winTier || 'win');

        console.log(`Auto-approved flagged win ${doc.id} after SLA expiry.`);
      } catch (err: any) {
        console.error(`Failed to auto-approve flagged win ${doc.id}:`, err.message);
      }
    }
  }
);
