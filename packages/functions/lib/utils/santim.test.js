"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const santim_1 = require("./santim");
(0, vitest_1.describe)('Santim Monetary Arithmetic', () => {
    (0, vitest_1.it)('should convert eth to santim correctly', () => {
        (0, vitest_1.expect)((0, santim_1.ethToSantim)(10)).toBe(1000);
        (0, vitest_1.expect)((0, santim_1.ethToSantim)(10.55)).toBe(1055);
        (0, vitest_1.expect)((0, santim_1.ethToSantim)(0.01)).toBe(1);
    });
    (0, vitest_1.it)('should convert santim to eth correctly', () => {
        (0, vitest_1.expect)((0, santim_1.santimToEth)(1000)).toBe('10.00');
        (0, vitest_1.expect)((0, santim_1.santimToEth)(1055)).toBe('10.55');
        (0, vitest_1.expect)((0, santim_1.santimToEth)(1)).toBe('0.01');
    });
    (0, vitest_1.it)('should assert integer value', () => {
        (0, vitest_1.expect)(() => (0, santim_1.assertInteger)(10)).not.toThrow();
        (0, vitest_1.expect)(() => (0, santim_1.assertInteger)(10.5)).toThrow();
    });
    (0, vitest_1.it)('should add santim correctly', () => {
        (0, vitest_1.expect)((0, santim_1.addSantim)(100, 200)).toBe(300);
        (0, vitest_1.expect)(() => (0, santim_1.addSantim)(100.5, 200)).toThrow();
    });
    (0, vitest_1.it)('should subtract santim correctly', () => {
        (0, vitest_1.expect)((0, santim_1.subtractSantim)(300, 200)).toBe(100);
        (0, vitest_1.expect)(() => (0, santim_1.subtractSantim)(200, 300)).toThrow();
        (0, vitest_1.expect)(() => (0, santim_1.subtractSantim)(100.5, 50)).toThrow();
    });
});
//# sourceMappingURL=santim.test.js.map