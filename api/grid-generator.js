// Generate small crossword grids with black/white cells
// Using simple symmetric pattern generation

function generateGrid(size = 7) {
  // Create a simple symmetric 7x7 grid with crossword patterns
  const grid = Array(size).fill(null).map(() => Array(size).fill('.'));

  if (size === 7) {
    // Simple 7x7 with strategic black squares (180° symmetric)
    const blackSquares = [
      [1, 1], [1, 5], [2, 0], [2, 3], [2, 6],
      [3, 2], [3, 4],
      [4, 1], [4, 5],
      [5, 0], [5, 3], [5, 6],
      [6, 1], [6, 5]
    ];

    for (const [r, c] of blackSquares) {
      grid[r][c] = '#';
      // 180° symmetry
      grid[size - 1 - r][size - 1 - c] = '#';
    }
  } else if (size === 11) {
    // 11x11 grid
    const blackSquares = [
      [0, 3], [0, 7],
      [1, 1], [1, 5], [1, 9],
      [2, 0], [2, 4], [2, 8], [2, 10],
      [3, 2], [3, 6], [3, 10],
      [4, 1], [4, 9],
      [5, 5], // Center area
      [6, 1], [6, 9],
      [7, 0], [7, 4], [7, 8], [7, 10],
      [8, 2], [8, 6], [8, 10],
      [9, 1], [9, 5], [9, 9],
      [10, 3], [10, 7]
    ];

    for (const [r, c] of blackSquares) {
      grid[r][c] = '#';
      grid[size - 1 - r][size - 1 - c] = '#';
    }
  }

  return grid;
}

// Find all across and down slots in grid
function findSlots(grid) {
  const size = grid.length;
  const across = [];
  const down = [];
  const slotNumbers = new Map();
  let number = 1;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '#') continue;

      const isAcrossStart = (c === 0 || grid[r][c - 1] === '#') && (c + 1 < size && grid[r][c + 1] !== '#');
      const isDownStart = (r === 0 || grid[r - 1][c] === '#') && (r + 1 < size && grid[r + 1][c] !== '#');

      if (isAcrossStart || isDownStart) {
        slotNumbers.set(`${r},${c}`, number);
        number++;
      }
    }
  }

  // Extract across slots
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '#') continue;
      if (c === 0 || grid[r][c - 1] === '#') {
        // Start of potential across slot
        let endC = c;
        while (endC < size && grid[r][endC] !== '#') endC++;
        if (endC - c > 1) { // Only slots with 2+ letters
          const number = slotNumbers.get(`${r},${c}`);
          across.push({
            id: `A${number}`,
            number,
            direction: 'across',
            row: r,
            col: c,
            startRow: r,
            startCol: c,
            length: endC - c
          });
        }
      }
    }
  }

  // Extract down slots
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === '#') continue;
      if (r === 0 || grid[r - 1][c] === '#') {
        // Start of potential down slot
        let endR = r;
        while (endR < size && grid[endR][c] !== '#') endR++;
        if (endR - r > 1) { // Only slots with 2+ letters
          const number = slotNumbers.get(`${r},${c}`);
          down.push({
            id: `D${number}`,
            number,
            direction: 'down',
            row: r,
            col: c,
            startRow: r,
            startCol: c,
            length: endR - r
          });
        }
      }
    }
  }

  return { across, down };
}

module.exports = { generateGrid, findSlots };
