import { describe, it, expect } from 'vitest';
import { checkWinPattern, calculateTierPrizePools, splitTierPrize } from './win';
import { WinTier } from '@bingo/shared';

describe('Bingo Win Detection & Verification', () => {
  const sampleCard = [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18,  0, 48, 63], // FREE in center
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65]
  ];

  it('should detect row line wins', () => {
    // Row 0 complete
    let res = checkWinPattern(sampleCard, [1, 16, 31, 46, 61]);
    expect(res.line).toBe(true);

    // Row 2 complete (middle is FREE = 0, so only need 4 numbers called)
    res = checkWinPattern(sampleCard, [3, 18, 48, 63]);
    expect(res.line).toBe(true);

    // Row 2 incomplete
    res = checkWinPattern(sampleCard, [3, 18, 48]);
    expect(res.line).toBe(false);
  });

  it('should detect column line wins', () => {
    // Column 0 (B) complete
    let res = checkWinPattern(sampleCard, [1, 2, 3, 4, 5]);
    expect(res.line).toBe(true);

    // Column 2 (N) complete (need 31, 32, 34, 35; 0 is FREE)
    res = checkWinPattern(sampleCard, [31, 32, 34, 35]);
    expect(res.line).toBe(true);
  });

  it('should detect diagonal line wins', () => {
    // Top-left to bottom-right: 1, 17, 0 (FREE), 49, 65
    let res = checkWinPattern(sampleCard, [1, 17, 49, 65]);
    expect(res.line).toBe(true);

    // Top-right to bottom-left: 61, 47, 0 (FREE), 19, 5
    res = checkWinPattern(sampleCard, [61, 47, 19, 5]);
    expect(res.line).toBe(true);
  });

  it('should detect corners wins', () => {
    // Corners: 1, 61, 5, 65
    let res = checkWinPattern(sampleCard, [1, 61, 5, 65]);
    expect(res.corners).toBe(true);
    expect(res.line).toBe(false); // corners only, not line
  });

  it('should detect full house wins', () => {
    // All numbers except center (which is FREE)
    const allNumbers = sampleCard.flat().filter(n => n !== 0);
    let res = checkWinPattern(sampleCard, allNumbers);
    expect(res.fullHouse).toBe(true);
    expect(res.line).toBe(true);
    expect(res.corners).toBe(true);
  });

  it('should allocate 100% of prize pool to single winner regardless of tier', () => {
    // Single Winner mode: every tier key returns the full pool
    const pools = calculateTierPrizePools(511);
    expect(pools[WinTier.LINE]).toBe(511);
    expect(pools[WinTier.CORNERS]).toBe(511);
    expect(pools[WinTier.FULL_HOUSE]).toBe(511);
  });

  it('should split tier prize equally when there is no remainder', () => {
    const winners = [
      { userId: 'u1', cardId: 'c1', fingerprint: 'aaa' },
      { userId: 'u2', cardId: 'c2', fingerprint: 'bbb' }
    ];
    const splits = splitTierPrize(1000, winners);
    expect(splits).toContainEqual({ userId: 'u1', cardId: 'c1', amountSantim: 500 });
    expect(splits).toContainEqual({ userId: 'u2', cardId: 'c2', amountSantim: 500 });
  });

  it('should allocate division remainder to lexicographically last fingerprint', () => {
    const winners = [
      { userId: 'u1', cardId: 'c1', fingerprint: 'ccc' }, // last
      { userId: 'u2', cardId: 'c2', fingerprint: 'aaa' }, // first
      { userId: 'u3', cardId: 'c3', fingerprint: 'bbb' }  // middle
    ];
    // 1000 split by 3. Base share is 333, remainder 1.
    // The winner with fingerprint 'ccc' (u1) should get 334.
    const splits = splitTierPrize(1000, winners);
    expect(splits).toContainEqual({ userId: 'u2', cardId: 'c2', amountSantim: 333 });
    expect(splits).toContainEqual({ userId: 'u3', cardId: 'c3', amountSantim: 333 });
    expect(splits).toContainEqual({ userId: 'u1', cardId: 'c1', amountSantim: 334 });
  });
});
