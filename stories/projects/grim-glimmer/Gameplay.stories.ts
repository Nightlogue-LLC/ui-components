import { createIcon } from '../../../src/components/icon/index.js';
import {
  createPuzzleGlyph,
  createGameMenuSheet,
  type GameMenuSheet,
} from '../../../src/projects/grim-glimmer/index.js';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import {
  createBoard,
  updateBoard,
  createCluedBoard,
  createGameControls,
  createCompactGameHeader,
  createAppFrameHeader,
  updateAppFrameSettingsOpen,
  createAppSettings,
  createGameMenu,
  createGameScreen,
  type BoardCellState,
  type GameMarkMode,
} from '../../../src/projects/grim-glimmer/index.js';
import { sampleIcon } from '../../lib/icons.js';
import { mockBoard } from '../../lib/mock-board.js';
import { compareModes, stateGrid } from '../../lib/stage.js';
import { THEME } from './shared.js';
import { withBoardGlyphs } from './board-glyphs.js';
import { el } from '../../lib/dom.js';

/** Two distinct nav layers and a mobile-first puzzle, using mock state only. */
function gameScreen(initialDifficulty = 'easy'): HTMLElement {
  const difficulties = [
    { value: 'easy', label: 'Easy', size: 5 },
    { value: 'medium', label: 'Medium', size: 8 },
    { value: 'master', label: 'Master', size: 15 },
  ];
  let difficulty = initialDifficulty;
  let generation = 1;
  let mode: GameMarkMode = 'tent';

  const host = document.createElement('div');
  host.className = 'sb-grim-gameplay-host';
  let currentSheet: GameMenuSheet | undefined;
  withBoardGlyphs(host);

  function render(): void {
    currentSheet?.destroy();
    const option = difficulties.find((choice) => choice.value === difficulty) ?? difficulties[0]!;
    const size = option.size;
    let cells = mockBoard(difficulty, generation, size);
    const clues = Array.from({ length: size }, (_, index) =>
      index % 4 === 0 ? 1 : index % 4 === 1 ? 0 : 2,
    );
    const board = createCluedBoard({
      label: 'Stars and Spires demonstration board',
      size,
      mode: 'interactive',
      cells,
      rowClues: clues,
      columnClues: clues,
      onCellActivate: (index) => {
        const state = cells[index];
        if (state === 'fixed') return;
        if (mode === 'tent') {
          cells[index] =
            state === 'tentative' ? 'placed' : state === 'placed' ? 'empty' : 'tentative';
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
      onHelp: () => {
        currentSheet?.close();
        const label = document.createElement('p');
        label.className = 'sb-grim-gameplay-help';
        label.textContent =
          'Place stars beside spires. Stars cannot touch, including diagonally. Match the row and column counts.';
        const old = host.querySelector('.sb-grim-gameplay-help');
        old?.remove();
        host.querySelector('.nl-grim-glimmer-screen__board')?.prepend(label);
      },
      onDeal: (next) => {
        difficulty = next;
        generation++;
        mode = 'tent';
        render();
      },
    });
    const header = createCompactGameHeader({
      title: 'Stars & Spires',
      status: `${option.label} · ${size}×${size}`,
      icons: { hint: createIcon('hint'), menu: sampleIcon('menu') },
      onHint: applyHint,
    });
    let settingsOpen = false;
    // The header callback executes only after screen has been constructed.
    const appHeader = createAppFrameHeader({
      icons: { back: sampleIcon('back'), settings: createIcon('settings') },
      onBack: () => {
        const note = document.createElement('p');
        note.className = 'sb-grim-gameplay-help';
        note.textContent = 'Back to collection is handled by the host app.';
        host.querySelector('.nl-grim-glimmer-screen__board')?.prepend(note);
      },
      onSettings: () => {
        settingsOpen = !settingsOpen;
        updateAppFrameSettingsOpen(appHeader, settingsOpen);
        for (const slot of ['header', 'board', 'controls'] as const) {
          const element = screen.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
          if (element) element.hidden = settingsOpen;
        }
        const settingsSlot = screen.querySelector<HTMLElement>('.nl-grim-glimmer-screen__settings');
        if (settingsSlot) settingsSlot.hidden = !settingsOpen;
        if (settingsOpen) sheet.close();
      },
    });
    const controls = createGameControls({
      mode,
      compact: true,
      icons: {
        tent: createPuzzleGlyph('star'),
        exclude: createIcon('exclude'),
        clear: createIcon('clear'),
      },
      showHint: false,
      showNewGame: false,
      onModeChange: (next) => {
        mode = next;
      },
      onClear: () => {
        cells = cells.map((state) => (state === 'fixed' ? state : 'empty'));
        updateBoard(grid, { cells });
      },
    });
    const screen = createGameScreen({ appHeader, header, board, controls });
    const trigger = header.querySelector<HTMLButtonElement>(
      '.nl-grim-glimmer-game-header__menu-toggle',
    )!;
    const sheet = createGameMenuSheet({ trigger, content: menu });
    screen.append(sheet.element);
    currentSheet = sheet;
    const settingsSlot = document.createElement('div');
    settingsSlot.className = 'nl-grim-glimmer-screen__settings';
    settingsSlot.hidden = true;
    settingsSlot.append(
      createAppSettings({
        state: {
          appearance: 'system',
          haptics: true,
          sound: true,
          autoFill: false,
          animations: true,
        },
      }),
    );
    screen.append(settingsSlot);
    host.replaceChildren(screen);
  }

  render();
  return host;
}

const meta = {
  title: 'Projects/Grim & Glimmer/V3/Gameplay',
  tags: ['autodocs'],
  parameters: {
    nlTheme: THEME,
    nlStage: 'self',
    docs: {
      description: {
        component: `
The continuous-background app frame owns Back to Collection and App Settings, with no app name. It is the only horizontal divider; the puzzle header, board and controls flow together. Below the divider, the puzzle header has **Hint at top-left**, the **Stars & Spires title and difficulty/size**, and a small **Game Menu sheet at top-right**. The board is centered, with **column clues above and row clues at left**. A single bottom row holds the Star/X **icon selector** at left and the Clear icon at right. The sheet holds difficulty, How to Play, and New Game. Star mode cycles empty → tentative → confirmed → empty; X toggles exclusion. The sample board and hints are visual fixtures, not game rules. No bottom nav appears on the game screen.
UI icons use the shared Phosphor Light/Fill map. Stars and spires retain their custom SVG artwork.

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

/** Two-level navigation in both color modes. App controls above the divider, puzzle title and Hint below, compact icon toolbar and small game menu. */
export const GameScreen: Story = {
  render: (_args, context) =>
    compareModes(context, () => gameScreen(), { theme: THEME, bleed: true }),
};

/** Dedicated dense-board mock, so Master can be reviewed without using the game menu. */
export const Master15x15: Story = {
  render: (_args, context) =>
    compareModes(context, () => gameScreen('master'), { theme: THEME, bleed: true }),
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

/** Every cell state on the clued board, with the spire (given) and eight-point star (placed) artwork. */
export const BoardGlyphs: Story = {
  render: (_args, context) =>
    compareModes(
      context,
      () => {
        const cells: BoardCellState[] = [
          'fixed',
          'empty',
          'placed',
          'empty',
          'fixed',
          'empty',
          'tentative',
          'empty',
          'marked',
          'empty',
          'placed',
          'empty',
          'fixed',
          'empty',
          'excluded',
          'empty',
          'marked',
          'empty',
          'placed',
          'empty',
          'fixed',
          'empty',
          'tentative',
          'empty',
          'fixed',
        ];
        const keyItem = (state: BoardCellState, word: string) => {
          const swatch = createBoard({ label: word, size: 1, mode: 'preview', cells: [state] });
          swatch.classList.add('sb-glyph-key__swatch');
          return el('li', { className: 'sb-glyph-key__item' }, [swatch, word]);
        };
        const wrap = withBoardGlyphs(el('div'));
        wrap.append(
          el('ul', { className: 'sb-glyph-key' }, [
            keyItem('fixed', 'Given (spire)'),
            keyItem('placed', 'Placed (star)'),
            keyItem('tentative', 'Tentative (faded star)'),
            keyItem('marked', 'Marked'),
            keyItem('excluded', 'Excluded'),
          ]),
          createCluedBoard({
            label: 'Board glyph artwork, all cell states',
            size: 5,
            mode: 'readonly',
            cells,
            rowClues: [1, 0, 2, 1, 1],
            columnClues: [1, 0, 2, 0, 1],
          }),
        );
        return wrap;
      },
      { theme: THEME },
    ),
  parameters: {
    nlStage: 'self',
    docs: {
      description: {
        story:
          'Shipped star/spire SVG masks: spires and stars have distinct theme-owned occupied fills. Tentative stars keep the star fill with faded artwork; X exclusions and empty cells use the bare board. Dark spires are rose, confirmed stars ivory. Preview, tutorial and game boards share these styles.',
      },
    },
  },
};
