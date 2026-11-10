import { createButton } from '../../components/button/index.js';
import {
  closeDialog,
  createDialog,
  getDialogActions,
  getDialogBody,
} from '../../components/dialog/index.js';
import { createBoard, updateBoard, type BoardCellState } from './board.js';

/*
 * Dialog CONTENT for the game's modal moments. They build on the shared Dialog and return a
 * closed, detached <dialog>: the app appends it inside its themed container and calls
 * `openDialog()`. They contain no game rules or state; every string and callback comes from the
 * app. Callbacks run after the dialog has closed (and focus has returned to the opener).
 */

function paragraph(className: string, text: string): HTMLParagraphElement {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  return p;
}

// ---------------------------------------------------------------------------------------------
// Tutorial

export type TutorialOutcome = 'skip' | 'finish';

export interface TutorialDialogOptions {
  title: string;
  /** Copy for each step. Game rules are app-owned; this component only presents them. */
  steps: readonly string[];
  /** Accessible name of the demo board. */
  boardLabel: string;
  /** Starting cells of the 5x5 demo (25 entries). Defaults to a small generic pattern. */
  demoCells?: readonly BoardCellState[];
  labels?: {
    skip?: string;
    next?: string;
    finish?: string;
    step?: (current: number, total: number) => string;
  };
  /** Called once after the dialog closes. Closing any other way (Escape, X, backdrop) is a skip. */
  onDone: (outcome: TutorialOutcome) => void;
}

const DEFAULT_DEMO: readonly BoardCellState[] = [
  'fixed',
  'empty',
  'empty',
  'empty',
  'empty',
  'empty',
  'empty',
  'fixed',
  'empty',
  'empty',
  'empty',
  'empty',
  'empty',
  'empty',
  'fixed',
  'fixed',
  'empty',
  'empty',
  'empty',
  'empty',
  'empty',
  'empty',
  'empty',
  'fixed',
  'empty',
];

/** The demo cycles a tapped cell: empty -> placed -> marked -> empty. This is a mock, not game logic. */
const NEXT_STATE: Record<BoardCellState, BoardCellState> = {
  empty: 'placed',
  placed: 'marked',
  marked: 'empty',
  fixed: 'fixed',
  tentative: 'placed',
  excluded: 'empty',
};

/**
 * Multi-step tutorial with a mock, tappable 5x5 demo. Skip is always available; the last step
 * offers Finish. It never touches the game board behind it, so Skip and Finish leave the board
 * as it was (the app decides what, if anything, to record).
 */
/** @deprecated Use createGuidedTutorialDialog. */
export function createTutorialDialog(options: TutorialDialogOptions): HTMLDialogElement {
  const { steps, labels } = options;
  if (steps.length === 0) throw new Error('createTutorialDialog: at least one step is required');
  let current = 0;
  let outcome: TutorialOutcome = 'skip';
  let cells = [...(options.demoCells ?? DEFAULT_DEMO)];

  const dialog = createDialog({
    title: options.title,
    onClose: () => options.onDone(outcome),
  });

  const stepLabel = labels?.step ?? ((n: number, total: number) => `Step ${n} of ${total}`);
  const counter = paragraph('nl-grim-glimmer-tutorial__step', '');
  const text = paragraph('nl-grim-glimmer-tutorial__text', '');
  const live = document.createElement('div');
  live.setAttribute('aria-live', 'polite');
  live.append(counter, text);

  const board = createBoard({
    label: options.boardLabel,
    size: 5,
    mode: 'interactive',
    cells,
    onCellActivate: (index) => {
      cells = cells.map((s, i) => (i === index ? NEXT_STATE[s] : s));
      updateBoard(board, { cells });
    },
  });
  const demo = document.createElement('div');
  demo.className = 'nl-grim-glimmer-tutorial__demo';
  demo.append(board);

  getDialogBody(dialog).append(live, demo);

  const skip = createButton({
    label: labels?.skip ?? 'Skip',
    variant: 'ghost',
    onClick: () => {
      outcome = 'skip';
      closeDialog(dialog);
    },
  });
  const advance = createButton({
    label: '',
    onClick: () => {
      if (current < steps.length - 1) {
        current += 1;
        paint();
      } else {
        outcome = 'finish';
        closeDialog(dialog);
      }
    },
  });
  advance.setAttribute('autofocus', ''); // keyboard users land on the primary action
  getDialogActions(dialog).append(skip, advance);

  function paint(): void {
    counter.textContent = stepLabel(current + 1, steps.length);
    text.textContent = steps[current] ?? '';
    advance.querySelector('.nl-button__label')!.textContent =
      current === steps.length - 1 ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Continue');
  }
  paint();
  return dialog;
}

// ---------------------------------------------------------------------------------------------
// Success

export interface SuccessDialogOptions {
  title: string;
  message: string;
  labels?: { playAgain?: string; close?: string };
  /** Called after the dialog closes via Play Again. */
  onPlayAgain: () => void;
  /** Called after it closes any other way (Close, X, Escape, backdrop). The app keeps the solved board visible and read-only. */
  onClose: () => void;
}

/** Concise success message with a quiet, decorative accent (no confetti). */
/** @deprecated Use createSuccessSheet. */
export function createSuccessDialog(options: SuccessDialogOptions): HTMLDialogElement {
  let again = false;
  const dialog = createDialog({
    title: options.title,
    onClose: () => (again ? options.onPlayAgain() : options.onClose()),
  });

  const accent = document.createElement('span');
  accent.className = 'nl-grim-glimmer-success__accent';
  accent.setAttribute('aria-hidden', 'true');
  getDialogBody(dialog).append(
    accent,
    paragraph('nl-grim-glimmer-success__message', options.message),
  );

  const playAgain = createButton({
    label: options.labels?.playAgain ?? 'Play Again',
    onClick: () => {
      again = true;
      closeDialog(dialog);
    },
  });
  playAgain.setAttribute('autofocus', '');
  getDialogActions(dialog).append(
    createButton({
      label: options.labels?.close ?? 'Close',
      variant: 'secondary',
      onClick: () => closeDialog(dialog),
    }),
    playAgain,
  );
  return dialog;
}

// ---------------------------------------------------------------------------------------------
// Discard confirmation

export interface DiscardConfirmDialogOptions {
  title: string;
  message: string;
  /** Names the consequence, e.g. "Discard and start new". */
  confirmLabel: string;
  cancelLabel?: string;
  /** After the dialog closes. The app then replaces the board. */
  onConfirm: () => void;
  /** After the dialog closes. The app keeps the board (and the difficulty it had). */
  onCancel: () => void;
}

/**
 * Confirmation before replacing an UNFINISHED board. Compulsory: not dismissible, so Escape and
 * the backdrop do nothing and the user must choose. Cancel (the safe choice) has initial focus.
 * Replacing a solved board needs no confirmation, so the app should not show this for one.
 */
export function createDiscardConfirmDialog(
  options: DiscardConfirmDialogOptions,
): HTMLDialogElement {
  let confirmed = false;
  const dialog = createDialog({
    title: options.title,
    dismissible: false,
    onClose: () => (confirmed ? options.onConfirm() : options.onCancel()),
  });
  getDialogBody(dialog).append(paragraph('nl-grim-glimmer-confirm__message', options.message));

  const cancel = createButton({
    label: options.cancelLabel ?? 'Cancel',
    variant: 'secondary',
    onClick: () => closeDialog(dialog),
  });
  cancel.setAttribute('autofocus', '');
  getDialogActions(dialog).append(
    cancel,
    createButton({
      label: options.confirmLabel,
      onClick: () => {
        confirmed = true;
        closeDialog(dialog);
      },
    }),
  );
  return dialog;
}
