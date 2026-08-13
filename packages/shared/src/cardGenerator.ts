export function generateBingoCard(): number[][] {
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  const ranges = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];

  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];
    const nums: number[] = [];
    while (nums.length < 5) {
      const r = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!nums.includes(r)) nums.push(r);
    }
    nums.sort((a, b) => a - b);
    for (let row = 0; row < 5; row++) {
      grid[row][col] = nums[row];
    }
  }
  // Free space in middle
  grid[2][2] = 0;
  return grid;
}
