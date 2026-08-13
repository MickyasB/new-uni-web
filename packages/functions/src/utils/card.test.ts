import { describe, it, expect } from 'vitest';
import { generateCardNumbers, computeCardFingerprint, generateUniqueCard } from './card';

describe('Bingo Card Generation', () => {
  it('should generate a 5x5 grid', () => {
    const grid = generateCardNumbers();
    expect(grid.length).toBe(5);
    grid.forEach(row => {
      expect(row.length).toBe(5);
    });
  });

  it('should follow column range constraints', () => {
    const grid = generateCardNumbers();
    for (let r = 0; r < 5; r++) {
      // Column 0 (B): 1-15
      expect(grid[r][0]).toBeGreaterThanOrEqual(1);
      expect(grid[r][0]).toBeLessThanOrEqual(15);

      // Column 1 (I): 16-30
      expect(grid[r][1]).toBeGreaterThanOrEqual(16);
      expect(grid[r][1]).toBeLessThanOrEqual(30);

      // Column 2 (N): 31-45 (except row 2 is FREE = 0)
      if (r === 2) {
        expect(grid[r][2]).toBe(0);
      } else {
        expect(grid[r][2]).toBeGreaterThanOrEqual(31);
        expect(grid[r][2]).toBeLessThanOrEqual(45);
      }

      // Column 3 (G): 46-60
      expect(grid[r][3]).toBeGreaterThanOrEqual(46);
      expect(grid[r][3]).toBeLessThanOrEqual(60);

      // Column 4 (O): 61-75
      expect(grid[r][4]).toBeGreaterThanOrEqual(61);
      expect(grid[r][4]).toBeLessThanOrEqual(75);
    }
  });

  it('should guarantee unique numbers within each column (excluding FREE cell)', () => {
    const grid = generateCardNumbers();
    const cols = Array.from({ length: 5 }, (_, c) => {
      const colNumbers: number[] = [];
      for (let r = 0; r < 5; r++) {
        if (c === 2 && r === 2) continue; // skip FREE cell
        colNumbers.push(grid[r][c]);
      }
      return colNumbers;
    });

    cols.forEach((col, idx) => {
      const unique = new Set(col);
      expect(unique.size).toBe(idx === 2 ? 4 : 5);
    });
  });

  it('should calculate unique SHA-256 fingerprint for different grids', () => {
    const grid1 = generateCardNumbers();
    const grid2 = generateCardNumbers();
    const fp1 = computeCardFingerprint(grid1);
    const fp2 = computeCardFingerprint(grid2);

    expect(fp1.length).toBe(64); // SHA-256 hex string length
    expect(fp1).not.toBe(fp2);
  });

  it('should generate unique cards and avoid collisions based on fingerprint sets', () => {
    const existing = new Set<string>();
    const card1 = generateUniqueCard(existing);
    existing.add(card1.fingerprint);

    const card2 = generateUniqueCard(existing);
    expect(card1.fingerprint).not.toBe(card2.fingerprint);
    expect(card1.id).not.toBe(card2.id);
  });
});
