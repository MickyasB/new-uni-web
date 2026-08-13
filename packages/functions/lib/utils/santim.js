"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertInteger = assertInteger;
exports.ethToSantim = ethToSantim;
exports.santimToEth = santimToEth;
exports.addSantim = addSantim;
exports.subtractSantim = subtractSantim;
function assertInteger(santim) {
    if (!Number.isInteger(santim)) {
        throw new Error(`Value must be an integer santim: ${santim}`);
    }
}
function ethToSantim(eth) {
    const santim = Math.round(eth * 100);
    assertInteger(santim);
    return santim;
}
function santimToEth(santim) {
    assertInteger(santim);
    return (santim / 100).toFixed(2);
}
function addSantim(a, b) {
    assertInteger(a);
    assertInteger(b);
    const result = a + b;
    assertInteger(result);
    return result;
}
function subtractSantim(a, b) {
    assertInteger(a);
    assertInteger(b);
    const result = a - b;
    if (result < 0) {
        throw new Error(`Insufficient funds: cannot subtract ${b} from ${a}`);
    }
    assertInteger(result);
    return result;
}
//# sourceMappingURL=santim.js.map