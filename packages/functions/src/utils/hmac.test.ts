import { describe, it, expect } from 'vitest';
import { verifyHmac } from './hmac';

describe('verifyHmac', () => {
  const SECRET = 'test_secret_key_for_bingo';

  it('returns true for a valid signature', () => {
    const payload = JSON.stringify({ amount: 10000, userId: 'user_abc', txId: 'tx_001' });
    // Compute the expected signature using Node crypto (matches the implementation)
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    expect(verifyHmac(payload, expected, SECRET)).toBe(true);
  });

  it('returns false for a tampered payload', () => {
    const originalPayload = JSON.stringify({ amount: 10000, userId: 'user_abc' });
    const tamperedPayload = JSON.stringify({ amount: 99999, userId: 'user_abc' });
    const crypto = require('crypto');
    const sig = crypto.createHmac('sha256', SECRET).update(originalPayload).digest('hex');
    expect(verifyHmac(tamperedPayload, sig, SECRET)).toBe(false);
  });

  it('returns false for a wrong secret', () => {
    const payload = JSON.stringify({ amount: 5000 });
    const crypto = require('crypto');
    const sig = crypto.createHmac('sha256', 'correct_secret').update(payload).digest('hex');
    expect(verifyHmac(payload, sig, 'wrong_secret')).toBe(false);
  });

  it('returns false for an empty signature', () => {
    const payload = 'some-payload';
    expect(verifyHmac(payload, '', SECRET)).toBe(false);
  });

  it('returns false for a truncated signature (length mismatch prevents timing attack)', () => {
    const payload = 'some-payload';
    const crypto = require('crypto');
    const fullSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    const truncated = fullSig.slice(0, 32); // half the sha256 hex length
    expect(verifyHmac(payload, truncated, SECRET)).toBe(false);
  });
});
