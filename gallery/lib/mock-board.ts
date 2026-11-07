import type { BoardCellState } from '../../src/projects/grim-glimmer/index.js';

/**
 * Gallery-only MOCK board generator. It is NOT a puzzle generator: it scatters a few "given"
 * pieces deterministically so the simulations have something to show. The library contains no game
 * engine; the real app generates real boards.
 */
export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

const GIVEN: Record<string, number> = { easy: 5, medium: 6, hard: 7 };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Same (difficulty, generation) always gives the same board; a new generation gives a new one. */
export function mockBoard(difficulty: string, generation: number, size = 5): BoardCellState[] {
  const cells = Array<BoardCellState>(size * size).fill('empty');
  const rand = mulberry32(
    generation * 7919 + difficulty.length * 31 + (difficulty.codePointAt(0) ?? 0),
  );
  const count = GIVEN[difficulty] ?? 5;
  let placed = 0;
  while (placed < count) {
    const index = Math.floor(rand() * cells.length);
    if (cells[index] === 'empty') {
      cells[index] = 'fixed';
      placed += 1;
    }
  }
  return cells;
}
