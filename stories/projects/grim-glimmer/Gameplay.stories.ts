import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import {
  createBoard,
  updateBoard,
  createCluedBoard,
  createGameDifficulty,
  createGameControls,
  createGameHeader,
  createGameScreen,
  type BoardCellState,
} from '../../../src/projects/grim-glimmer/index.js';
import { sampleIcon } from '../../lib/icons.js';
import { DIFFICULTIES, mockBoard } from '../../lib/mock-board.js';
import { compareModes, stateGrid } from '../../lib/stage.js';
import { THEME } from './shared.js';

/** Complete mobile gameplay composition. Mock counts and interactions are Storybook-only. */
function gameScreen(): HTMLElement {
  let difficulty = 'easy';
  let generation = 1;
  let cells = mockBoard(difficulty, generation);
  const board = createCluedBoard({
    label: 'Tents and Trees puzzle board',
    size: 5,
    mode: 'interactive',
    rowClues: [1, 2, 0, 1, 1],
    columnClues: [1, 0, 2, 1, 1],
    cells,
    onCellActivate: (index) => {
      if (cells[index] === 'fixed') return;
      cells[index] = cells[index] === 'empty' ? 'placed' : 'empty';
      updateBoard(grid, { cells });
    },
  });
  const grid = board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  const dropdown = createGameDifficulty({
    label: 'Difficulty',
    value: difficulty,
    options: DIFFICULTIES,
    onChange: (next) => {
      difficulty = next;
      generation++;
      cells = mockBoard(difficulty, generation);
      updateBoard(grid, { cells });
    },
  });
  return createGameScreen({
    header: createGameHeader({
      title: 'Tents & Trees',
      icons: { back: sampleIcon('back'), help: sampleIcon('help') },
    }),
    difficulty: dropdown,
    board,
    controls: createGameControls({
      onNewGame: () => {
        generation++;
        cells = mockBoard(difficulty, generation);
        updateBoard(grid, { cells });
      },
      onUndo: () => {
        const last = cells.findLastIndex((state) => state === 'placed');
        if (last < 0) return;
        cells[last] = 'empty';
        updateBoard(grid, { cells });
      },
      onHint: () => {
        const first = cells.indexOf('empty');
        if (first < 0) return;
        cells[first] = 'marked';
        updateBoard(grid, { cells });
      },
    }),
  });
}

const meta = {
  title: 'Projects/Grim & Glimmer/Gameplay',
  tags: ['autodocs'],
  parameters: {
    nlTheme: THEME,
    nlStage: 'self',
    docs: {
      description: {
        component: `
The game screen is a single column: back, title and help; an accessible **difficulty dropdown**; a single recessed engraved board with **column clues above** and **row clues on the right**; compact Undo, Hint, and New Game actions. All clues are Storybook fixtures. Board state changes demonstrate only visual feedback, not puzzle rules. No bottom navigation on the game screen.
Icon artwork is app-owned (the samples are generic glyphs).

Game state, board generation, persistence and the rules are the game app's job; see the contracts in
\`docs/grim-glimmer-integration.md\` and try the simulation in **Dialogs / Modal flow**.
`,
      },
    },
  },
  render: () => document.createElement('div'),
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** The full gameplay composition in light and dark. Tap squares, choose difficulty, or use the mock controls. */
export const GameScreen: Story = {
  render: (_args, context) =>
    compareModes(context, () => gameScreen(), { theme: THEME, bleed: true }),
};

const sample = (): BoardCellState[] => {
  const cells = mockBoard('easy', 1);
  const free = cells.indexOf('empty');
  if (free >= 0) cells[free] = 'placed';
  const next = cells.indexOf('empty', free + 1);
  if (next >= 0) cells[next] = 'marked';
  return cells;
};

/** The three board modes: preview (decorative), interactive (tap squares) and read-only (solved). */
export const BoardModes: StoryObj<{ onCellActivate: (index: number) => void }> = {
  args: { onCellActivate: fn() },
  argTypes: { onCellActivate: { action: 'cell activated', table: { category: 'events' } } },
  render: (args) =>
    stateGrid(
      (['preview', 'interactive', 'readonly'] as const).map((mode) => ({
        label: mode,
        node: createBoard({
          label: `${mode} board`,
          size: 5,
          mode,
          cells: sample(),
          onCellActivate: args.onCellActivate,
        }),
      })),
    ),
  parameters: { nlStage: 'default' },
};
