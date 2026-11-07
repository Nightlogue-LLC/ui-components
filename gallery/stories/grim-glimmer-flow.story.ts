import { createButton } from '../../src/components/button/index.js';
import { openDialog } from '../../src/components/dialog/index.js';
import {
  createSegmentedControl,
  updateSegmentedControl,
} from '../../src/components/segmented-control/index.js';
import {
  createBoard,
  createDiscardConfirmDialog,
  createGameControls,
  createGameHeader,
  createGameScreen,
  createSuccessDialog,
  createTutorialDialog,
  getGameScreenSlot,
  updateBoard,
  type BoardCellState,
} from '../../src/projects/grim-glimmer/index.js';
import { el } from '../lib/dom.js';
import { sampleIcon } from '../lib/icons.js';
import { DIFFICULTIES, mockBoard } from '../lib/mock-board.js';
import { defineStory } from './types.js';

interface FlowArgs {
  [key: string]: string | boolean;
  confirmUntouched: boolean;
}

const NEXT: Record<BoardCellState, BoardCellState> = {
  empty: 'placed',
  placed: 'marked',
  marked: 'empty',
  fixed: 'fixed',
};

/**
 * A working SIMULATION of the game's modal flow. All state and rules here are mock (see
 * gallery/lib/mock-board.ts). It exists to show the sequencing the real app must implement; see
 * docs/grim-glimmer-integration.md.
 */
export default defineStory<FlowArgs>({
  id: 'grim-glimmer-flow',
  title: 'G&G · Modal flow',
  description:
    'Simulation, not Tents & Trees. First visit opens the tutorial over an Easy board. Tap squares to make progress, then try New Game and the difficulty control (an unfinished board asks first; a solved one does not), "Simulate: solve board" for the success dialog, and Help to replay the tutorial. Changing a control below resets the simulation (and the first visit).',
  bleed: true,
  controls: [{ name: 'confirmUntouched', type: 'boolean' }],
  defaults: { confirmUntouched: false },
  render: (args, { log }) => {
    const root = el('div', { className: 'gal-flow' });

    // --- mock app state -------------------------------------------------------------------
    let difficulty = 'easy';
    let generation = 1;
    let cells = mockBoard(difficulty, generation);
    let solved = false;
    let tutorialSeen = false;

    const hasProgress = () => cells.some((c) => c === 'placed' || c === 'marked');
    // "Unfinished" = not solved and the player has made progress (or the stricter control is on).
    const unfinished = () => !solved && (hasProgress() || args.confirmUntouched);

    const status = el('p', { className: 'gal-flow__status' });
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
        title: 'Tents & Trees',
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
            log(
              `tutorial ${outcome === 'finish' ? 'finished' : 'skipped'}: current board unchanged`,
            );
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
    const demo = el('div', { className: 'gal-flow__demo' }, [
      createButton({ label: 'Simulate: solve board', variant: 'secondary', onClick: solve }),
    ]);
    root.append(screen, status, demo);

    // First visit: the tutorial opens above the already-created Easy board.
    requestAnimationFrame(() => {
      if (root.isConnected && !tutorialSeen) openTutorial('first-visit');
    });
    return root;
  },
});
