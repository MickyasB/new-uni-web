import { parseReceiptText, extractTransactionReference, extractAmount } from '../utils/receiptPatterns';
import { PaymentVerificationService } from '../services/paymentVerification';
import { query } from '../db';

async function runTests() {
  console.log('🧪 Starting Ethiopian Payment & Receipt Extraction Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ─── Test 1: CBE FT Number Extraction from Receipt Text ───
  const cbeReceiptSample = `
    Commercial Bank of Ethiopia
    Transaction Successful
    Trans. ID: FT240825981245
    Amount: 500.00 ETB
    Debited Account: 1000****1234
    Credited Account: 1000787062044 (Gym General Trading Plc)
    Date: 25/08/2026 16:45:10
  `;
  const cbeParsed = parseReceiptText(cbeReceiptSample);
  assert(cbeParsed.ftNumber === 'FT240825981245', 'CBE FT Number extracted correctly');
  assert(cbeParsed.amountEtb === 500, 'CBE Amount extracted correctly as 500 ETB');
  assert(cbeParsed.gateway === 'cbe', 'CBE Gateway detected correctly');
  assert(cbeParsed.confidence >= 80, `CBE confidence score is high (${cbeParsed.confidence}%)`);

  // ─── Test 2: CBE SMS Message Parsing ───
  const cbeSmsSample = 'Dear Customer, ETB 250.00 has been debited from your account 1000****5678 on 25-Aug-2026. Trans. ID: FT242387654129 to Gym General Trading Plc. Thank you for banking with CBE.';
  const cbeSmsParsed = parseReceiptText(cbeSmsSample);
  assert(cbeSmsParsed.ftNumber === 'FT242387654129', 'CBE SMS FT Number extracted');
  assert(cbeSmsParsed.amountEtb === 250, 'CBE SMS Amount 250 ETB extracted');
  assert(cbeSmsParsed.gateway === 'cbe', 'CBE SMS Gateway detected');

  // ─── Test 3: Telebirr Receipt Extraction ───
  const telebirrReceiptSample = `
    telebirr
    Payment Receipt
    Transaction No: CI1209384938
    Status: Completed
    Amount Transferred: 1,000.00 ETB
    Recipient: 0930044412 (Miniyahil)
    Date: 2026-08-25 16:50:00
  `;
  const telebirrParsed = parseReceiptText(telebirrReceiptSample);
  assert(telebirrParsed.ftNumber === 'CI1209384938', 'Telebirr Transaction ID extracted (CI...)');
  assert(telebirrParsed.amountEtb === 1000, 'Telebirr Amount extracted (1,000.00 ETB)');
  assert(telebirrParsed.gateway === 'telebirr', 'Telebirr Gateway detected');

  // ─── Test 4: Telebirr SMS Message Parsing ───
  const telebirrSmsSample = 'Dear Customer, you have transferred ETB 100.00 to 0930044412 on 25/08/2026 16:55:00. Transaction number is 20260825991823. Your new balance is ETB 450.00.';
  const telebirrSmsParsed = parseReceiptText(telebirrSmsSample);
  assert(telebirrSmsParsed.ftNumber === '20260825991823', 'Telebirr numeric Tx ID extracted from SMS');
  assert(telebirrSmsParsed.amountEtb === 100, 'Telebirr SMS amount extracted');
  assert(telebirrSmsParsed.gateway === 'telebirr', 'Telebirr SMS gateway detected');

  // ─── Test 5: End-to-End Deposit Submission & Approval Lifecycle ───
  const testUid = 'usr_test_verification_' + Date.now();
  const initialBalanceSantim = 5000; // 50 ETB

  // Create test user in store
  await query(
    `INSERT INTO users (uid, phone, display_name, dob, wallet_balance_santim, referral_code, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [testUid, '0999887766', 'Test Verification User', '2000-01-01', initialBalanceSantim, 'REF' + Date.now(), Date.now()]
  );

  const testFt = 'FT' + Date.now();
  const depositAmountEtb = 300; // 300 ETB

  // Submit manual deposit
  const submitRes = await PaymentVerificationService.submitDeposit({
    userId: testUid,
    gateway: 'cbe',
    ftNumber: testFt,
    amountEtb: depositAmountEtb,
    payerName: 'Test Payer',
    payerPhone: '0999887766',
    ocrConfidence: 95,
  });

  assert(submitRes.success === true, 'Manual deposit submitted successfully');
  assert(submitRes.deposit?.status === 'pending', 'Submitted deposit is in pending status');

  // Attempt duplicate submission with the same FT number (Anti-Fraud check)
  const duplicateRes = await PaymentVerificationService.submitDeposit({
    userId: testUid,
    gateway: 'cbe',
    ftNumber: testFt,
    amountEtb: depositAmountEtb,
  });
  assert(duplicateRes.success === false, 'Duplicate FT submission rejected by anti-fraud check');

  // Approve the pending deposit
  if (submitRes.deposit) {
    const approveRes = await PaymentVerificationService.approveDeposit(submitRes.deposit.id, '@SuperAdmin');
    assert(approveRes.success === true, 'Admin approval executed successfully');

    // Verify user balance incremented
    const userRes = await query('SELECT wallet_balance_santim FROM users WHERE uid = $1', [testUid]);
    const expectedBalance = initialBalanceSantim + (depositAmountEtb * 100);
    const actualBalance = parseInt(userRes.rows[0].wallet_balance_santim, 10);
    assert(actualBalance === expectedBalance, `User balance incremented correctly to ${actualBalance} Santim (${actualBalance / 100} ETB)`);

    // Verify deposit status updated
    const depCheck = await query('SELECT status, processed_by FROM manual_deposits WHERE id = $1', [submitRes.deposit.id]);
    assert(depCheck.rows[0].status === 'approved', 'Deposit record marked as approved');
    assert(depCheck.rows[0].processed_by === '@SuperAdmin', 'Processed by recorded as @SuperAdmin');
  }

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
