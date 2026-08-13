import { query } from '../db';

/**
 * SQL-based rate limiter with sliding window.
 * Uses the rate_limits table to store attempt timestamps per user+action.
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  maxAttempts: number,
  windowMs: number
): Promise<boolean> {
  const docId = `${userId}:${action}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = await query('SELECT attempts FROM rate_limits WHERE id = $1', [docId]);

  if (existing.rowCount === 0) {
    await query(
      'INSERT INTO rate_limits (id, user_id, action, attempts, updated_at) VALUES ($1, $2, $3, $4, $5)',
      [docId, userId, action, JSON.stringify([now]), now]
    );
    return true;
  }

  const rawAttempts: number[] = existing.rows[0].attempts || [];
  const validAttempts = rawAttempts.filter((ts: number) => ts > windowStart);

  if (validAttempts.length >= maxAttempts) {
    return false;
  }

  validAttempts.push(now);
  await query(
    'UPDATE rate_limits SET attempts = $1, updated_at = $2 WHERE id = $3',
    [JSON.stringify(validAttempts), now, docId]
  );

  return true;
}
