// Improved CSP Solver for Crosswords with better debugging

class CSPSolver {
  constructor(grid, acrossSlots, downSlots, wordsByLength) {
    this.grid = grid;
    this.rows = grid.length;
    this.cols = grid[0].length;
    this.allSlots = [...acrossSlots, ...downSlots];
    this.wordsByLength = wordsByLength;
    this.acrossSlots = acrossSlots;
    this.downSlots = downSlots;
    this.assignment = new Map();
    this.domains = new Map();
    this.usedWords = new Set();
    this.maxIterations = 10000;
    this.iterations = 0;
  }

  initializeDomains() {
    for (const slot of this.allSlots) {
      const len = slot.length;
      const words = (this.wordsByLength[len] || []).filter(w => w.length === len && /^[A-Z]+$/.test(w));
      if (words.length === 0) {
        // If no words of exact length, generate some simple ones
        const simpleWords = this.generateSimpleWords(len);
        this.domains.set(slot.id, simpleWords);
      } else {
        this.domains.set(slot.id, words);
      }
    }
  }

  // Generate simple words of given length for fallback
  generateSimpleWords(len) {
    const simple = {
      2: ['AB', 'AT', 'BE', 'BY', 'DO', 'GO', 'HE', 'IF', 'IN', 'IS', 'IT', 'ME', 'MY', 'NO', 'OF', 'ON', 'OR', 'SO', 'TO', 'UP', 'US', 'WE'],
      3: ['THE', 'AND', 'FOR', 'ARE', 'YOU', 'ALL', 'NOT', 'BUT', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS'],
      4: ['THAT', 'WITH', 'HAVE', 'THIS', 'WILL', 'YOUR', 'FROM', 'THEY', 'KNOW', 'WANT', 'BEEN', 'GOOD', 'MUCH', 'SOME', 'TIME', 'VERY', 'WHEN', 'COME', 'HERE', 'JUST', 'LIKE', 'LONG', 'MAKE', 'MANY', 'OVER', 'SUCH', 'TAKE'],
      5: ['ABOUT', 'AFTER', 'AGAIN', 'COULD', 'EVERY', 'FIRST', 'GREAT', 'HOUSE', 'LARGE', 'OTHER', 'PLACE', 'RIGHT', 'SMALL', 'STILL', 'THEIR', 'THERE', 'THESE', 'THING', 'THINK', 'THREE', 'WATER', 'WHERE', 'WHICH', 'WHILE', 'WORLD', 'WOULD', 'WRITE'],
      6: ['BEFORE', 'CHANGE', 'PEOPLE', 'SHOULD', 'SYSTEM', 'DURING', 'THINGS', 'TURNED', 'CALLED', 'BETTER', 'FRIEND', 'MOTHER', 'NUMBER', 'SECOND', 'THOUGH', 'ALWAYS', 'AROUND', 'BECAME', 'FATHER', 'FOLLOW'],
      7: ['ANOTHER', 'BECAUSE', 'BETWEEN', 'GENERAL', 'THROUGH', 'WITHOUT', 'PRESENT', 'PROBLEM', 'SPECIAL', 'CHAPTER', 'PICTURE', 'WORKING', 'NOTHING', 'HIMSELF', 'HERSELF', 'AGAINST', 'MORNING']
    };
    return simple[len] || [];
  }

  // Find intersecting slot
  findIntersection(slot, wordIdx) {
    let intersectingSlots = [];

    if (slot.direction === 'across') {
      const col = slot.col + wordIdx;
      const row = slot.row;
      for (const ds of this.downSlots) {
        if (ds.startCol === col && ds.startRow <= row && row < ds.startRow + ds.length) {
          const dsIdx = row - ds.startRow;
          intersectingSlots.push({ slot: ds, index: dsIdx });
        }
      }
    } else {
      const col = slot.col;
      const row = slot.row + wordIdx;
      for (const as of this.acrossSlots) {
        if (as.startRow === row && as.startCol <= col && col < as.startCol + as.length) {
          const asIdx = col - as.startCol;
          intersectingSlots.push({ slot: as, index: asIdx });
        }
      }
    }

    return intersectingSlots;
  }

  isCompatible(slot, word) {
    for (let i = 0; i < word.length; i++) {
      const intersections = this.findIntersection(slot, i);
      for (const { slot: intSlot, index: intIdx } of intersections) {
        if (this.assignment.has(intSlot.id)) {
          const assignedWord = this.assignment.get(intSlot.id);
          if (assignedWord[intIdx] !== word[i]) return false;
        }
      }
    }
    return true;
  }

  selectUnassignedVariable() {
    let minSlot = null;
    let minCount = Infinity;
    for (const slot of this.allSlots) {
      if (!this.assignment.has(slot.id)) {
        const validWords = this.domains.get(slot.id).filter(w => this.isCompatible(slot, w) && !this.usedWords.has(w));
        const count = validWords.length;
        if (count === 0) return null;
        if (count < minCount) {
          minCount = count;
          minSlot = slot;
        }
      }
    }
    return minSlot;
  }

  solve() {
    this.iterations++;
    if (this.iterations > this.maxIterations) return false;

    if (this.assignment.size === this.allSlots.length) return true;

    const slot = this.selectUnassignedVariable();
    if (!slot) return false;

    const validWords = this.domains.get(slot.id)
      .filter(w => this.isCompatible(slot, w) && !this.usedWords.has(w));

    for (const word of validWords) {
      this.assignment.set(slot.id, word);
      this.usedWords.add(word);

      if (this.solve()) return true;

      this.assignment.delete(slot.id);
      this.usedWords.delete(word);
    }

    return false;
  }

  run() {
    this.initializeDomains();
    if (this.solve()) {
      return this.buildPuzzle();
    }
    return null;
  }

  buildPuzzle() {
    const puzzle = {
      grid: Array(this.rows).fill(null).map(() => Array(this.cols).fill('.')),
      answers: {
        across: [],
        down: []
      },
      clues: {}
    };

    for (const [slotId, word] of this.assignment) {
      const slot = this.allSlots.find(s => s.id === slotId);
      for (let i = 0; i < word.length; i++) {
        const r = slot.direction === 'across' ? slot.row : slot.row + i;
        const c = slot.direction === 'across' ? slot.col + i : slot.col;
        puzzle.grid[r][c] = word[i].toUpperCase();
      }

      if (slot.direction === 'across') {
        puzzle.answers.across.push({ num: slot.number, answer: word.toUpperCase() });
      } else {
        puzzle.answers.down.push({ num: slot.number, answer: word.toUpperCase() });
      }
    }

    return puzzle;
  }
}

module.exports = CSPSolver;
