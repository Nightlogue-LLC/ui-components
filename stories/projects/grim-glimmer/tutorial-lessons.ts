import type { BoardCellState, TutorialLesson } from '../../../src/projects/grim-glimmer/index.js';

/** Authored examples for visual review. No generator, save data or production rule engine. */
const example = (stars: number[]): BoardCellState[] =>
  Array.from({ length: 25 }, (_, i) =>
    [1, 9, 15, 23].includes(i) ? 'fixed' : stars.includes(i) ? 'placed' : 'empty',
  );
const solved = example([0, 4, 10, 24]);
const full = {
  size: 5,
  cells: solved,
  rowClues: [2, 0, 1, 0, 1],
  columnClues: [2, 0, 0, 0, 2],
};

export const TUTORIAL_LESSONS: readonly TutorialLesson[] = [
  {
    title: 'Meet the spires',
    instruction: 'These are spires. They stay in place. Each one needs a star beside it.',
    boardLabel: 'A row with two fixed spires, in columns 2 and 4',
    size: 5,
    rowOnly: true,
    cells: ['empty', 'fixed', 'empty', 'fixed', 'empty'],
    highlights: [1, 3],
  },
  {
    title: 'Try the three taps',
    instruction: 'Tap the outlined cell once to place a tentative star.',
    boardLabel: 'Practice row. Tap column 1 three times to try each star state.',
    size: 5,
    rowOnly: true,
    cells: ['empty', 'fixed', 'empty', 'fixed', 'empty'],
    highlights: [0],
    practice: {
      index: 0,
      sequence: [
        {
          state: 'tentative',
          instruction: 'A tentative star marks a possibility. Tap it again to confirm.',
        },
        {
          state: 'placed',
          instruction: 'Now the star is confirmed. Tap once more to clear the cell.',
        },
        {
          state: 'empty',
          instruction: 'Cell cleared. Tentative → confirmed → empty. You’ve completed the cycle.',
        },
      ],
    },
  },
  {
    ...full,
    title: 'Beside, never diagonal',
    instruction:
      'A star belongs directly above, below, left or right of its spire. This diagonal star cannot pair with the outlined spire.',
    boardLabel: 'Error example: spire at row 1 column 2, star diagonally at row 2 column 3',
    cells: example([7, 4, 10, 24]),
    rowClues: [1, 1, 1, 0, 1],
    columnClues: [1, 0, 1, 0, 2],
    highlights: [1, 7],
    highlightTone: 'error',
  },
  {
    ...full,
    title: 'One star for each spire',
    instruction:
      'Pair every spire with exactly one star, and every star with one spire. Here, two stars are trying to share the same spire.',
    boardLabel: 'Error example: two stars beside the spire in row 1 column 2',
    cells: example([0, 2, 4, 10, 24]),
    rowClues: [3, 0, 1, 0, 1],
    columnClues: [2, 0, 1, 0, 2],
    highlights: [0, 1, 2],
    highlightTone: 'error',
  },
  {
    ...full,
    title: 'Give stars some space',
    instruction:
      'Stars cannot touch along an edge or at a corner. These two stars touch diagonally.',
    boardLabel: 'Error example: stars at row 4 column 2 and row 5 column 3 touch at a corner',
    cells: example([0, 4, 16, 22]),
    rowClues: [2, 0, 0, 1, 1],
    columnClues: [1, 1, 1, 0, 1],
    highlights: [16, 22],
    highlightTone: 'error',
  },
  {
    ...full,
    title: 'Count across each row',
    instruction:
      'The number on the left tells you how many confirmed stars belong in that row. This row needs 1, but has 2.',
    boardLabel: 'Error example: the first row has two stars but its clue is 1',
    rowClues: [1, 0, 1, 0, 1],
    highlightRow: 0,
    highlightTone: 'error',
  },
  {
    ...full,
    title: 'Count down each column',
    instruction:
      'The number above tells you how many confirmed stars belong in that column. This column needs 1, but has 2.',
    boardLabel: 'Error example: the first column has two stars but its clue is 1',
    columnClues: [1, 0, 0, 0, 2],
    highlightColumn: 0,
    highlightTone: 'error',
  },
  {
    ...full,
    title: 'You’re ready to play',
    instruction:
      'Use X to rule out cells. You can revisit the rules from the game menu whenever you need them.',
    boardLabel: 'A completed example with every spire paired and all counts satisfied',
  },
];
