/**
 * payments.idempotency.test.ts
 *
 * Tests for the webhook idempotency guard and win-review logic.
 * These are unit tests using in-memory state; they do NOT call Firebase.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as crypto from 'crypto';

// ── In-memory Firestore stub ──────────────────────────────────────────────────
class MemStore {
  private collections: Map<string, Map<string, any>> = new Map();

  col(name: string) {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    return this.collections.get(name)!;
  }

  get(col: string, id: string) {
    return this.col(col).get(id) ?? null;
  }

  set(col: string, id: string, data: any) {
    this.col(col).set(id, data);
  }

  update(col: string, id: string, patch: any) {
    const existing = this.col(col).get(id) ?? {};
    this.col(col).set(id, { ...existing, ...patch });
  }

  where(col: string, field: string, value: any) {
    const results: any[] = [];
    this.col(col).forEach((doc) => {
      if (doc[field] === value) results.push(doc);
    });
    return results;
  }
}

// ── Minimal idempotency logic (extracted from payments.ts for unit testing) ───
async function processDeposit(
  store: MemStore,
  transactionId: string,
  amountSantim: number,
  userId: string
): Promise<{ success: boolean; duplicate: boolean }> {
  // Check idempotency
  const existing = store.get('processedWebhooks', transactionId);
  if (existing) return { success: true, duplicate: true };

  const user = store.get('users', userId);
  if (!user) throw new Error(`User ${userId} not found.`);

  const newBalance = (user.walletBalanceSantim ?? 0) + amountSantim;

  // Atomic writes (simulated)
  store.set('processedWebhooks', transactionId, {
    userId,
    amountSantim,
    processedAt: Date.now(),
  });
  store.update('users', userId, { walletBalanceSantim: newBalance });

  const ledgerId = crypto.randomUUID();
  store.set('walletLedger', ledgerId, {
    id: ledgerId,
    userId,
    type: 'deposit',
    amountSantim,
    balanceSantim: newBalance,
    createdAt: Date.now(),
  });

  return { success: true, duplicate: false };
}

// ── Minimal win-review approval logic ────────────────────────────────────────
async function approveFlaggedWin(
  store: MemStore,
  flaggedWinId: string,
  operatorId: string
): Promise<{ success: boolean }> {
  const win = store.get('flaggedWins', flaggedWinId);
  if (!win) throw new Error('Flagged win not found.');
  if (win.status !== 'pending_review') throw new Error('Already processed.');

  const user = store.get('users', win.userId);
  if (!user) throw new Error('User not found.');

  const newBalance = (user.walletBalanceSantim ?? 0) + win.amountSantim;

  store.update('users', win.userId, { walletBalanceSantim: newBalance });
  store.update('flaggedWins', flaggedWinId, {
    status: 'approved',
    processedAt: Date.now(),
    processedBy: operatorId,
  });

  const ledgerId = crypto.randomUUID();
  store.set('walletLedger', ledgerId, {
    id: ledgerId,
    userId: win.userId,
    type: 'win',
    amountSantim: win.amountSantim,
    balanceSantim: newBalance,
    createdAt: Date.now(),
  });

  return { success: true };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Webhook Idempotency', () => {
  let store: MemStore;

  beforeEach(() => {
    store = new MemStore();
    store.set('users', 'user_1', { walletBalanceSantim: 0 });
  });

  it('credits wallet on first webhook call', async () => {
    const result = await processDeposit(store, 'tx_001', 5000, 'user_1');
    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(false);
    expect(store.get('users', 'user_1').walletBalanceSantim).toBe(5000);
  });

  it('ignores duplicate webhook (idempotency guard)', async () => {
    await processDeposit(store, 'tx_001', 5000, 'user_1');
    const result = await processDeposit(store, 'tx_001', 5000, 'user_1');
    expect(result.duplicate).toBe(true);
    // Balance should NOT be double-credited
    expect(store.get('users', 'user_1').walletBalanceSantim).toBe(5000);
  });

  it('handles two different transactions independently', async () => {
    await processDeposit(store, 'tx_A', 1000, 'user_1');
    await processDeposit(store, 'tx_B', 2000, 'user_1');
    expect(store.get('users', 'user_1').walletBalanceSantim).toBe(3000);
  });

  it('throws on unknown userId', async () => {
    await expect(
      processDeposit(store, 'tx_X', 1000, 'ghost_user')
    ).rejects.toThrow('not found');
  });
});

describe('Win Review Approval', () => {
  let store: MemStore;

  beforeEach(() => {
    store = new MemStore();
    store.set('users', 'player_1', { walletBalanceSantim: 1000 });
    store.set('flaggedWins', 'win_001', {
      userId: 'player_1',
      amountSantim: 50000,
      status: 'pending_review',
    });
  });

  it('credits winner and marks win as approved', async () => {
    const result = await approveFlaggedWin(store, 'win_001', 'operator_X');
    expect(result.success).toBe(true);
    expect(store.get('users', 'player_1').walletBalanceSantim).toBe(51000);
    expect(store.get('flaggedWins', 'win_001').status).toBe('approved');
    expect(store.get('flaggedWins', 'win_001').processedBy).toBe('operator_X');
  });

  it('throws if win is already processed', async () => {
    await approveFlaggedWin(store, 'win_001', 'op1');
    await expect(approveFlaggedWin(store, 'win_001', 'op2')).rejects.toThrow(
      'Already processed.'
    );
  });

  it('writes a ledger entry of type win', async () => {
    await approveFlaggedWin(store, 'win_001', 'operator_X');
    const ledger = store.where('walletLedger', 'type', 'win');
    expect(ledger.length).toBe(1);
    expect(ledger[0].amountSantim).toBe(50000);
    expect(ledger[0].userId).toBe('player_1');
  });

  it('throws if win record not found', async () => {
    await expect(
      approveFlaggedWin(store, 'nonexistent_win', 'op')
    ).rejects.toThrow('not found');
  });
});
