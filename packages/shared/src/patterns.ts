/**
 * Bingo Custom & Specialty Pattern Engine
 * 
 * Supports:
 * - Standard Lines, Corners, Full House (Coverall)
 * - Shapes & Objects (Kite, Turtle, Airplane, Bowtie, Champagne Glass, Diamond, etc.)
 * - Crazy Rule (Pattern rotatable in 0°, 90°, 180°, 270° orientations)
 * - Anywhere Blocks (2x2 4-Pack, 2x3 6-Pack, 3x3 9-Pack anywhere on card)
 * - Custom Caller/Management Matrix Definitions
 */

export type PatternCategory = 'standard' | 'shapes' | 'crazy' | 'anywhere' | 'custom';

export interface BingoPattern {
  id: string;
  name: string;
  category: PatternCategory;
  description: string;
  isCrazy?: boolean;          // Can be rotated in any 90-degree direction (0°, 90°, 180°, 270°)
  isAnywhereBlock?: boolean;  // Can be shifted anywhere intact within the 5x5 grid
  blockDimensions?: { rows: number; cols: number };
  grid: boolean[][];          // 5x5 matrix
}

/** Rotate a 5x5 grid 90 degrees clockwise */
export function rotateGrid90(grid: boolean[][]): boolean[][] {
  const result: boolean[][] = Array.from({ length: 5 }, () => Array(5).fill(false));
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      result[c][4 - r] = grid[r][c];
    }
  }
  return result;
}

/** Get all 4 rotations for Crazy patterns */
export function getAllRotations(baseGrid: boolean[][]): boolean[][][] {
  const r0 = baseGrid;
  const r90 = rotateGrid90(r0);
  const r180 = rotateGrid90(r90);
  const r270 = rotateGrid90(r180);
  return [r0, r90, r180, r270];
}

/** Get all possible (r, c) translations of an MxN block on a 5x5 grid */
export function getAllBlockTranslations(rows: number, cols: number): boolean[][][] {
  const variations: boolean[][][] = [];
  
  // Normal orientation
  for (let r = 0; r <= 5 - rows; r++) {
    for (let c = 0; c <= 5 - cols; c++) {
      const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
      for (let br = 0; br < rows; br++) {
        for (let bc = 0; bc < cols; bc++) {
          grid[r + br][c + bc] = true;
        }
      }
      variations.push(grid);
    }
  }

  // If rectangular (e.g. 2x3), also add transposed orientation (3x2)
  if (rows !== cols) {
    for (let r = 0; r <= 5 - cols; r++) {
      for (let c = 0; c <= 5 - rows; c++) {
        const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
        for (let br = 0; br < cols; br++) {
          for (let bc = 0; bc < rows; bc++) {
            grid[r + br][c + bc] = true;
          }
        }
        variations.push(grid);
      }
    }
  }

  return variations;
}

/** Check if marked grid satisfies a single target pattern grid */
export function checkSingleGridMatch(markedGrid: boolean[][], targetGrid: boolean[][]): boolean {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      // Center cell (2,2) is always FREE
      if (r === 2 && c === 2) continue;
      if (targetGrid[r][c] && !markedGrid[r][c]) {
        return false;
      }
    }
  }
  return true;
}

/** Check if a marked card satisfies a given BingoPattern */
export function verifyPatternMatch(markedGrid: boolean[][], pattern: BingoPattern): boolean {
  // 1. If Anywhere Block (e.g. 4-Pack, 6-Pack, 9-Pack)
  if (pattern.isAnywhereBlock && pattern.blockDimensions) {
    const { rows, cols } = pattern.blockDimensions;
    const allPlacements = getAllBlockTranslations(rows, cols);
    return allPlacements.some((grid) => checkSingleGridMatch(markedGrid, grid));
  }

  // 2. If Crazy Rule is active (rotatable 90°, 180°, 270°)
  if (pattern.isCrazy) {
    const rotations = getAllRotations(pattern.grid);
    return rotations.some((grid) => checkSingleGridMatch(markedGrid, grid));
  }

  // 3. Exact target pattern match
  return checkSingleGridMatch(markedGrid, pattern.grid);
}

/* ═══════════════════════════════════════════════════════
   BUILT-IN PATTERN CATALOG
   ═══════════════════════════════════════════════════════ */

export const BINGO_PATTERNS: BingoPattern[] = [
  // ── Standard Patterns ──
  {
    id: 'horizontal_line',
    name: 'Horizontal Line',
    category: 'standard',
    description: 'Any complete horizontal row across all 5 numbers.',
    grid: [
      [true, true, true, true, true],
      [false, false, false, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
  },
  {
    id: 'vertical_line',
    name: 'Vertical Line',
    category: 'standard',
    description: 'Any complete vertical column from top to bottom.',
    grid: [
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, true, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false],
    ],
  },
  {
    id: 'diagonal_line',
    name: 'Diagonal',
    category: 'standard',
    description: 'A complete diagonal line from corner to opposite corner.',
    grid: [
      [true, false, false, false, false],
      [false, true, false, false, false],
      [false, false, true, false, false],
      [false, false, false, true, false],
      [false, false, false, false, true],
    ],
  },
  {
    id: 'four_corners',
    name: 'Four Corners',
    category: 'standard',
    description: 'The four outermost corner squares of the card.',
    grid: [
      [true, false, false, false, true],
      [false, false, false, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [true, false, false, false, true],
    ],
  },
  {
    id: 'top_and_bottom',
    name: 'Top and Bottom',
    category: 'standard',
    description: 'All five numbers in the top row and all five in the bottom row.',
    grid: [
      [true, true, true, true, true],
      [false, false, false, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [true, true, true, true, true],
    ],
  },
  {
    id: 'railroad_tracks',
    name: 'Railroad Tracks',
    category: 'standard',
    description: 'All numbers in Column B (left) and Column O (right).',
    grid: [
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, true, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
    ],
  },
  {
    id: 'full_house',
    name: 'Full House (Coverall)',
    category: 'standard',
    description: 'Every single square on the bingo card is covered.',
    grid: [
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
    ],
  },

  // ── Shapes & Objects ──
  {
    id: 'kite',
    name: 'The Kite',
    category: 'shapes',
    description: 'A 2x2 square in the upper corner with a 3-square diagonal tail.',
    grid: [
      [true, true, false, false, false],
      [true, true, false, false, false],
      [false, false, true, false, false],
      [false, false, false, true, false],
      [false, false, false, false, true],
    ],
  },
  {
    id: 'champagne_glass',
    name: 'Champagne Glass',
    category: 'shapes',
    description: 'A glass bowl at the top, center stem, and base at the bottom.',
    grid: [
      [true, true, true, true, true],
      [false, true, true, true, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, true, true, true, false],
    ],
  },
  {
    id: 'airplane',
    name: 'Airplane',
    category: 'shapes',
    description: 'Fuselage down the center column with wide wings across the middle row.',
    grid: [
      [false, false, true, false, false],
      [false, false, true, false, false],
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, true, true, true, false],
    ],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    category: 'shapes',
    description: 'Two triangles meeting in the center knot square.',
    grid: [
      [true, false, false, false, true],
      [true, true, false, true, true],
      [true, true, true, true, true],
      [true, true, false, true, true],
      [true, false, false, false, true],
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'shapes',
    description: 'Diamond shape connecting the midpoints of the outer rows and columns.',
    grid: [
      [false, false, true, false, false],
      [false, true, false, true, false],
      [true, false, true, false, true],
      [false, true, false, true, false],
      [false, false, true, false, false],
    ],
  },
  {
    id: 'picture_frame',
    name: 'Picture Frame',
    category: 'shapes',
    description: 'All 16 numbers along the outer perimeter border of the card.',
    grid: [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, true, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ],
  },
  {
    id: 'letter_x',
    name: 'Letter X',
    category: 'shapes',
    description: 'Both diagonals intersecting through the center free space.',
    grid: [
      [true, false, false, false, true],
      [false, true, false, true, false],
      [false, false, true, false, false],
      [false, true, false, true, false],
      [true, false, false, false, true],
    ],
  },

  // ── Crazy Patterns (Any 90-degree Rotation) ──
  {
    id: 'crazy_t',
    name: 'Crazy T',
    category: 'crazy',
    isCrazy: true,
    description: 'A T-shape that can point Up, Down, Left, or Right (rotatable 90°, 180°, 270°).',
    grid: [
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
    ],
  },
  {
    id: 'crazy_arrow',
    name: 'Crazy Arrow',
    category: 'crazy',
    isCrazy: true,
    description: 'An arrow pointing towards any of the 4 corner directions.',
    grid: [
      [true, true, true, false, false],
      [true, true, false, false, false],
      [true, false, true, false, false],
      [false, false, false, true, false],
      [false, false, false, false, true],
    ],
  },
  {
    id: 'crazy_l',
    name: 'Crazy L',
    category: 'crazy',
    isCrazy: true,
    description: 'An L-shape in any of the 4 cardinal rotations.',
    grid: [
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, true, false, false],
      [true, false, false, false, false],
      [true, true, true, true, true],
    ],
  },
  {
    id: 'crazy_kite',
    name: 'Crazy Kite',
    category: 'crazy',
    isCrazy: true,
    description: 'The Kite shape flying from any of the 4 corners.',
    grid: [
      [true, true, false, false, false],
      [true, true, false, false, false],
      [false, false, true, false, false],
      [false, false, false, true, false],
      [false, false, false, false, true],
    ],
  },

  // ── Anywhere Blocks ──
  {
    id: 'anywhere_4pack',
    name: 'Anywhere 4-Pack',
    category: 'anywhere',
    isAnywhereBlock: true,
    blockDimensions: { rows: 2, cols: 2 },
    description: 'A solid 2x2 block of 4 squares located anywhere on the card.',
    grid: [
      [true, true, false, false, false],
      [true, true, false, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
  },
  {
    id: 'anywhere_6pack',
    name: 'Anywhere 6-Pack',
    category: 'anywhere',
    isAnywhereBlock: true,
    blockDimensions: { rows: 2, cols: 3 },
    description: 'A solid 2x3 or 3x2 block of 6 squares located anywhere on the card.',
    grid: [
      [true, true, true, false, false],
      [true, true, true, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
  },
  {
    id: 'anywhere_9pack',
    name: 'Anywhere 9-Pack',
    category: 'anywhere',
    isAnywhereBlock: true,
    blockDimensions: { rows: 3, cols: 3 },
    description: 'A solid 3x3 block of 9 squares located anywhere on the card.',
    grid: [
      [true, true, true, false, false],
      [true, true, true, false, false],
      [true, true, true, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
  },
];

export function getPatternById(id: string): BingoPattern | undefined {
  return BINGO_PATTERNS.find(p => p.id === id);
}

/**
 * Automatically assign an exciting winning pattern rule for a room based on its tier
 */
export function assignRandomPatternForTier(tier: string = 'bronze'): BingoPattern {
  const normalizedTier = tier.toLowerCase();
  
  if (normalizedTier === 'gold') {
    // Gold Royale gets Crazy patterns or Coverall / High Stakes
    const goldPool = BINGO_PATTERNS.filter(p => p.category === 'crazy' || p.id === 'full_house' || p.category === 'anywhere');
    const pick = goldPool[Math.floor(Math.random() * goldPool.length)];
    return pick || BINGO_PATTERNS[0];
  }

  if (normalizedTier === 'silver') {
    // Silver Hall gets Shapes and Anywhere blocks
    const silverPool = BINGO_PATTERNS.filter(p => p.category === 'shapes' || p.category === 'anywhere' || p.id === 'corners');
    const pick = silverPool[Math.floor(Math.random() * silverPool.length)];
    return pick || BINGO_PATTERNS[0];
  }

  // Bronze Arena gets Standard lines, Corners, or Anywhere 4-Pack
  const bronzePool = BINGO_PATTERNS.filter(p => p.category === 'standard' || p.id === 'anywhere_4pack');
  const pick = bronzePool[Math.floor(Math.random() * bronzePool.length)];
  return pick || BINGO_PATTERNS[0];
}

/**
 * Pattern configuration based on house size & tier
 * - Smallest House: 1 Pattern (Level 1 Complication)
 * - Medium House: 1 Pattern (Level 2 Complication)
 * - Biggest House: 2 Patterns (Primary Level + Secondary Level Complication)
 */
export interface RoomPatternConfig {
  tier: 'bronze' | 'silver' | 'gold';
  complicationLevel: 1 | 2 | 3;
  patternsCount: 1 | 2;
  primaryPattern: BingoPattern;
  secondaryPattern?: BingoPattern;
  description: string;
  primaryRewardPercent: number; // e.g. 80% for primary, 20% for secondary in dual pattern rooms
  secondaryRewardPercent?: number;
}

export function getAutoRoomPatterns(tier: string = 'bronze', entryFeeETB: number = 10): RoomPatternConfig {
  const norm = tier.toLowerCase();
  
  if (norm === 'gold' || entryFeeETB >= 50) {
    // Biggest House: 2 Patterns (Primary Coverall/9-Pack + Secondary Corners/Lines/Kite)
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

/**
 * Format raw user UID into a clean, player-friendly User ID (e.g. SB-49201)
 */
export function formatUserDisplayId(uid?: string): string {
  if (!uid) return 'SB-00000';
  if (uid.startsWith('SB-')) return uid;
  
  // Extract alphanumeric characters
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '');
  const suffix = clean.length >= 5 ? clean.slice(-5).toUpperCase() : clean.padEnd(5, '0').toUpperCase();
  return `SB-${suffix}`;
}
