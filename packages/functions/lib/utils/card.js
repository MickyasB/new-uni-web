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
exports.generateCardNumbers = generateCardNumbers;
exports.computeCardFingerprint = computeCardFingerprint;
exports.generateUniqueCard = generateUniqueCard;
const crypto = __importStar(require("crypto"));
// Helper to shuffle an array using Fisher-Yates and crypto.randomInt
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}
// Generate numbers for a single column within a range
function generateColNumbers(min, max, count) {
    const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const shuffled = shuffle(pool);
    return shuffled.slice(0, count);
}
function generateCardNumbers() {
    const bCols = generateColNumbers(1, 15, 5);
    const iCols = generateColNumbers(16, 30, 5);
    const nCols = generateColNumbers(31, 45, 4); // 4 numbers, middle is FREE
    const gCols = generateColNumbers(46, 60, 5);
    const oCols = generateColNumbers(61, 75, 5);
    const grid = [];
    for (let r = 0; r < 5; r++) {
        grid[r] = [];
        grid[r][0] = bCols[r];
        grid[r][1] = iCols[r];
        if (r === 2) {
            grid[r][2] = 0; // FREE
        }
        else {
            grid[r][2] = r < 2 ? nCols[r] : nCols[r - 1];
        }
        grid[r][3] = gCols[r];
        grid[r][4] = oCols[r];
    }
    return grid;
}
function computeCardFingerprint(grid) {
    const flattened = grid.flat().join(',');
    return crypto.createHash('sha256').update(flattened).digest('hex');
}
function generateUniqueCard(existingFingerprints) {
    let grid;
    let fingerprint;
    let attempts = 0;
    do {
        grid = generateCardNumbers();
        fingerprint = computeCardFingerprint(grid);
        attempts++;
        if (attempts > 100) {
            throw new Error('Failed to generate a unique card fingerprint in the room after 100 attempts.');
        }
    } while (existingFingerprints.has(fingerprint));
    const id = crypto.randomUUID();
    return {
        id,
        fingerprint,
        numbers: grid,
    };
}
//# sourceMappingURL=card.js.map