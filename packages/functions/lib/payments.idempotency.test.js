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
/**
 * payments.idempotency.test.ts
 *
 * Tests for the webhook idempotency guard and win-review logic.
 * These are unit tests using in-memory state; they do NOT call Firebase.
 */
const vitest_1 = require("vitest");
const crypto = __importStar(require("crypto"));
// ── In-memory Firestore stub ──────────────────────────────────────────────────
class MemStore {
    collections = new Map();
    col(name) {
        if (!this.collections.has(name))
            this.collections.set(name, new Map());
        return this.collections.get(name);
    }
    get(col, id) {
        return this.col(col).get(id) ?? null;
    }
    set(col, id, data) {
        this.col(col).set(id, data);
    }
    update(col, id, patch) {
        const existing = this.col(col).get(id) ?? {};
        this.col(col).set(id, { ...existing, ...patch });
    }
    where(col, field, value) {
        const results = [];
        this.col(col).forEach((doc) => {
            if (doc[field] === value)
                results.push(doc);
        });
        return results;
    }
}
// ── Minimal idempotency logic (extracted from payments.ts for unit testing) ───
async function processDeposit(store, transactionId, amountSantim, userId) {
    // Check idempotency
    const existing = store.get('processedWebhooks', transactionId);
    if (existing)
        return { success: true, duplicate: true };
    const user = store.get('users', userId);
    if (!user)
        throw new Error(`User ${userId} not found.`);
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
async function approveFlaggedWin(store, flaggedWinId, operatorId) {
    const win = store.get('flaggedWins', flaggedWinId);
    if (!win)
        throw new Error('Flagged win not found.');
    if (win.status !== 'pending_review')
        throw new Error('Already processed.');
    const user = store.get('users', win.userId);
    if (!user)
        throw new Error('User not found.');
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
(0, vitest_1.describe)('Webhook Idempotency', () => {
    let store;
    (0, vitest_1.beforeEach)(() => {
        store = new MemStore();
        store.set('users', 'user_1', { walletBalanceSantim: 0 });
    });
    (0, vitest_1.it)('credits wallet on first webhook call', async () => {
        const result = await processDeposit(store, 'tx_001', 5000, 'user_1');
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.duplicate).toBe(false);
        (0, vitest_1.expect)(store.get('users', 'user_1').walletBalanceSantim).toBe(5000);
    });
    (0, vitest_1.it)('ignores duplicate webhook (idempotency guard)', async () => {
        await processDeposit(store, 'tx_001', 5000, 'user_1');
        const result = await processDeposit(store, 'tx_001', 5000, 'user_1');
        (0, vitest_1.expect)(result.duplicate).toBe(true);
        // Balance should NOT be double-credited
        (0, vitest_1.expect)(store.get('users', 'user_1').walletBalanceSantim).toBe(5000);
    });
    (0, vitest_1.it)('handles two different transactions independently', async () => {
        await processDeposit(store, 'tx_A', 1000, 'user_1');
        await processDeposit(store, 'tx_B', 2000, 'user_1');
        (0, vitest_1.expect)(store.get('users', 'user_1').walletBalanceSantim).toBe(3000);
    });
    (0, vitest_1.it)('throws on unknown userId', async () => {
        await (0, vitest_1.expect)(processDeposit(store, 'tx_X', 1000, 'ghost_user')).rejects.toThrow('not found');
    });
});
(0, vitest_1.describe)('Win Review Approval', () => {
    let store;
    (0, vitest_1.beforeEach)(() => {
        store = new MemStore();
        store.set('users', 'player_1', { walletBalanceSantim: 1000 });
        store.set('flaggedWins', 'win_001', {
            userId: 'player_1',
            amountSantim: 50000,
            status: 'pending_review',
        });
    });
    (0, vitest_1.it)('credits winner and marks win as approved', async () => {
        const result = await approveFlaggedWin(store, 'win_001', 'operator_X');
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(store.get('users', 'player_1').walletBalanceSantim).toBe(51000);
        (0, vitest_1.expect)(store.get('flaggedWins', 'win_001').status).toBe('approved');
        (0, vitest_1.expect)(store.get('flaggedWins', 'win_001').processedBy).toBe('operator_X');
    });
    (0, vitest_1.it)('throws if win is already processed', async () => {
        await approveFlaggedWin(store, 'win_001', 'op1');
        await (0, vitest_1.expect)(approveFlaggedWin(store, 'win_001', 'op2')).rejects.toThrow('Already processed.');
    });
    (0, vitest_1.it)('writes a ledger entry of type win', async () => {
        await approveFlaggedWin(store, 'win_001', 'operator_X');
        const ledger = store.where('walletLedger', 'type', 'win');
        (0, vitest_1.expect)(ledger.length).toBe(1);
        (0, vitest_1.expect)(ledger[0].amountSantim).toBe(50000);
        (0, vitest_1.expect)(ledger[0].userId).toBe('player_1');
    });
    (0, vitest_1.it)('throws if win record not found', async () => {
        await (0, vitest_1.expect)(approveFlaggedWin(store, 'nonexistent_win', 'op')).rejects.toThrow('not found');
    });
});
//# sourceMappingURL=payments.idempotency.test.js.map