import { describe, it, expect } from 'vitest';
import { generateBingoSequence, computeSeedHash } from './rng';

describe('Bingo RNG and Commit-Reveal', () => {
  it('should generate a sequence of exactly 75 unique numbers', () => {
    const seq = generateBingoSequence();
    expect(seq.length).toBe(75);
    
    const unique = new Set(seq);
    expect(unique.size).toBe(75);
  });

  it('should generate numbers in the range 1 to 75 inclusive', () => {
    const seq = generateBingoSequence();
    seq.forEach(num => {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(75);
    });
  });

  it('should produce SHA-256 seed hash representing the sequence', () => {
    const seq = [1, 2, 3];
    const hash = computeSeedHash(seq);
    expect(hash).toBe('8a6ae15122001229edb8866f56e342af12ae8187203c3e3b33931743e7c0c48d'); // SHA-256 of "1,2,3"
  });
});
