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
  toggleGameMenu,
  closeGameMenu,
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

/** Simple icon assets for this visual fixture. Production artwork belongs to the game app. */
function demoIcon(name: 'hint' | 'tent' | 'exclude' | 'clear' | 'settings'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const paths: Record<typeof name, string[]> = {
    hint: ['M9 18h6', 'M10 22h4', 'M9 14a7 7 0 1 1 6 0l-1 2H10z'],
    tent: ['M12 3L3 20h18L12 3z', 'M12 3v17', 'M9 20l3-7 3 7'],
    exclude: ['M5 5l14 14', 'M19 5L5 19'],
    clear: ['M3 7h18', 'M8 7V4h8v3', 'M6 7l1 14h10l1-14', 'M10 11v7', 'M14 11v7'],
    settings: [
      'M12 3v3',
      'M12 18v3',
      'M3 12h3',
      'M18 12h3',
      'M5.6 5.6l2.1 2.1',
      'M16.3 16.3l2.1 2.1',
      'M18.4 5.6l-2.1 2.1',
      'M7.7 16.3l-2.1 2.1',
      'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    ],
  };
  for (const data of paths[name]) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', data);
    svg.append(path);
  }
  return svg;
}

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
  withBoardGlyphs(host);

  function render(): void {
    const option = difficulties.find((choice) => choice.value === difficulty) ?? difficulties[0]!;
    const size = option.size;
    let cells = mockBoard(difficulty, generation, size);
    const clues = Array.from({ length: size }, (_, index) =>
      index % 4 === 0 ? 1 : index % 4 === 1 ? 0 : 2,
    );
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
        const label = document.createElement('p');
        label.className = 'sb-grim-gameplay-help';
        label.textContent =
          'Place tents beside trees. Tents cannot touch, including diagonally. Match the row and column counts.';
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
      title: 'Tents & Trees',
      status: `${option.label} · ${size}×${size}`,
      icons: { hint: demoIcon('hint'), menu: sampleIcon('menu') },
      onHint: applyHint,
      onMenu: () => toggleGameMenu(menu),
    });
    let settingsOpen = false;
    // The header callback executes only after screen has been constructed.
    const appHeader = createAppFrameHeader({
      icons: { back: sampleIcon('back'), settings: demoIcon('settings') },
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
        if (settingsOpen) closeGameMenu(menu);
      },
    });
    const controls = createGameControls({
      mode,
      compact: true,
      icons: { tent: demoIcon('tent'), exclude: demoIcon('exclude'), clear: demoIcon('clear') },
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
    const screen = createGameScreen({ appHeader, header, board, controls, menu });
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
    screen.addEventListener('click', (event) => {
      if (menu.hidden || !(event.target instanceof Node)) return;
      if (menu.contains(event.target)) return;
      if (header.contains(event.target)) return;
      closeGameMenu(menu);
    });
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
The colored app frame owns Back to Collection and App Settings, with no app name. It is the only horizontal divider; the puzzle header, board and controls flow together. Below the divider, the puzzle header has **Hint at top-left**, the **Tents & Trees title and difficulty/size**, and a small **Game Menu popover at top-right**. The board is centered, with **column clues above and row clues at left**. A single bottom row holds the Tent/X **icon selector** at left and the Clear icon at right. The small menu holds difficulty, How to Play, and New Game. Tent mode cycles empty → tentative → confirmed → empty; X toggles exclusion. The sample board and hints are visual fixtures, not game rules. No bottom nav appears on the game screen.
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

/** Every cell state on the clued board, with the spire (given) and four-point star (placed) artwork. */
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
          'Story-only artwork: the spire marks a given piece and the four-point star a placed one (faded while tentative). Marked and excluded keep their simple shapes. The library board itself still ships generic placeholder glyphs; the game app owns the final artwork.',
      },
    },
  },
};
