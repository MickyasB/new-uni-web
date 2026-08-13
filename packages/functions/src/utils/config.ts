import * as admin from 'firebase-admin';
import { PlatformConfig } from '@bingo/shared';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export async function getConfig(): Promise<PlatformConfig> {
  const docRef = db.collection('platformConfig').doc('global');
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    const defaultConfig: PlatformConfig = {
      killSwitchEnabled: false,
      amlSingleDepositThresholdSantim: 1000000, // 10,000 ETB
      amlRolling30DayThresholdSantim: 5000000,  // 50,000 ETB
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

  return docSnap.data() as PlatformConfig;
}
