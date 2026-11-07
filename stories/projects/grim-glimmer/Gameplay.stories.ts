import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import {
  createSegmentedControl,
  updateSegmentedControl,
} from '../../../src/components/segmented-control/index.js';
import {
  createBoard,
  createGameControls,
  createGameHeader,
  createGameScreen,
  type BoardCellState,
} from '../../../src/projects/grim-glimmer/index.js';
import { sampleIcon } from '../../lib/icons.js';
import { DIFFICULTIES, mockBoard } from '../../lib/mock-board.js';
import { compareModes, stateGrid } from '../../lib/stage.js';
import { THEME } from './shared.js';

/** Game screen: header, separate difficulty control, board, compact New Game. No bottom tabs. */
function gameScreen(): HTMLElement {
  let difficulty = 'easy';
  const props = () => ({ label: 'Difficulty', options: DIFFICULTIES, value: difficulty });
  const control = createSegmentedControl({
    ...props(),
    onChange: (next) => {
      difficulty = next;
      updateSegmentedControl(control, props());
    },
  });
  return createGameScreen({
    header: createGameHeader({
      title: 'Tents & Trees',
      icons: { back: sampleIcon('back'), help: sampleIcon('help') },
    }),
    difficulty: control,
    board: createBoard({
      label: 'Puzzle board',
      size: 5,
      mode: 'interactive',
      cells: mockBoard('easy', 1),
      onCellActivate: () => undefined,
    }),
    controls: createGameControls(),
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
The game screen is a single column: back, short puzzle title and help; a **separate** difficulty control; the
board; and a compact New Game below it. 48px icon buttons, 24px side padding plus safe-area insets, and **no
bottom navigation**. The board here is a mock: it draws whatever cell states it is given and has no puzzle rules.
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

/** The full game screen in light and dark. Tap squares; the difficulty control is a live demo. */
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
