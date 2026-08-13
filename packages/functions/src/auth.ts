import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { UserRecord } from '@bingo/shared';
import { SECURE_CALL_OPTIONS } from './utils/appCheck';

// Helper to calculate age in years from DOB string
export function calculateAge(dobString: string): number {
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) {
    throw new HttpsError('invalid-argument', 'Invalid Date of Birth format.');
  }
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export const registerPlayer = onCall(SECURE_CALL_OPTIONS, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
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
    throw new HttpsError('invalid-argument', 'User must have a verified phone number.');
  }
  if (!phone && isEmulated) {
    phone = '+251911223344'; // Mock default for emulator
  }

  const { dob, displayName, deviceFingerprint, referralCode } = request.data as {
    dob: string;
    displayName: string;
    deviceFingerprint: string;
    referralCode?: string;
  };

  if (!dob || !displayName || !deviceFingerprint) {
    throw new HttpsError('invalid-argument', 'Missing required fields: dob, displayName, deviceFingerprint.');
  }

  // Age Check
  const age = calculateAge(dob);
  if (age < 18) {
    throw new HttpsError('failed-precondition', 'Player must be at least 18 years old.');
  }

  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);

  // Run in transaction to register user safely
  const result = await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (userDoc.exists) {
      return { success: true, user: userDoc.data() as UserRecord };
    }

    // Check if phone number is already registered under another uid
    const phoneQueryRef = db.collection('users').where('phone', '==', phone);
    const phoneQuery = await transaction.get(phoneQueryRef);
    if (!phoneQuery.empty) {
      throw new HttpsError('already-exists', 'This phone number is already registered under another account.');
    }

    // Generate unique referral code for the new user
    let userReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Check if referred by someone
    let referredByUid: string | undefined;
    if (referralCode) {
      const refQueryRef = db.collection('users').where('referralCode', '==', referralCode);
      const refQuery = await transaction.get(refQueryRef);
      if (!refQuery.empty) {
        referredByUid = refQuery.docs[0].id;
      }
    }

    const newUser: UserRecord = {
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

export const getDevCustomToken = onCall(SECURE_CALL_OPTIONS, async (request) => {
  if (process.env.FUNCTIONS_EMULATOR !== 'true' && process.env.VITEST !== 'true') {
    throw new HttpsError('permission-denied', 'This function is only available in emulator mode.');
  }

  const { phone } = request.data as { phone: string };
  const targetPhone = phone || '+251911000000';

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByPhoneNumber(targetPhone);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      userRecord = await admin.auth().createUser({
        phoneNumber: targetPhone,
      });
    } else {
      throw new HttpsError('internal', error.message || 'Failed to get/create user.');
    }
  }

  const customToken = await admin.auth().createCustomToken(userRecord.uid);
  return { customToken, uid: userRecord.uid };
});
