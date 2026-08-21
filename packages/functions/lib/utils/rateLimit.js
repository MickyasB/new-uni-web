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
exports.checkRateLimit = checkRateLimit;
const admin = __importStar(require("firebase-admin"));
/**
 * Rate limiting using Firestore counters.
 * Each rate-limit check creates/updates a doc in `rateLimits/{userId}:{action}`.
 *
 * @param userId - The user to rate-limit
 * @param action - The action being limited (e.g. 'buyCards', 'withdrawal')
 * @param maxAttempts - Maximum allowed attempts in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if the action is allowed, false if rate-limited
 */
async function checkRateLimit(userId, action, maxAttempts, windowMs) {
    const db = admin.firestore();
    const docId = `${userId}:${action}`;
    const ref = db.collection('rateLimits').doc(docId);
    const now = Date.now();
    const windowStart = now - windowMs;
    const result = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(ref);
        if (!doc.exists) {
            // First attempt ever — allow and record
            transaction.set(ref, {
                userId,
                action,
                attempts: [now],
                updatedAt: now,
            });
            return true;
        }
        const data = doc.data();
        const attempts = (data.attempts || []).filter((ts) => ts > windowStart);
        if (attempts.length >= maxAttempts) {
            return false; // Rate limited
        }
        // Allow and add this attempt
        attempts.push(now);
        transaction.update(ref, {
            attempts,
            updatedAt: now,
        });
        return true;
    });
    return result;
}
//# sourceMappingURL=rateLimit.js.map