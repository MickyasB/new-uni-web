"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const rng_1 = require("./rng");
(0, vitest_1.describe)('Bingo RNG and Commit-Reveal', () => {
    (0, vitest_1.it)('should generate a sequence of exactly 75 unique numbers', () => {
        const seq = (0, rng_1.generateBingoSequence)();
        (0, vitest_1.expect)(seq.length).toBe(75);
        const unique = new Set(seq);
        (0, vitest_1.expect)(unique.size).toBe(75);
    });
    (0, vitest_1.it)('should generate numbers in the range 1 to 75 inclusive', () => {
        const seq = (0, rng_1.generateBingoSequence)();
        seq.forEach(num => {
            (0, vitest_1.expect)(num).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(num).toBeLessThanOrEqual(75);
        });
    });
    (0, vitest_1.it)('should produce SHA-256 seed hash representing the sequence', () => {
        const seq = [1, 2, 3];
        const hash = (0, rng_1.computeSeedHash)(seq);
        (0, vitest_1.expect)(hash).toBe('8a6ae15122001229edb8866f56e342af12ae8187203c3e3b33931743e7c0c48d'); // SHA-256 of "1,2,3"
    });
});
//# sourceMappingURL=rng.test.js.map