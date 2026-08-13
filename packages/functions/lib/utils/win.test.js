"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const win_1 = require("./win");
const shared_1 = require("@bingo/shared");
(0, vitest_1.describe)('Bingo Win Detection & Verification', () => {
    const sampleCard = [
        [1, 16, 31, 46, 61],
        [2, 17, 32, 47, 62],
        [3, 18, 0, 48, 63], // FREE in center
        [4, 19, 34, 49, 64],
        [5, 20, 35, 50, 65]
    ];
    (0, vitest_1.it)('should detect row line wins', () => {
        // Row 0 complete
        let res = (0, win_1.checkWinPattern)(sampleCard, [1, 16, 31, 46, 61]);
        (0, vitest_1.expect)(res.line).toBe(true);
        // Row 2 complete (middle is FREE = 0, so only need 4 numbers called)
        res = (0, win_1.checkWinPattern)(sampleCard, [3, 18, 48, 63]);
        (0, vitest_1.expect)(res.line).toBe(true);
        // Row 2 incomplete
        res = (0, win_1.checkWinPattern)(sampleCard, [3, 18, 48]);
        (0, vitest_1.expect)(res.line).toBe(false);
    });
    (0, vitest_1.it)('should detect column line wins', () => {
        // Column 0 (B) complete
        let res = (0, win_1.checkWinPattern)(sampleCard, [1, 2, 3, 4, 5]);
        (0, vitest_1.expect)(res.line).toBe(true);
        // Column 2 (N) complete (need 31, 32, 34, 35; 0 is FREE)
        res = (0, win_1.checkWinPattern)(sampleCard, [31, 32, 34, 35]);
        (0, vitest_1.expect)(res.line).toBe(true);
    });
    (0, vitest_1.it)('should detect diagonal line wins', () => {
        // Top-left to bottom-right: 1, 17, 0 (FREE), 49, 65
        let res = (0, win_1.checkWinPattern)(sampleCard, [1, 17, 49, 65]);
        (0, vitest_1.expect)(res.line).toBe(true);
        // Top-right to bottom-left: 61, 47, 0 (FREE), 19, 5
        res = (0, win_1.checkWinPattern)(sampleCard, [61, 47, 19, 5]);
        (0, vitest_1.expect)(res.line).toBe(true);
    });
    (0, vitest_1.it)('should detect corners wins', () => {
        // Corners: 1, 61, 5, 65
        let res = (0, win_1.checkWinPattern)(sampleCard, [1, 61, 5, 65]);
        (0, vitest_1.expect)(res.corners).toBe(true);
        (0, vitest_1.expect)(res.line).toBe(false); // corners only, not line
    });
    (0, vitest_1.it)('should detect full house wins', () => {
        // All numbers except center (which is FREE)
        const allNumbers = sampleCard.flat().filter(n => n !== 0);
        let res = (0, win_1.checkWinPattern)(sampleCard, allNumbers);
        (0, vitest_1.expect)(res.fullHouse).toBe(true);
        (0, vitest_1.expect)(res.line).toBe(true);
        (0, vitest_1.expect)(res.corners).toBe(true);
    });
    (0, vitest_1.it)('should allocate 100% of prize pool to single winner regardless of tier', () => {
        // Single Winner mode: every tier key returns the full pool
        const pools = (0, win_1.calculateTierPrizePools)(511);
        (0, vitest_1.expect)(pools[shared_1.WinTier.LINE]).toBe(511);
        (0, vitest_1.expect)(pools[shared_1.WinTier.CORNERS]).toBe(511);
        (0, vitest_1.expect)(pools[shared_1.WinTier.FULL_HOUSE]).toBe(511);
    });
    (0, vitest_1.it)('should split tier prize equally when there is no remainder', () => {
        const winners = [
            { userId: 'u1', cardId: 'c1', fingerprint: 'aaa' },
            { userId: 'u2', cardId: 'c2', fingerprint: 'bbb' }
        ];
        const splits = (0, win_1.splitTierPrize)(1000, winners);
        (0, vitest_1.expect)(splits).toContainEqual({ userId: 'u1', cardId: 'c1', amountSantim: 500 });
        (0, vitest_1.expect)(splits).toContainEqual({ userId: 'u2', cardId: 'c2', amountSantim: 500 });
    });
    (0, vitest_1.it)('should allocate division remainder to lexicographically last fingerprint', () => {
        const winners = [
            { userId: 'u1', cardId: 'c1', fingerprint: 'ccc' }, // last
            { userId: 'u2', cardId: 'c2', fingerprint: 'aaa' }, // first
            { userId: 'u3', cardId: 'c3', fingerprint: 'bbb' } // middle
        ];
        // 1000 split by 3. Base share is 333, remainder 1.
        // The winner with fingerprint 'ccc' (u1) should get 334.
        const splits = (0, win_1.splitTierPrize)(1000, winners);
        (0, vitest_1.expect)(splits).toContainEqual({ userId: 'u2', cardId: 'c2', amountSantim: 333 });
        (0, vitest_1.expect)(splits).toContainEqual({ userId: 'u3', cardId: 'c3', amountSantim: 333 });
        (0, vitest_1.expect)(splits).toContainEqual({ userId: 'u1', cardId: 'c1', amountSantim: 334 });
    });
});
//# sourceMappingURL=win.test.js.map