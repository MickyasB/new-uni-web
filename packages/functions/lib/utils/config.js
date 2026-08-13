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
exports.getConfig = getConfig;
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
async function getConfig() {
    const docRef = db.collection('platformConfig').doc('global');
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        const defaultConfig = {
            killSwitchEnabled: false,
            amlSingleDepositThresholdSantim: 1000000, // 10,000 ETB
            amlRolling30DayThresholdSantim: 5000000, // 50,000 ETB
            bonusFirstDepositPercent: 10, // 10%
            bonusFirstDepositCapSantim: 5000, // 50 ETB
            referralBonusSantim: 500, // 5 ETB
            maxCardsPerPlayer: 6,
            ipAllowlist: [],
            winAutoApproveThresholdSantim: 100000,
            winSlaMinutes: 30
        };
        await docRef.set(defaultConfig);
        return defaultConfig;
    }
    return docSnap.data();
}
//# sourceMappingURL=config.js.map