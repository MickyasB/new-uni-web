import { describe, it, expect } from 'vitest';
import { ethToSantim, santimToEth, assertInteger, addSantim, subtractSantim } from './santim';

describe('Santim Monetary Arithmetic', () => {
  it('should convert eth to santim correctly', () => {
    expect(ethToSantim(10)).toBe(1000);
    expect(ethToSantim(10.55)).toBe(1055);
    expect(ethToSantim(0.01)).toBe(1);
  });

  it('should convert santim to eth correctly', () => {
    expect(santimToEth(1000)).toBe('10.00');
    expect(santimToEth(1055)).toBe('10.55');
    expect(santimToEth(1)).toBe('0.01');
  });

  it('should assert integer value', () => {
    expect(() => assertInteger(10)).not.toThrow();
    expect(() => assertInteger(10.5)).toThrow();
  });

  it('should add santim correctly', () => {
    expect(addSantim(100, 200)).toBe(300);
    expect(() => addSantim(100.5, 200)).toThrow();
  });

  it('should subtract santim correctly', () => {
    expect(subtractSantim(300, 200)).toBe(100);
    expect(() => subtractSantim(200, 300)).toThrow();
    expect(() => subtractSantim(100.5, 50)).toThrow();
  });
});
