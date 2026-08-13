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
exports.getDevCustomToken = exports.registerPlayer = void 0;
exports.calculateAge = calculateAge;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Helper to calculate age in years from DOB string
function calculateAge(dobString) {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid Date of Birth format.');
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}
exports.registerPlayer = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const uid = auth.uid;
    // Fallback for emulator testing: if phone is missing, check providerData or construct one
    let phone = auth.token.phone_number || '';
    if (!phone) {
        // Check if it's set in providerData or mock for test
        const userRecord = await admin.auth().getUser(uid).catch(() => null);
        phone = userRecord?.phoneNumber || '';
    }
    // We only require phone verification unless we're in localhost / testing where phone might be mocked
    const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.VITEST === 'true';
    if (!phone && !isEmulated) {
        throw new https_1.HttpsError('invalid-argument', 'User must have a verified phone number.');
    }
    if (!phone && isEmulated) {
        phone = '+251911223344'; // Mock default for emulator
    }
    const { dob, displayName, deviceFingerprint, referralCode } = request.data;
    if (!dob || !displayName || !deviceFingerprint) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: dob, displayName, deviceFingerprint.');
    }
    // Age Check
    const age = calculateAge(dob);
    if (age < 18) {
        throw new https_1.HttpsError('failed-precondition', 'Player must be at least 18 years old.');
    }
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    // Run in transaction to register user safely
    const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
            return { success: true, user: userDoc.data() };
        }
        // Check if phone number is already registered under another uid
        const phoneQueryRef = db.collection('users').where('phone', '==', phone);
        const phoneQuery = await transaction.get(phoneQueryRef);
        if (!phoneQuery.empty) {
            throw new https_1.HttpsError('already-exists', 'This phone number is already registered under another account.');
        }
        // Generate unique referral code for the new user
        let userReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Check if referred by someone
        let referredByUid;
        if (referralCode) {
            const refQueryRef = db.collection('users').where('referralCode', '==', referralCode);
            const refQuery = await transaction.get(refQueryRef);
            if (!refQuery.empty) {
                referredByUid = refQuery.docs[0].id;
            }
        }
        const newUser = {
            uid,
            phone,
            displayName,
            dob,
            kycStatus: 'pending',
            walletBalanceSantim: 0,
            deviceFingerprint,
            referralCode: userReferralCode,
            referredBy: referredByUid || null,
            createdAt: Date.now(),
            isBanned: false,
        };
        transaction.set(userRef, newUser);
        // Create a referral code mapping
        const refLinkRef = db.collection('referralLinks').doc(userReferralCode);
        transaction.set(refLinkRef, {
            code: userReferralCode,
            ownerId: uid,
            createdAt: Date.now(),
        });
        return { success: true, user: newUser };
    });
    return result;
});
exports.getDevCustomToken = (0, https_1.onCall)(async (request) => {
    if (process.env.FUNCTIONS_EMULATOR !== 'true' && process.env.VITEST !== 'true') {
        throw new https_1.HttpsError('permission-denied', 'This function is only available in emulator mode.');
    }
    const { phone } = request.data;
    const targetPhone = phone || '+251911000000';
    let userRecord;
    try {
        userRecord = await admin.auth().getUserByPhoneNumber(targetPhone);
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            userRecord = await admin.auth().createUser({
                phoneNumber: targetPhone,
            });
        }
        else {
            throw new https_1.HttpsError('internal', error.message || 'Failed to get/create user.');
        }
    }
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    return { customToken, uid: userRecord.uid };
});
//# sourceMappingURL=auth.js.map