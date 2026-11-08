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
  type GameMarkMode,
} from '../../../src/projects/grim-glimmer/index.js';
import { sampleIcon } from '../../lib/icons.js';
import { DIFFICULTIES, mockBoard } from '../../lib/mock-board.js';
import { compareModes, stateGrid } from '../../lib/stage.js';
import { THEME } from './shared.js';

/** Complete mobile gameplay composition. Mock counts and interactions are Storybook-only. */
function gameScreen(): HTMLElement {
  let difficulty = 'easy';
  let generation = 1;
  let markMode: GameMarkMode = 'tent';
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
      const state = cells[index];
      if (markMode === 'tent') {
        cells[index] = state === 'tentative' ? 'placed' : state === 'placed' ? 'empty' : 'tentative';
      } else {
        cells[index] = state === 'excluded' ? 'empty' : 'excluded';
      }
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
      mode: markMode,
      onModeChange: (next) => {
        markMode = next;
      },
      onNewGame: () => {
        generation++;
        cells = mockBoard(difficulty, generation);
        updateBoard(grid, { cells });
      },
      onClear: () => {
        cells = cells.map((state) => state === 'fixed' ? state : 'empty');
        updateBoard(grid, { cells });
      },
      onHint: () => {
        // Visual-only preview of a suggested tentative cell.
        // Real hint selection and deductions belong to the game engine.
        const first = cells.indexOf('empty');
        if (first < 0) return;
        cells[first] = 'tentative';
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
The game screen is a single column: back, title and help; an accessible **difficulty dropdown**; a single recessed engraved board with **column clues above** and **row clues on the right**; a two-mode Tent/X marking control, plus Hint, Clear and New Game. Tent mode cycles empty → tentative → confirmed → empty; X mode toggles an exclusion mark. All clues are Storybook fixtures. Board state changes are illustrative, not puzzle rules. Hint displays a mock suggestion; actual hint logic remains in the game engine. No bottom navigation on the game screen.
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

/** The full gameplay composition in light and dark. Tap cells twice to confirm tents, switch to X for exclusions, or try Hint, Clear and New Game. */
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
