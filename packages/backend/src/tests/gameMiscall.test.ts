import { claimWin } from '../services/gameEngine';
import { query } from '../db';
import assert from 'assert';

async function runMiscallTests() {
  console.log('🧪 Testing Manual Bingo Claim & Miscall Blocking Engine...\n');

  const testRoomId = 'room-test-miscall-' + Date.now();
  const testGameId = 'game-test-miscall-' + Date.now();
  const testUserId = 'user-test-player-1';
  const testCardId = 'card-test-1';

  // Card with specific numbers
  const testGrid = [
    [5, 20, 35, 50, 65],
    [10, 25, 40, 55, 70],
    [15, 30, 0, 60, 75],
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
  ];

  // 1. Setup in-memory store / database
  await query(
    `INSERT INTO users (uid, phone, display_name, dob, wallet_balance_santim, referral_code, referred_by, created_at)
     VALUES ($1, '+251911223344', 'Player 1', '1990-01-01', 50000, 'REF1', '', $2)`,
    [testUserId, Date.now()]
  );

  await query(
    `INSERT INTO rooms (id, tier, entry_fee_santim, mode, type, min_players, max_cards, status, player_count, pot_santim, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [testRoomId, 'bronze', 1000, 'auto', 'open', 2, 6, 'active', 2, 5000, Date.now()]
  );

  await query(
    `INSERT INTO games (id, room_id, seed_hash, sequence, called_numbers, status, last_processed_index, winners, blocked_cards, created_at)
     VALUES ($1, $2, 'test_hash', '[]'::jsonb, '[5, 20]'::jsonb, 'active', 1, '[]'::jsonb, '[]'::jsonb, $3)`,
    [testGameId, testRoomId, Date.now()]
  );

  await query(
    `INSERT INTO bingo_cards (id, room_id, user_id, fingerprint, numbers_json, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [testCardId, testRoomId, testUserId, 'fp1', JSON.stringify(testGrid), Date.now()]
  );

  // ─── Test 1: Premature / Invalid Claim (Miscall) ───
  console.log('1. Testing premature BINGO claim (Miscall)...');
  const miscallResult = await claimWin(testRoomId, testGameId, testUserId, testCardId, 'line');
  assert(miscallResult.success === false, 'Claim must fail for uncompleted pattern');
  assert(miscallResult.miscalled === true, 'miscalled flag must be true');
  assert(miscallResult.blocked === true, 'blocked flag must be true');
  console.log('   ✅ Miscall correctly rejected with blocked penalty.');

  // ─── Test 2: Attempting to Claim Again with Blocked Card ───
  console.log('2. Testing re-claim with blocked card...');
  const blockedAttempt = await claimWin(testRoomId, testGameId, testUserId, testCardId, 'line');
  assert(blockedAttempt.success === false, 'Blocked card cannot claim');
  assert(blockedAttempt.blocked === true, 'Card remains blocked');
  console.log('   ✅ Blocked card is prevented from claiming again.');

  // ─── Test 3: Valid Claim on a Second Legitimate Card ───
  console.log('3. Testing valid BINGO claim on second legitimate card...');
  const validCardId = 'card-test-valid-2';
  // Card 2 has top row: [5, 20, 35, 50, 65]
  await query(
    `INSERT INTO bingo_cards (id, room_id, user_id, fingerprint, numbers_json, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [validCardId, testRoomId, testUserId, 'fp2', JSON.stringify(testGrid), Date.now()]
  );

  // Update game called numbers to complete top row [5, 20, 35, 50, 65]
  await query(
    'UPDATE games SET called_numbers = $1 WHERE id = $2',
    [JSON.stringify([5, 20, 35, 50, 65]), testGameId]
  );

  const validResult = await claimWin(testRoomId, testGameId, testUserId, validCardId, 'line');
  console.log('   validResult:', validResult);
  assert(validResult.success === true, 'Legitimate winning card must succeed');
  assert(validResult.winner.cardId === validCardId, 'Winner cardId matches valid card');
  assert(validResult.winner.amountSantim > 0, 'Prize amount calculated and awarded');
  console.log('   ✅ Valid BINGO claim successfully approved and prize awarded.');

  console.log('\n🎉 ALL MISCALL & MANUAL CLAIM TESTS PASSED (100% SUCCESS)!\n');
}

runMiscallTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
