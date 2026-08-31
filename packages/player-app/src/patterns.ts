import { BingoPattern, BINGO_PATTERNS } from '@bingo/shared';

export interface RoomPatternConfig {
  tier: 'bronze' | 'silver' | 'gold';
  complicationLevel: 1 | 2 | 3;
  patternsCount: 1 | 2;
  primaryPattern: BingoPattern;
  secondaryPattern?: BingoPattern;
  description: string;
  primaryRewardPercent: number;
  secondaryRewardPercent?: number;
}

export function getAutoRoomPatterns(tier: string = 'bronze', entryFeeETB: number = 10): RoomPatternConfig {
  const norm = tier.toLowerCase();
  
  if (norm === 'gold' || entryFeeETB >= 50) {
    // Biggest House: 2 Patterns (Primary Coverall + Secondary Corners/Line/Kite)
    const primary = BINGO_PATTERNS.find(p => p.id === 'full_house') || BINGO_PATTERNS[0];
    const secondary = BINGO_PATTERNS.find(p => p.id === 'corners' || p.id === 'crazy_kite' || p.id === 'letter_x') || BINGO_PATTERNS[1];
    
    return {
      tier: 'gold',
      complicationLevel: 3,
      patternsCount: 2,
      primaryPattern: primary,
      secondaryPattern: secondary,
      description: `Primary: ${primary.name} (Grand Jackpot) · Secondary: ${secondary.name} (Royal Bonus)`,
      primaryRewardPercent: 80,
      secondaryRewardPercent: 20,
    };
  }

  if (norm === 'silver' || entryFeeETB >= 20) {
    // Medium House: 1 Pattern (Level 2 Complication)
    const primary = BINGO_PATTERNS.find(p => p.id === 'anywhere_4pack' || p.id === 'diamond' || p.id === 'corners') || BINGO_PATTERNS[2];
    return {
      tier: 'silver',
      complicationLevel: 2,
      patternsCount: 1,
      primaryPattern: primary,
      description: `Target Pattern: ${primary.name}`,
      primaryRewardPercent: 100,
    };
  }

  // Smallest House: 1 Pattern (Level 1 Complication)
  const primary = BINGO_PATTERNS.find(p => p.id === 'horizontal_line' || p.id === 'vertical_line' || p.id === 'diagonal_line') || BINGO_PATTERNS[0];
  return {
    tier: 'bronze',
    complicationLevel: 1,
    patternsCount: 1,
    primaryPattern: primary,
    description: `Target Pattern: Any Line (${primary.name})`,
    primaryRewardPercent: 100,
  };
}
