import { OCRParseResult } from '@bingo/shared';

/**
 * Normalizes text extracted from OCR or SMS
 */
export function cleanRawText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[|]/g, 'I')
    .replace(/[—–]/g, '-')
    .trim();
}

/**
 * Extracts CBE FT number or Telebirr Transaction ID from text
 */
export function extractTransactionReference(text: string): { ftNumber: string | null; detectedGateway: 'cbe' | 'telebirr' | null } {
  const clean = cleanRawText(text);

  // 1. CBE FT Pattern (e.g., FT242387654129, FT24085S00918, FT240825.1092.C1)
  const cbeMatch = clean.match(/\b(FT[0-9A-Z]{8,18})\b/i) || 
                   clean.match(/(?:Trans(?:\.|action)?\s*(?:ID|Ref|No|Number)?[\s:]*)(FT[0-9A-Z]{6,18})/i);
  if (cbeMatch) {
    return { ftNumber: cbeMatch[1].toUpperCase().trim(), detectedGateway: 'cbe' };
  }

  // 2. Telebirr Transaction / Receipt ID (e.g., CI1209384938, 20240825129384, REC98127394)
  const telebirrExplicitMatch = clean.match(/(?:Transaction\s*(?:No|ID|Number|Reference)|Receipt\s*No)[\s:]*([0-9A-Z]{8,20})/i);
  if (telebirrExplicitMatch) {
    return { ftNumber: telebirrExplicitMatch[1].toUpperCase().trim(), detectedGateway: 'telebirr' };
  }

  const telebirrPrefixMatch = clean.match(/\b(CI[0-9A-Z]{8,14}|202[4-6][0-9]{10,14}|REC[0-9A-Z]{8,12})\b/i);
  if (telebirrPrefixMatch) {
    return { ftNumber: telebirrPrefixMatch[1].toUpperCase().trim(), detectedGateway: 'telebirr' };
  }

  return { ftNumber: null, detectedGateway: null };
}

/**
 * Extracts transfer amount in ETB from text
 */
export function extractAmount(text: string): number | null {
  const clean = cleanRawText(text);

  // Pattern 1: Explicit labels with ETB/Birr/Amount
  const labelPatterns = [
    /(?:Amount|Total\s*Amount|Debited\s*Amount|Transferred|Paid)[\s:]*(?:ETB|ብር)?[\s:]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /(?:ETB|ብር|Birr)[\s:]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:ETB|Birr|ብር)\b/i,
  ];

  for (const pat of labelPatterns) {
    const m = clean.match(pat);
    if (m && m[1]) {
      const numStr = m[1].replace(/,/g, '');
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 500000) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Detects whether the receipt belongs to CBE or Telebirr
 */
export function detectReceiptGateway(text: string): 'cbe' | 'telebirr' | null {
  const lower = text.toLowerCase();
  if (lower.includes('commercial bank of ethiopia') || lower.includes('cbe') || lower.includes('cbebirr') || lower.includes('cbe birr')) {
    return 'cbe';
  }
  if (lower.includes('telebirr') || lower.includes('ethio telecom') || lower.includes('ethiotelecom')) {
    return 'telebirr';
  }
  return null;
}

/**
 * Extracts payer phone number (09XXXXXXXX or 07XXXXXXXX)
 */
export function extractPhoneNumber(text: string): string | null {
  const m = text.match(/\b(09\d{8}|07\d{8}|\+2519\d{8}|\+2517\d{8}|2519\d{8}|2517\d{8})\b/);
  return m ? m[1] : null;
}

/**
 * Extracts date & time string
 */
export function extractDateString(text: string): string | null {
  const m = text.match(/\b(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?)\b/i) ||
            text.match(/\b(\d{1,2}-[A-Za-z]{3}-\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)\b/i);
  return m ? m[1] : null;
}

/**
 * Full parser that processes raw text (OCR or SMS copy-paste)
 */
export function parseReceiptText(text: string): OCRParseResult {
  const clean = cleanRawText(text);
  const { ftNumber, detectedGateway: gatewayFromFt } = extractTransactionReference(clean);
  const detectedGateway = gatewayFromFt || detectReceiptGateway(clean);
  const amountEtb = extractAmount(clean);
  const payerPhone = extractPhoneNumber(clean);
  const dateStr = extractDateString(clean);

  // Calculate confidence score (0 - 100)
  let confidence = 0;
  if (ftNumber) confidence += 45;
  if (amountEtb && amountEtb > 0) confidence += 35;
  if (detectedGateway) confidence += 10;
  if (dateStr || payerPhone) confidence += 10;

  return {
    ftNumber,
    amountEtb,
    amountSantim: amountEtb ? Math.round(amountEtb * 100) : null,
    gateway: detectedGateway,
    payerName: null,
    payerPhone,
    dateStr,
    rawText: clean,
    confidence: Math.min(100, confidence),
  };
}
