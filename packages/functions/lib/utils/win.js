"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWinPattern = checkWinPattern;
exports.calculateTierPrizePools = calculateTierPrizePools;
exports.splitTierPrize = splitTierPrize;
const shared_1 = require("@bingo/shared");
/**
 * Checks if a card matches the Bingo win patterns based on the called numbers.
 * @param cardNumbers 5x5 grid of card numbers. Center cell is FREE (value 0).
 * @param calledNumbers Numbers called so far.
 */
function checkWinPattern(cardNumbers, calledNumbers) {
    const calledSet = new Set(calledNumbers);
    calledSet.add(0); // Center FREE cell is always marked
    const isMarked = (row, col) => {
        return calledSet.has(cardNumbers[row][col]);
    };
    // 1. Check Line Win (Horizontal, Vertical, Diagonal)
    let hasLine = false;
    // Horizontal rows
    for (let r = 0; r < 5; r++) {
        if (isMarked(r, 0) && isMarked(r, 1) && isMarked(r, 2) && isMarked(r, 3) && isMarked(r, 4)) {
            hasLine = true;
            break;
        }
    }
    // Vertical columns
    if (!hasLine) {
        for (let c = 0; c < 5; c++) {
            if (isMarked(0, c) && isMarked(1, c) && isMarked(2, c) && isMarked(3, c) && isMarked(4, c)) {
                hasLine = true;
                break;
            }
        }
    }
    // Diagonals
    if (!hasLine) {
        // Top-left to bottom-right
        if (isMarked(0, 0) && isMarked(1, 1) && isMarked(2, 2) && isMarked(3, 3) && isMarked(4, 4)) {
            hasLine = true;
        }
        // Top-right to bottom-left
        if (!hasLine && isMarked(0, 4) && isMarked(1, 3) && isMarked(2, 2) && isMarked(3, 1) && isMarked(4, 0)) {
            hasLine = true;
        }
    }
    // 2. Check Corners: Four corners covered
    const corners = isMarked(0, 0) && isMarked(0, 4) && isMarked(4, 0) && isMarked(4, 4);
    // 3. Check Full House: every number covered
    let fullHouse = true;
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (!isMarked(r, c)) {
                fullHouse = false;
                break;
            }
        }
        if (!fullHouse)
            break;
    }
    return {
        line: hasLine,
        corners,
        fullHouse,
    };
}
/**
 * Calculates the prize pool for the single grand winner.
 * Single Winner mode: the first valid claim wins 100% of the player prize pool.
 */
function calculateTierPrizePools(playerPrizePoolSantim) {
    return {
        [shared_1.WinTier.LINE]: playerPrizePoolSantim,
        [shared_1.WinTier.CORNERS]: playerPrizePoolSantim,
        [shared_1.WinTier.FULL_HOUSE]: playerPrizePoolSantim,
    };
}
/**
 * Splits a tier's prize pool among simultaneous winners.
 * The remainder is allocated to the lexicographically last fingerprint.
 */
function splitTierPrize(tierPrizeSantim, winners) {
    if (winners.length === 0)
        return [];
    const count = winners.length;
    const baseShare = Math.floor(tierPrizeSantim / count);
    const remainder = tierPrizeSantim % count;
    // Sort winners by card fingerprint lexicographically ascending
    // The last 'remainder' winners will receive 1 extra santim
    const sortedWinners = [...winners].sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));
    return sortedWinners.map((w, index) => {
        // If the index is in the last 'remainder' elements, add 1 santim
        const bonus = index >= count - remainder ? 1 : 0;
        return {
            userId: w.userId,
            cardId: w.cardId,
            amountSantim: baseShare + bonus,
        };
    });
}
//# sourceMappingURL=win.js.map