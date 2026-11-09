import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { createButton } from '../../../src/components/button/index.js';
import { openDialog } from '../../../src/components/dialog/index.js';
import {
  createSegmentedControl,
  updateSegmentedControl,
} from '../../../src/components/segmented-control/index.js';
import {
  createBoard,
  createDiscardConfirmDialog,
  createGameControls,
  createGameHeader,
  createGameScreen,
  createSuccessDialog,
  createTutorialDialog,
  createGuidedTutorialDialog,
  getGameScreenSlot,
  updateBoard,
  type BoardCellState,
} from '../../../src/projects/grim-glimmer/index.js';
import { el } from '../../lib/dom.js';
import { sampleIcon } from '../../lib/icons.js';
import { DIFFICULTIES, mockBoard } from '../../lib/mock-board.js';

import {
  createDiscardConfirmDialog as makeConfirm,
  createSuccessDialog as makeSuccess,
  createTutorialDialog as makeTutorial,
} from '../../../src/projects/grim-glimmer/index.js';
import { THEME } from './shared.js';
import { withBoardGlyphs } from './board-glyphs.js';
import { TUTORIAL_LESSONS } from './tutorial-lessons.js';

const NEXT: Record<BoardCellState, BoardCellState> = {
  empty: 'placed',
  placed: 'marked',
  marked: 'empty',
  fixed: 'fixed',
  tentative: 'placed',
  excluded: 'empty',
};

/**
 * A working SIMULATION of the game's modal flow. All state and rules here are mock (see
 * stories/lib/mock-board.ts). It exists to show the sequencing the real app must implement; see
 * docs/grim-glimmer-integration.md.
 */
function buildFlow(
  args: { confirmUntouched: boolean },
  log: (message: string) => void,
): HTMLElement {
  const root = el('div', { className: 'sb-flow' });

  // --- mock app state -------------------------------------------------------------------
  let difficulty = 'easy';
  let generation = 1;
  let cells = mockBoard(difficulty, generation);
  let solved = false;
  let tutorialSeen = false;

  const hasProgress = () => cells.some((c) => c === 'placed' || c === 'marked');
  // "Unfinished" = not solved and the player has made progress (or the stricter control is on).
  const unfinished = () => !solved && (hasProgress() || args.confirmUntouched);

  const status = el('p', { className: 'sb-flow__status' });
  status.setAttribute('aria-live', 'polite');
  const paintStatus = () => {
    const state = solved ? 'solved (read-only)' : hasProgress() ? 'in progress' : 'untouched';
    status.textContent = `Board #${generation} · ${difficulty} · ${state} · tutorial ${tutorialSeen ? 'seen' : 'not seen'}`;
  };

  const showDialog = (dialog: HTMLDialogElement) => {
    root.append(dialog); // inside the themed stage so the dialog inherits the theme
    openDialog(dialog);
  };

  // --- screen ---------------------------------------------------------------------------
  const diffProps = () => ({ label: 'Difficulty', options: DIFFICULTIES, value: difficulty });
  const difficultyControl = createSegmentedControl({
    ...diffProps(),
    onChange: (next) => {
      if (next === difficulty) return;
      log(`difficulty requested: ${next}`);
      requestReplace(next);
    },
  });

  const screen = createGameScreen({
    header: createGameHeader({
      title: 'Stars & Spires',
      icons: { back: sampleIcon('back'), help: sampleIcon('help') },
      onBack: () => log('back: board and progress retained (the app persists them)'),
      onHelp: () => openTutorial('help'),
    }),
    difficulty: difficultyControl,
    board: document.createDocumentFragment(),
    controls: createGameControls({
      onNewGame: () => {
        log('new game requested');
        requestReplace(difficulty);
      },
    }),
  });

  function renderBoard(): void {
    const board = createBoard({
      label: solved ? 'Solved board (read only)' : 'Puzzle board',
      size: 5,
      mode: solved ? 'readonly' : 'interactive',
      cells,
      onCellActivate: (index) => {
        cells = cells.map((state, i) => (i === index ? NEXT[state] : state));
        updateBoard(board, { cells });
        paintStatus();
      },
    });
    getGameScreenSlot(screen, 'board').replaceChildren(board);
    paintStatus();
  }

  function generate(nextDifficulty: string): void {
    difficulty = nextDifficulty;
    generation += 1;
    cells = mockBoard(difficulty, generation);
    solved = false;
    updateSegmentedControl(difficultyControl, diffProps());
    renderBoard();
    log(`new ${difficulty} board generated (#${generation})`);
  }

  // The app decides: an unfinished board needs confirmation, a solved/untouched one does not.
  function requestReplace(nextDifficulty: string): void {
    if (!unfinished()) {
      generate(nextDifficulty);
      return;
    }
    showDialog(
      createDiscardConfirmDialog({
        title: 'Start a new game?',
        message: 'Your current puzzle is unfinished. Starting a new one discards your progress.',
        confirmLabel: 'Discard and start new',
        onConfirm: () => generate(nextDifficulty),
        onCancel: () => log('cancelled: board and difficulty kept'),
      }),
    );
  }

  function openTutorial(source: 'first-visit' | 'help'): void {
    log(`tutorial opened (${source}); board untouched behind it`);
    showDialog(
      createTutorialDialog({
        title: 'How to play',
        boardLabel: 'Tutorial demo board',
        // Mock copy: the real rules are app-owned.
        steps: [
          'Tap a square to place a piece. Tap again to mark it, and once more to clear it.',
          'Filled circles are given pieces. They are fixed and cannot be changed.',
          'That is the whole demo. The real rules come from the game.',
        ],
        onDone: (outcome) => {
          tutorialSeen = true;
          paintStatus();
          log(`tutorial ${outcome === 'finish' ? 'finished' : 'skipped'}: current board unchanged`);
        },
      }),
    );
  }

  function solve(): void {
    if (solved) return;
    solved = true;
    renderBoard();
    log('board solved');
    showDialog(
      createSuccessDialog({
        title: 'Puzzle complete',
        message: 'Nicely done.',
        onPlayAgain: () => generate(difficulty),
        onClose: () => log('success closed: solved board stays visible, read-only'),
      }),
    );
  }

  renderBoard();

  // --- demo controls (outside the simulated screen) --------------------------------------
  const demo = el('div', { className: 'sb-flow__demo' }, [
    createButton({ label: 'Simulate: solve board', variant: 'secondary', onClick: solve }),
  ]);
  root.append(screen, status, demo);

  // First visit: the tutorial opens above the already-created Easy board.
  requestAnimationFrame(() => {
    if (root.isConnected && !tutorialSeen) openTutorial('first-visit');
  });
  return root;
}

/** A host with one button that opens a project dialog, for stories that show a single dialog. */
function opener(label: string, open: (host: HTMLElement) => HTMLDialogElement): HTMLElement {
  const host = el('div');
  host.append(
    createButton({
      label,
      variant: 'secondary',
      onClick: () => {
        const dialog = open(host);
        host.append(dialog);
        openDialog(dialog);
      },
    }),
  );
  return host;
}

const openIt =
  (name: string): NonNullable<StoryObj['play']> =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name }));
    await waitFor(() => expect(canvasElement.querySelector('dialog[open]')).not.toBeNull());
  };

const meta = {
  title: 'Projects/Grim & Glimmer/Dialogs',
  tags: ['autodocs'],
  parameters: {
    nlTheme: THEME,
    docs: {
      description: {
        component: `
The game's three modal moments, built on the shared Dialog: a **tutorial** (copy plus a mock, tappable 5×5 demo),
the **success** message, and the **discard confirmation** (compulsory: Escape and the backdrop do nothing, and
Cancel, the safe choice, has initial focus). Open each one with its story (it opens automatically) and use
the viewport toolbar to check 320 / 375 / 430 widths; see the mobile dialog checklist in **Components / Overlays /
Dialog**.

**Modal flow** is a working simulation of the sequencing the game app must implement: first-visit tutorial over an
Easy board, confirmation before replacing an *unfinished* board (not a solved one), solve → success → Close
(read-only solved board) or Play Again, and a difficulty control that stays put until the app accepts. It is
**not** Stars & Spires and not production state management.
`,
      },
    },
  },
} satisfies Meta;

export default meta;

interface TutorialArgs {
  onDone: (outcome: 'skip' | 'finish') => void;
}

/** Skip is always available; the last step offers Finish. Tap the demo squares. */
export const Tutorial: StoryObj<TutorialArgs> = {
  args: { onDone: fn() },
  argTypes: { onDone: { action: 'tutorial done', table: { category: 'events' } } },
  render: (args) =>
    opener('Open tutorial', () =>
      makeTutorial({
        title: 'How to play',
        boardLabel: 'Tutorial demo board',
        // Mock copy: the real rules are app-owned.
        steps: [
          'Tap a square to place a piece. Tap again to mark it, and once more to clear it.',
          'Filled circles are given pieces. They are fixed and cannot be changed.',
          'That is the whole demo. The real rules come from the game.',
        ],
        onDone: args.onDone,
      }),
    ),
  play: openIt('Open tutorial'),
};

/** Iteration concept for app issue #18. Uses the existing modal, with local tracked practice. */
export const GuidedTutorial: StoryObj<
  TutorialArgs & { highlightDelay: number; initialLesson: number }
> = {
  args: { onDone: fn(), highlightDelay: 650, initialLesson: 0 },
  argTypes: {
    highlightDelay: {
      control: { type: 'range', min: 0, max: 1500, step: 50 },
      description: 'Pause in milliseconds before guidance or error outlines appear.',
    },
    initialLesson: {
      control: { type: 'select' },
      options: TUTORIAL_LESSONS.map((_, i) => i),
      description: 'Open at a lesson (0–7) for visual review. Reopen after changing.',
    },
    onDone: { action: 'guided tutorial done', table: { category: 'events' } },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Stars & Spires tutorial concept. Delayed gold guidance, three tracked taps (tentative → confirmed → empty), red rule examples, Back/Skip/Begin. Switch the Mode toolbar to review both themes. Practice is isolated from gameplay. The existing Tutorial and Modal flow stories remain as the integration baseline.',
      },
    },
  },
  render: (args) =>
    withBoardGlyphs(
      opener('Open guided tutorial', () =>
        createGuidedTutorialDialog({
          title: 'How to play',
          lessons: TUTORIAL_LESSONS,
          highlightDelay: args.highlightDelay,
          initialLesson: args.initialLesson,
          onDone: args.onDone,
        }),
      ),
    ),
  play: openIt('Open guided tutorial'),
};

interface SuccessArgs {
  onPlayAgain: () => void;
  onClose: () => void;
}

/** A concise message with a quiet accent. Close keeps the solved board; Play Again starts a new one. */
export const Success: StoryObj<SuccessArgs> = {
  args: { onPlayAgain: fn(), onClose: fn() },
  argTypes: {
    onPlayAgain: { action: 'play again', table: { category: 'events' } },
    onClose: { action: 'closed', table: { category: 'events' } },
  },
  render: (args) =>
    opener('Open success', () =>
      makeSuccess({
        title: 'Puzzle complete',
        message: 'Nicely done.',
        onPlayAgain: args.onPlayAgain,
        onClose: args.onClose,
      }),
    ),
  play: openIt('Open success'),
};

interface ConfirmArgs {
  onConfirm: () => void;
  onCancel: () => void;
}

/** Compulsory: try Escape and the backdrop (nothing happens). Cancel has initial focus. */
export const DiscardConfirmation: StoryObj<ConfirmArgs> = {
  args: { onConfirm: fn(), onCancel: fn() },
  argTypes: {
    onConfirm: { action: 'confirmed', table: { category: 'events' } },
    onCancel: { action: 'cancelled', table: { category: 'events' } },
  },
  render: (args) =>
    opener('Open confirmation', () =>
      makeConfirm({
        title: 'Start a new game?',
        message: 'Your current puzzle is unfinished. Starting a new one discards your progress.',
        confirmLabel: 'Discard and start new',
        onConfirm: args.onConfirm,
        onCancel: args.onCancel,
      }),
    ),
  play: openIt('Open confirmation'),
};

interface FlowArgs {
  confirmUntouched: boolean;
  onEvent: (message: string) => void;
}

/**
 * First visit opens the tutorial over an Easy board. Tap squares to make progress, then try New Game and the
 * difficulty control (an unfinished board asks first; a solved one does not), "Simulate: solve board" for the
 * success dialog, and Help to replay the tutorial. Changing a control resets the simulation and the first visit.
 */
export const ModalFlow: StoryObj<FlowArgs> = {
  args: { confirmUntouched: false, onEvent: fn() },
  argTypes: {
    confirmUntouched: {
      control: 'boolean',
      description:
        'Stricter reading of "unfinished": even an untouched board asks before being replaced.',
    },
    onEvent: { action: 'flow', table: { category: 'events' } },
  },
  parameters: { nlStage: 'bleed' },
  render: (args) => buildFlow(args, args.onEvent),
};
