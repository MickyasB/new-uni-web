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
exports.notifications = exports.fraud = exports.bonus = exports.adminFns = exports.wallet = exports.payments = exports.game = exports.auth = void 0;
const admin = __importStar(require("firebase-admin"));
// Core modules
const auth_1 = require("./auth");
const game_1 = require("./game");
// Phase 3: Payments
const payments_1 = require("./payments");
// Phase 3: Wallet
const wallet_1 = require("./wallet");
// Phase 3: Admin
const admin_1 = require("./admin");
// Phase 3: Bonus
const bonus_1 = require("./bonus");
if (!admin.apps.length) {
    admin.initializeApp();
}
// ── Callable function groups ──────────────────────────────────────────────────
exports.auth = { registerPlayer: auth_1.registerPlayer, getDevCustomToken: auth_1.getDevCustomToken };
exports.game = { createRoom: game_1.createRoom, buyCards: game_1.buyCards, startGame: game_1.startGame, addMockPlayers: game_1.addMockPlayers, claimBingo: game_1.claimBingo };
exports.payments = {
    createDepositRequest: payments_1.createDepositRequest,
    // HTTP webhooks — exported individually so they get distinct URLs
    handleChapaWebhook: payments_1.handleChapaWebhook,
    handleTelebirrWebhook: payments_1.handleTelebirrWebhook,
    handleWebirrWebhook: payments_1.handleWebirrWebhook,
    handleCbeWebhook: payments_1.handleCbeWebhook,
};
exports.wallet = { requestWithdrawal: wallet_1.requestWithdrawal };
exports.adminFns = {
    updatePlayerStatus: admin_1.updatePlayerStatus,
    approveWithdrawal: admin_1.approveWithdrawal,
    rejectWithdrawal: admin_1.rejectWithdrawal,
    approveFlaggedWin: admin_1.approveFlaggedWin,
    rejectFlaggedWin: admin_1.rejectFlaggedWin,
    getDashboardAnalytics: admin_1.getDashboardAnalytics,
    runManualReconciliation: admin_1.runManualReconciliation,
};
exports.bonus = {
    onEntryFeeCreated: bonus_1.onEntryFeeCreated, // Firestore trigger — auto-registered
    applyReferralCode: // Firestore trigger — auto-registered
    bonus_1.applyReferralCode,
};
// TODO Phase 4: fraud — Auto-flagging, AML monitoring, and collusion detection
exports.fraud = {};
// TODO Phase 4: notifications — FCM and APNs push notification services
exports.notifications = {};
//# sourceMappingURL=index.js.map