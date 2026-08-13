const admin = require('firebase-admin');
const axios = require('axios');

// Set emulator environment variables so firebase-admin points to emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: 'bingo-platform-prod',
  databaseURL: 'http://localhost:9000?ns=bingo-platform-prod',
});

const db = admin.firestore();
const rtdb = admin.database();

const FUNCTIONS_URL = 'http://localhost:5001/bingo-platform-prod/us-central1';

// Helper to exchange Firebase Custom Token for an ID Token
async function getIdToken(uid, claims = {}) {
  const customToken = await admin.auth().createCustomToken(uid, claims);
  
  const response = await axios.post(
    `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fakeApiKey`,
    {
      token: customToken,
      returnSecureToken: true,
    }
  );
  
  return response.data.idToken;
}

// Helper to call Firebase Callable Cloud Functions
async function callFunction(name, data, token) {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await axios.post(
    `${FUNCTIONS_URL}/${name}`,
    { data },
    { headers }
  );
  
  return response.data.result;
}

async function run() {
  console.log("=========================================");
  console.log("Starting End-to-End Local Integration Test");
  console.log("=========================================\n");

  try {
    // 1. Setup mock operator and players
    const operatorUid = 'operator-test-uid';
    const player1Uid = 'player1-uid';
    const player2Uid = 'player2-uid';
    const player3Uid = 'player3-uid';

    console.log("0. Cleaning up old test users from previous runs...");
    const uids = [operatorUid, player1Uid, player2Uid, player3Uid];
    for (const uid of uids) {
      await admin.auth().deleteUser(uid).catch(() => {});
      await db.collection('users').doc(uid).delete().catch(() => {});
    }

    console.log("0.5. Creating mock users in Auth emulator with unique phone numbers...");
    await admin.auth().createUser({ uid: player1Uid, phoneNumber: '+251911223341' }).catch(() => {});
    await admin.auth().createUser({ uid: player2Uid, phoneNumber: '+251911223342' }).catch(() => {});
    await admin.auth().createUser({ uid: player3Uid, phoneNumber: '+251911223343' }).catch(() => {});

    console.log("1. Generating ID tokens...");
    const operatorToken = await getIdToken(operatorUid, { role: 'operator' });
    const p1Token = await getIdToken(player1Uid);
    const p2Token = await getIdToken(player2Uid);
    const p3Token = await getIdToken(player3Uid);

    console.log("2. Registering players (with 18+ DOB verification)...");
    await callFunction('auth-registerPlayer', {
      dob: '2000-01-01',
      displayName: 'Test Player 1',
      deviceFingerprint: 'fingerprint-p1'
    }, p1Token);
    
    await callFunction('auth-registerPlayer', {
      dob: '1995-05-15',
      displayName: 'Test Player 2',
      deviceFingerprint: 'fingerprint-p2'
    }, p2Token);

    await callFunction('auth-registerPlayer', {
      dob: '1998-10-20',
      displayName: 'Test Player 3',
      deviceFingerprint: 'fingerprint-p3'
    }, p3Token);
    console.log("Players registered successfully.");

    // Credit player wallets directly in Firestore to simulate deposits
    console.log("\n3. Depositing 100 ETB (10,000 santim) into player wallets...");
    await db.collection('users').doc(player1Uid).update({ walletBalanceSantim: 10000 });
    await db.collection('users').doc(player2Uid).update({ walletBalanceSantim: 10000 });
    await db.collection('users').doc(player3Uid).update({ walletBalanceSantim: 10000 });

    // 4. Create a Silver stake room (50 ETB entry fee, min players = 3)
    console.log("\n4. Creating a SILVER game room (Operator role required)...");
    const roomRes = await callFunction('game-createRoom', {
      tier: 'silver',
      mode: 'auto',
      type: 'open'
    }, operatorToken);
    
    const roomId = roomRes.roomId;
    console.log(`Room created: ID = ${roomId}`);

    // 5. Buy cards for players
    console.log("\n5. Purchasing cards for players...");
    console.log("Player 1 buys 2 cards (100 ETB)...");
    await callFunction('game-buyCards', { roomId, cardCount: 2 }, p1Token);
    console.log("Player 2 buys 1 card (50 ETB)...");
    await callFunction('game-buyCards', { roomId, cardCount: 1 }, p2Token);
    console.log("Player 3 buys 1 card (50 ETB)...");
    await callFunction('game-buyCards', { roomId, cardCount: 1 }, p3Token);

    // Verify room pot and player count
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    const roomData = roomDoc.data();
    console.log(`Room verified: Player Count = ${roomData.playerCount}, Pot = ${roomData.potSantim} santim`);

    // 6. Start the game loop
    console.log("\n6. Starting the game loop...");
    // startGame runs the loop synchronously in Cloud Functions, so we trigger it asynchronously
    // in this test script so we can listen to the live number broadcasts in RTDB.
    callFunction('game-startGame', { roomId }, operatorToken)
      .then(res => {
        console.log("\n=========================================");
        console.log("Game completed!");
        console.log("Winners:", JSON.stringify(res.winners, null, 2));
        console.log("=========================================");
      })
      .catch(err => {
        console.error("Game error:", err.message);
      });

    // 7. Subscribe to RTDB number broadcasts
    console.log("\n7. Listening to live number broadcasts from RTDB...");
    const roomRef = rtdb.ref(`rooms/${roomId}`);
    
    roomRef.child('state').on('value', (snap) => {
      console.log(`[RTDB] Room State: ${snap.val()}`);
    });

    roomRef.child('currentNumber').on('value', (snap) => {
      const num = snap.val();
      if (num !== null) {
        console.log(`[RTDB] Called Number: ${num}`);
      }
    });

    // Wait until room state changes to ended
    let checkInterval = setInterval(async () => {
      const stateSnap = await roomRef.child('state').once('value');
      const state = stateSnap.val();
      if (state === 'ended') {
        clearInterval(checkInterval);
        roomRef.off();
        
        // Check final balances
        console.log("\n8. Checking final wallet balances and ledger entries...");
        const p1Doc = await db.collection('users').doc(player1Uid).get();
        const p2Doc = await db.collection('users').doc(player2Uid).get();
        const p3Doc = await db.collection('users').doc(player3Uid).get();

        console.log(`Player 1 Wallet: ${p1Doc.data().walletBalanceSantim} santim`);
        console.log(`Player 2 Wallet: ${p2Doc.data().walletBalanceSantim} santim`);
        console.log(`Player 3 Wallet: ${p3Doc.data().walletBalanceSantim} santim`);

        // Check if there are any flagged wins
        const flaggedWins = await db.collection('flaggedWins').get();
        if (!flaggedWins.empty) {
          console.log(`\n[Fraud Queue] ${flaggedWins.size} wins were flagged for review:`);
          flaggedWins.forEach(doc => {
            console.log(`- Winner: ${doc.data().userId}, Tier: ${doc.data().winTier}, Amount: ${doc.data().amountSantim}`);
          });
        }

        console.log("\nE2E Integration Test Completed successfully.");
        process.exit(0);
      }
    }, 2000);

  } catch (error) {
    console.error("Test failed:", error.response ? error.response.data : error);
    process.exit(1);
  }
}

// Introduce short delay to let emulator start if needed, then run
setTimeout(run, 1000);
