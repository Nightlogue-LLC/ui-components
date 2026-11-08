import {
  createBoard,
  createPuzzleCollectionCard,
  type BoardCellState,
  type PuzzleStatus,
} from '../../../src/projects/grim-glimmer/index.js';
import { mockBoard } from '../../lib/mock-board.js';

/** Theme the Grim & Glimmer stories use by default (the toolbar can still switch it). */
export const THEME = 'grim-glimmer';

/** A tiny static pattern for card previews: a few given pieces, one placed. Placeholder only. */
export function previewCells(generation: number, withPlaced: boolean): BoardCellState[] {
  const cells = mockBoard('easy', generation);
  if (withPlaced) {
    const free = cells.indexOf('empty');
    if (free >= 0) cells[free] = 'placed';
  }
  return cells;
}

export function previewBoard(generation: number, withPlaced = false): HTMLElement {
  return createBoard({
    label: 'Preview',
    size: 5,
    mode: 'preview',
    cells: previewCells(generation, withPlaced),
  });
}

export function card(
  title: string,
  status: PuzzleStatus,
  generation: number,
  withPlaced = false,
): HTMLElement {
  return createPuzzleCollectionCard({
    title,
    status,
    preview: previewBoard(generation, withPlaced),
    onOpen: () => undefined,
  });
}

/** Sample puzzle cards: real names, plus deliberately long titles to test wrapping and clipping. */
export const SAMPLE_CARDS: readonly { title: string; status: PuzzleStatus }[] = [
  { title: 'Stars & Spires', status: 'continue' },
  { title: 'Ghosts & Graves', status: 'play' },
  { title: 'Ghosts & Graves', status: 'coming-soon' },
  { title: 'The Cartographer’s Midnight Orchard', status: 'coming-soon' },
  { title: 'Nightingales & Nettles in the Orchard of Forgotten Names', status: 'coming-soon' },
];

export function sampleCards(): HTMLElement[] {
  return SAMPLE_CARDS.map((sample, index) =>
    createPuzzleCollectionCard({
      title: sample.title,
      status: sample.status,
      preview: createBoard({
        label: 'Preview',
        size: 5,
        mode: 'preview',
        cells: mockBoard('easy', index + 1),
      }),
      onOpen: () => undefined,
    }),
  );
}

export type { BoardCellState };
