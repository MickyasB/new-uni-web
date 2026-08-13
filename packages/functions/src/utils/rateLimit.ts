import * as admin from 'firebase-admin';

/**
 * Rate limiting using Firestore counters.
 * Each rate-limit check creates/updates a doc in `rateLimits/{userId}:{action}`.
 * 
 * @param userId - The user to rate-limit
 * @param action - The action being limited (e.g. 'buyCards', 'withdrawal')
 * @param maxAttempts - Maximum allowed attempts in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if the action is allowed, false if rate-limited
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  maxAttempts: number,
  windowMs: number
): Promise<boolean> {
  const db = admin.firestore();
  const docId = `${userId}:${action}`;
  const ref = db.collection('rateLimits').doc(docId);

  const now = Date.now();
  const windowStart = now - windowMs;

  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);

    if (!doc.exists) {
      // First attempt ever — allow and record
      transaction.set(ref, {
        userId,
        action,
        attempts: [now],
        updatedAt: now,
      });
      return true;
    }

    const data = doc.data()!;
    const attempts: number[] = (data.attempts || []).filter(
      (ts: number) => ts > windowStart
    );

    if (attempts.length >= maxAttempts) {
      return false; // Rate limited
    }

    // Allow and add this attempt
    attempts.push(now);
    transaction.update(ref, {
      attempts,
      updatedAt: now,
    });

    return true;
  });

  return result;
}
