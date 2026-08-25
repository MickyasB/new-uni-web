import { OCRParseResult } from '@bingo/shared';
import { parseReceiptText } from '../utils/receiptPatterns';

let tesseract: any = null;
try {
  tesseract = require('tesseract.js');
} catch (e) {
  // tesseract optional runtime dependency
}

/**
 * Service for extracting transaction details from receipt images or SMS text
 */
export class OCRService {
  /**
   * Parses raw text (e.g. from SMS or manual input)
   */
  static parseText(text: string): OCRParseResult {
    return parseReceiptText(text);
  }

  /**
   * Processes image (base64 string or image buffer or URL) and extracts text + transaction details
   */
  static async processImage(imageDataOrBase64: string): Promise<OCRParseResult> {
    try {
      // If it's pure text, parse directly
      if (!imageDataOrBase64.startsWith('data:image') && !imageDataOrBase64.startsWith('http') && imageDataOrBase64.length < 500) {
        return this.parseText(imageDataOrBase64);
      }

      let extractedText = '';

      if (tesseract && (tesseract.createWorker || tesseract.recognize)) {
        try {
          const { data } = await tesseract.recognize(imageDataOrBase64, 'eng', {
            logger: () => {},
          });
          extractedText = data.text || '';
        } catch (tessErr) {
          console.warn('[OCRService] Tesseract recognition failed, falling back to text regex heuristics:', tessErr);
        }
      }

      // If OCR couldn't run or yielded empty text, perform heuristic parsing on whatever text is provided
      const result = parseReceiptText(extractedText || imageDataOrBase64);
      return result;
    } catch (err: any) {
      console.error('[OCRService] Image processing error:', err);
      return {
        ftNumber: null,
        amountEtb: null,
        amountSantim: null,
        gateway: null,
        payerName: null,
        payerPhone: null,
        dateStr: null,
        rawText: '',
        confidence: 0,
      };
    }
  }
}
