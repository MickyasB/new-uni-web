"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const card_1 = require("./card");
(0, vitest_1.describe)('Bingo Card Generation', () => {
    (0, vitest_1.it)('should generate a 5x5 grid', () => {
        const grid = (0, card_1.generateCardNumbers)();
        (0, vitest_1.expect)(grid.length).toBe(5);
        grid.forEach(row => {
            (0, vitest_1.expect)(row.length).toBe(5);
        });
    });
    (0, vitest_1.it)('should follow column range constraints', () => {
        const grid = (0, card_1.generateCardNumbers)();
        for (let r = 0; r < 5; r++) {
            // Column 0 (B): 1-15
            (0, vitest_1.expect)(grid[r][0]).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(grid[r][0]).toBeLessThanOrEqual(15);
            // Column 1 (I): 16-30
            (0, vitest_1.expect)(grid[r][1]).toBeGreaterThanOrEqual(16);
            (0, vitest_1.expect)(grid[r][1]).toBeLessThanOrEqual(30);
            // Column 2 (N): 31-45 (except row 2 is FREE = 0)
            if (r === 2) {
                (0, vitest_1.expect)(grid[r][2]).toBe(0);
            }
            else {
                (0, vitest_1.expect)(grid[r][2]).toBeGreaterThanOrEqual(31);
                (0, vitest_1.expect)(grid[r][2]).toBeLessThanOrEqual(45);
            }
            // Column 3 (G): 46-60
            (0, vitest_1.expect)(grid[r][3]).toBeGreaterThanOrEqual(46);
            (0, vitest_1.expect)(grid[r][3]).toBeLessThanOrEqual(60);
            // Column 4 (O): 61-75
            (0, vitest_1.expect)(grid[r][4]).toBeGreaterThanOrEqual(61);
            (0, vitest_1.expect)(grid[r][4]).toBeLessThanOrEqual(75);
        }
    });
    (0, vitest_1.it)('should guarantee unique numbers within each column (excluding FREE cell)', () => {
        const grid = (0, card_1.generateCardNumbers)();
        const cols = Array.from({ length: 5 }, (_, c) => {
            const colNumbers = [];
            for (let r = 0; r < 5; r++) {
                if (c === 2 && r === 2)
                    continue; // skip FREE cell
                colNumbers.push(grid[r][c]);
            }
            return colNumbers;
        });
        cols.forEach((col, idx) => {
            const unique = new Set(col);
            (0, vitest_1.expect)(unique.size).toBe(idx === 2 ? 4 : 5);
        });
    });
    (0, vitest_1.it)('should calculate unique SHA-256 fingerprint for different grids', () => {
        const grid1 = (0, card_1.generateCardNumbers)();
        const grid2 = (0, card_1.generateCardNumbers)();
        const fp1 = (0, card_1.computeCardFingerprint)(grid1);
        const fp2 = (0, card_1.computeCardFingerprint)(grid2);
        (0, vitest_1.expect)(fp1.length).toBe(64); // SHA-256 hex string length
        (0, vitest_1.expect)(fp1).not.toBe(fp2);
    });
    (0, vitest_1.it)('should generate unique cards and avoid collisions based on fingerprint sets', () => {
        const existing = new Set();
        const card1 = (0, card_1.generateUniqueCard)(existing);
        existing.add(card1.fingerprint);
        const card2 = (0, card_1.generateUniqueCard)(existing);
        (0, vitest_1.expect)(card1.fingerprint).not.toBe(card2.fingerprint);
        (0, vitest_1.expect)(card1.id).not.toBe(card2.id);
    });
});
//# sourceMappingURL=card.test.js.map