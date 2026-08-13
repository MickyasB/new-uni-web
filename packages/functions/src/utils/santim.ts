export function assertInteger(santim: number): void {
  if (!Number.isInteger(santim)) {
    throw new Error(`Value must be an integer santim: ${santim}`);
  }
}

export function ethToSantim(eth: number): number {
  const santim = Math.round(eth * 100);
  assertInteger(santim);
  return santim;
}

export function santimToEth(santim: number): string {
  assertInteger(santim);
  return (santim / 100).toFixed(2);
}

export function addSantim(a: number, b: number): number {
  assertInteger(a);
  assertInteger(b);
  const result = a + b;
  assertInteger(result);
  return result;
}

export function subtractSantim(a: number, b: number): number {
  assertInteger(a);
  assertInteger(b);
  const result = a - b;
  if (result < 0) {
    throw new Error(`Insufficient funds: cannot subtract ${b} from ${a}`);
  }
  assertInteger(result);
  return result;
}
