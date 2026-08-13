import * as crypto from 'crypto';

export function verifyHmac(payload: string, signature: string, secret: string): boolean {
  const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  
  try {
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(signature, 'hex');
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    // Fallback to timingSafeEqual with utf8 buffers if signature is not hex
    try {
      const a = Buffer.from(computed, 'utf8');
      const b = Buffer.from(signature, 'utf8');
      if (a.length !== b.length) {
        return false;
      }
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
