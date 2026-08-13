import { describe, it, expect } from 'vitest';
import { calculateAge } from './auth';

describe('Player Auth & Age Verification', () => {
  it('should calculate age correctly', () => {
    const today = new Date();

    // Someone born exactly 26 years ago should be 26
    const dob26 = new Date(today);
    dob26.setFullYear(today.getFullYear() - 26);
    expect(calculateAge(dob26.toISOString().slice(0, 10))).toBe(26);

    // Someone born exactly 18 years ago (birthday today) should be 18
    const dob18Today = new Date(today);
    dob18Today.setFullYear(today.getFullYear() - 18);
    expect(calculateAge(dob18Today.toISOString().slice(0, 10))).toBe(18);

    // Someone who will turn 18 tomorrow should still be 17
    const dob18Tomorrow = new Date(today);
    dob18Tomorrow.setFullYear(today.getFullYear() - 18);
    dob18Tomorrow.setDate(dob18Tomorrow.getDate() + 1);
    expect(calculateAge(dob18Tomorrow.toISOString().slice(0, 10))).toBe(17);
  });

  it('should throw for invalid date string', () => {
    expect(() => calculateAge('invalid-date')).toThrow();
  });
});
