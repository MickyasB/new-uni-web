"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_1 = require("./auth");
(0, vitest_1.describe)('Player Auth & Age Verification', () => {
    (0, vitest_1.it)('should calculate age correctly', () => {
        const today = new Date();
        // Someone born exactly 26 years ago should be 26
        const dob26 = new Date(today);
        dob26.setFullYear(today.getFullYear() - 26);
        (0, vitest_1.expect)((0, auth_1.calculateAge)(dob26.toISOString().slice(0, 10))).toBe(26);
        // Someone born exactly 18 years ago (birthday today) should be 18
        const dob18Today = new Date(today);
        dob18Today.setFullYear(today.getFullYear() - 18);
        (0, vitest_1.expect)((0, auth_1.calculateAge)(dob18Today.toISOString().slice(0, 10))).toBe(18);
        // Someone who will turn 18 tomorrow should still be 17
        const dob18Tomorrow = new Date(today);
        dob18Tomorrow.setFullYear(today.getFullYear() - 18);
        dob18Tomorrow.setDate(dob18Tomorrow.getDate() + 1);
        (0, vitest_1.expect)((0, auth_1.calculateAge)(dob18Tomorrow.toISOString().slice(0, 10))).toBe(17);
    });
    (0, vitest_1.it)('should throw for invalid date string', () => {
        (0, vitest_1.expect)(() => (0, auth_1.calculateAge)('invalid-date')).toThrow();
    });
});
//# sourceMappingURL=auth.test.js.map