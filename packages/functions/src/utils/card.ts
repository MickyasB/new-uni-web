import * as crypto from 'crypto';
import { BingoCard } from '@bingo/shared';

// Helper to shuffle an array using Fisher-Yates and crypto.randomInt
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

// Generate numbers for a single column within a range
function generateColNumbers(min: number, max: number, count: number): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const shuffled = shuffle(pool);
  return shuffled.slice(0, count);
}

export function generateCardNumbers(): number[][] {
  const bCols = generateColNumbers(1, 15, 5);
  const iCols = generateColNumbers(16, 30, 5);
  const nCols = generateColNumbers(31, 45, 4); // 4 numbers, middle is FREE
  const gCols = generateColNumbers(46, 60, 5);
  const oCols = generateColNumbers(61, 75, 5);

  const grid: number[][] = [];
  for (let r = 0; r < 5; r++) {
    grid[r] = [];
    grid[r][0] = bCols[r];
    grid[r][1] = iCols[r];
    if (r === 2) {
      grid[r][2] = 0; // FREE
    } else {
      grid[r][2] = r < 2 ? nCols[r] : nCols[r - 1];
    }
    grid[r][3] = gCols[r];
    grid[r][4] = oCols[r];
  }

  return grid;
}

export function computeCardFingerprint(grid: number[][]): string {
  const flattened = grid.flat().join(',');
  return crypto.createHash('sha256').update(flattened).digest('hex');
}

export function generateUniqueCard(existingFingerprints: Set<string>): BingoCard {
  let grid: number[][];
  let fingerprint: string;
  let attempts = 0;

  do {
    grid = generateCardNumbers();
    fingerprint = computeCardFingerprint(grid);
    attempts++;
    if (attempts > 100) {
      throw new Error('Failed to generate a unique card fingerprint in the room after 100 attempts.');
    }
  } while (existingFingerprints.has(fingerprint));

  const id = crypto.randomUUID();
  return {
    id,
    fingerprint,
    numbers: grid,
  };
}
