import * as crypto from 'crypto';

export function generateBingoSequence(): number[] {
  const numbers: number[] = Array.from({ length: 75 }, (_, i) => i + 1);
  
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const temp = numbers[i];
    numbers[i] = numbers[j];
    numbers[j] = temp;
  }
  
  return numbers;
}

export function computeSeedHash(sequence: number[]): string {
  const data = sequence.join(',');
  return crypto.createHash('sha256').update(data).digest('hex');
}
