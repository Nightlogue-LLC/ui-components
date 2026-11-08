import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import {
  createBoard,
  updateBoard,
  createCluedBoard,
  createGameControls,
  createCompactGameHeader,
  createGameMenu,
  createGameScreen,
  type BoardCellState,
  type GameMarkMode,
} from '../../../src/projects/grim-glimmer/index.js';
import { sampleIcon } from '../../lib/icons.js';
import { mockBoard } from '../../lib/mock-board.js';
import { compareModes, stateGrid } from '../../lib/stage.js';
import { THEME } from './shared.js';

/** Compact, mobile-first Storybook composition with app-owned mock state. */
function gameScreen(): HTMLElement {
  const difficulties = [
    { value: 'easy', label: 'Easy', size: 5 },
    { value: 'medium', label: 'Medium', size: 8 },
    { value: 'master', label: 'Master', size: 15 },
  ];
  let difficulty = 'easy';
  let generation = 1;
  let mode: GameMarkMode = 'tent';

  const host = document.createElement('div');
  host.className = 'sb-grim-gameplay-host';

  function render(): void {
    const option = difficulties.find((choice) => choice.value === difficulty) ?? difficulties[0]!;
    const size = option.size;
    let cells = mockBoard(difficulty, generation, size);
    const clues = Array.from({ length: size }, (_, index) => (index % 4 === 0 ? 1 : index % 4 === 1 ? 0 : 2));
    const board = createCluedBoard({
      label: 'Tents and Trees demonstration board',
      size,
      mode: 'interactive',
      cells,
      rowClues: clues,
      columnClues: clues,
      onCellActivate: (index) => {
        const state = cells[index];
        if (state === 'fixed') return;
        if (mode === 'tent') {
          cells[index] = state === 'tentative' ? 'placed' : state === 'placed' ? 'empty' : 'tentative';
        } else {
          cells[index] = state === 'excluded' ? 'empty' : 'excluded';
        }
        updateBoard(grid, { cells });
      },
    });
    const grid = board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
    const applyHint = () => {
      const index = cells.indexOf('empty');
      if (index < 0) return;
      cells[index] = 'tentative';
      updateBoard(grid, { cells });
    };

    const menu = createGameMenu({
      difficulty,
      options: difficulties,
      helpRules: [
        'Place one tent next to each tree, horizontally or vertically.',
        'Tents cannot touch, including diagonally.',
        'Row and column numbers show how many tents belong in each line.',
        'Tent mode: tap once for tentative, twice for confirmed. X mode marks exclusions.',
      ],
      onDeal: (next) => {
        difficulty = next;
        generation++;
        mode = 'tent';
        render();
      },
    });
    const header = createCompactGameHeader({
      status: `${option.label} · ${size}×${size}`,
      icons: { hint: sampleIcon('help'), menu: sampleIcon('menu') },
      onHint: applyHint,
      onMenu: () => menu.showModal(),
    });
    const controls = createGameControls({
      mode,
      showHint: false,
      showNewGame: false,
      onModeChange: (next) => { mode = next; },
      onClear: () => {
        cells = cells.map((state) => (state === 'fixed' ? state : 'empty'));
        updateBoard(grid, { cells });
      },
    });
    const screen = createGameScreen({ header, board, controls, menu });
    host.replaceChildren(screen);
  }

  render();
  return host;
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
The compact game screen has **Hint at top-left**, a centered difficulty/size status, and the **Game Menu at top-right**. The board is centered, with **column clues above and row clues at left**. The two-mode Tent/X selector and Clear stay anchored below the board. The slide-over menu contains difficulty choices, an expandable How to Play section, and **Deal New Puzzle** at its foot. Tent mode cycles empty → tentative → confirmed → empty; X toggles exclusion. The sample board and hints are visual fixtures, not game rules. No bottom nav appears on the game screen.
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

/** The full gameplay composition in light and dark. Use Tent and X below the board, Hint at top-left, and the menu at top-right for help, difficulty and a new puzzle. */
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
