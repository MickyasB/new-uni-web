/**
 * Multilingual Voice Caller Engine for Super Bingo
 * Automatically synchronizes with active i18n language:
 * - English (en)
 * - Amharic (am)
 * - Afaan Oromoo (om)
 * - Tigrinya (ti)
 */

interface VoiceCallParams {
  num: number;
  letter: string;
  lang: string;
}

const AMHARIC_NUMBERS: Record<number, string> = {
  1: 'አንድ', 2: 'ሁለት', 3: 'ሦስት', 4: 'አራት', 5: 'አምስት',
  6: 'ስድስት', 7: 'ሰባት', 8: 'ስምንት', 9: 'ዘጠኝ', 10: 'አስር',
  11: 'አስራ አንድ', 12: 'አስራ ሁለት', 13: 'አስራ ሦስት', 14: 'አስራ አራት', 15: 'አስራ አምስት',
  16: 'አስራ ስድስት', 17: 'አስራ ሰባት', 18: 'አስራ ስምንት', 19: 'አስራ ዘጠኝ', 20: 'ሃያ',
  21: 'ሃያ አንድ', 22: 'ሃያ ሁለት', 23: 'ሃያ ሦስት', 24: 'ሃያ አራት', 25: 'ሃያ አምስት',
  26: 'ሃያ ስድስት', 27: 'ሃያ ሰባት', 28: 'ሃያ ስምንት', 29: 'ሃያ ዘጠኝ', 30: 'ሰላሳ',
  31: 'ሰላሳ አንድ', 32: 'ሰላሳ ሁለት', 33: 'ሰላሳ ሦስት', 34: 'ሰላሳ አራት', 35: 'ሰላሳ አምስት',
  36: 'ሰላሳ ስድስት', 37: 'ሰላሳ ሰባት', 38: 'ሰላሳ ስምንት', 39: 'ሰላሳ ዘጠኝ', 40: 'አርባ',
  41: 'አርባ አንድ', 42: 'አርባ ሁለት', 43: 'አርባ ሦስት', 44: 'አርባ አራት', 45: 'አርባ አምስት',
  46: 'አርባ ስድስት', 47: 'አርባ ሰባት', 48: 'አርባ ስምንት', 49: 'አርባ ዘጠኝ', 50: 'ሃምሳ',
  51: 'ሃምሳ አንድ', 52: 'ሃምሳ ሁለት', 53: 'ሃምሳ ሦስት', 54: 'ሃምሳ አራት', 55: 'ሃምሳ አምስት',
  56: 'ሃምሳ ስድስት', 57: 'ሃምሳ ሰባት', 58: 'ሃምሳ ስምንት', 59: 'ሃምሳ ዘጠኝ', 60: 'ስድሳ',
  61: 'ስድሳ አንድ', 62: 'ስድሳ ሁለት', 63: 'ስድሳ ሦስት', 64: 'ስድሳ አራት', 65: 'ስድሳ አምስት',
  66: 'ስድሳ ስድስት', 67: 'ስድሳ ሰባት', 68: 'ስድሳ ስምንት', 69: 'ስድሳ ዘጠኝ', 70: 'ሰባ',
  71: 'ሰባ አንድ', 72: 'ሰባ ሁለት', 73: 'ሰባ ሦስት', 74: 'ሰባ አራት', 75: 'ሰባ አምስት',
};

const TIGRINYA_NUMBERS: Record<number, string> = {
  1: 'ሓደ', 2: 'ክልተ', 3: 'ሰለስተ', 4: 'ኣርባዕተ', 5: 'ሓሙሽተ',
  6: 'ሽዱሽተ', 7: 'ሸውዓተ', 8: 'ሾሞንተ', 9: 'ትሽዓተ', 10: 'ዓሰርተ',
  11: 'ዓሰርተ ሓደ', 12: 'ዓሰርተ ክልተ', 13: 'ዓሰርተ ሰለስተ', 14: 'ዓሰርተ ኣርባዕተ', 15: 'ዓሰርተ ሓሙሽተ',
  16: 'ዓሰርተ ሽዱሽተ', 17: 'ዓሰርተ ሸውዓተ', 18: 'ዓሰርተ ሾሞንተ', 19: 'ዓሰርተ ትሽዓተ', 20: 'ዕስራ',
  21: 'ዕስራን ሓደን', 22: 'ዕስራን ክልተን', 23: 'ዕስራን ሰለስተን', 24: 'ዕስራን ኣርባዕተን', 25: 'ዕስራን ሓሙሽተን',
  26: 'ዕስራን ሽዱሽተን', 27: 'ዕስራን ሸውዓተን', 28: 'ዕስራን ሾሞንተን', 29: 'ዕስራን ትሽዓተን', 30: 'ሰላሳ',
  40: 'ኣርብዓ', 50: 'ሓምሳ', 60: 'ስሳ', 70: 'ሰብዓ', 75: 'ሰብዓን ሓሙሽተን',
};

const OROMO_NUMBERS: Record<number, string> = {
  1: 'Tokko', 2: 'Lama', 3: 'Sadii', 4: 'Afur', 5: 'Shan',
  6: 'Ja\'a', 7: 'Torba', 8: 'Saddeet', 9: 'Sagal', 10: 'Kudhan',
  11: 'Kudha tokko', 12: 'Kudha lama', 13: 'Kudha sadii', 14: 'Kudha afur', 15: 'Kudha shan',
  16: 'Kudha ja\'a', 17: 'Kudha torba', 18: 'Kudha saddeet', 19: 'Kudha sagal', 20: 'Digdama',
  21: 'Digdamii tokko', 22: 'Digdamii lama', 23: 'Digdamii sadii', 24: 'Digdamii afur', 25: 'Digdamii shan',
  30: 'Soddoma', 40: 'Afurtama', 50: 'Shantama', 60: 'Jaatama', 70: 'Torbaatama', 75: 'Torbaatamii shan',
};

export function speakBingoCall(params: VoiceCallParams) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    const { num, letter, lang } = params;
    let spokenText = `${letter} ${num}`;
    let targetLangCode = 'en-US';

    if (lang === 'am') {
      targetLangCode = 'am-ET';
      const letterAm = letter === 'B' ? 'ቢ' : letter === 'I' ? 'አይ' : letter === 'N' ? 'ኤን' : letter === 'G' ? 'ጂ' : 'ኦ';
      const numAm = AMHARIC_NUMBERS[num] || `${num}`;
      spokenText = `${letterAm} ${numAm}`;
    } else if (lang === 'om') {
      targetLangCode = 'om-ET';
      const numOm = OROMO_NUMBERS[num] || `${num}`;
      spokenText = `${letter} ${numOm}`;
    } else if (lang === 'ti') {
      targetLangCode = 'ti-ET';
      const letterTi = letter === 'B' ? 'ቢ' : letter === 'I' ? 'ኣይ' : letter === 'N' ? 'ኤን' : letter === 'G' ? 'ጂ' : 'ኦ';
      const numTi = TIGRINYA_NUMBERS[num] || `${num}`;
      spokenText = `${letterTi} ${numTi}`;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = targetLangCode;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Find language specific voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(targetLangCode) || v.lang.startsWith(lang)
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Voice caller notice:', e);
  }
}
