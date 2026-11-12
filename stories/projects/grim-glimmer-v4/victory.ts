import { createSuccessMessagePicker } from '../../../src/projects/grim-glimmer/success-sheet.js';
import {
  createCompletionSheet,
  type CompletionSheetOptions,
} from '../../../src/projects/grim-glimmer/completion-sheet.js';
import {
  createCompletionSequence,
  COMPLETION_TIMING,
} from '../../../src/projects/grim-glimmer/completion-sequence.js';
import { createButton } from '../../../src/components/button/index.js';
import { createV4Board, fixture, type Size } from './board.js';
import { el } from '../../lib/dom.js';
import './victory.css';
export const VICTORY_TIMING = COMPLETION_TIMING;
export const VICTORY_MESSAGES = [
  'Every tent is in place.',
  'A little order beneath the night.',
  'A quiet camp beneath the trees.',
] as const;
export interface VictoryOptions {
  size?: 6 | 15;
  reducedMotion?: boolean;
  haptics?: boolean;
  success?: () => void;
  message?: string;
  messageMode?: 'fixed' | 'bank';
  messages?: readonly string[];
  showStats?: boolean;
  time?: string;
  hints?: number;
  mistakes?: number;
  tryMedium?: boolean;
  onHome?: () => void;
  onNext?: () => void;
  onMedium?: () => void;
  onDismiss?: () => void;
}
function sheetOptions(
  options: VictoryOptions,
  message: string | (() => string),
  dismissed?: () => void,
): CompletionSheetOptions {
  return {
    title: 'Puzzle Complete',
    message,
    animations: options.reducedMotion !== true,
    labels: { newGame: 'Next Puzzle', returnHome: 'Return Home', close: 'Close completion' },
    statistics:
      options.showStats === false
        ? undefined
        : [
            { label: 'TIME', value: options.time ?? '02:14' },
            { label: 'HINTS', value: options.hints ?? 0 },
            { label: 'MISTAKES', value: options.mistakes ?? 1 },
          ],
    onNewGame: () => {
      dismissed?.();
      options.onNext?.();
    },
    onReturnHome: () => {
      dismissed?.();
      options.onHome?.();
    },
    onClose: () => {
      dismissed?.();
      options.onDismiss?.();
    },
    extraAction: options.tryMedium
      ? {
          label: 'Try Medium →',
          onSelect: () => {
            dismissed?.();
            options.onMedium?.();
          },
        }
      : undefined,
  };
}
/** Fixture values and callbacks stay in Storybook; composition is supported library code. */
export function createVictorySheet(
  options: VictoryOptions,
  message: string | (() => string),
  dismissed?: () => void,
) {
  return createCompletionSheet(sheetOptions(options, message, dismissed));
}
export function solvedCells(size: Size) {
  return fixture(size).map((state, index) =>
    state === 'fixed' ? state : index % (size + 2) === 0 ? 'placed' : 'empty',
  );
}
function solvedBoard(size: 6 | 15) {
  const board = createV4Board({
    size,
    cells: solvedCells(size),
    interactive: false,
    hint: false,
    conflict: false,
    rowStates: Array.from({ length: size }, () => 'satisfied' as const),
    columnStates: Array.from({ length: size }, () => 'satisfied' as const),
  });
  board.classList.add('gg-v4-victory-board');
  board.setAttribute(
    'aria-label',
    'Illustrative solved-board presentation; not a validated puzzle',
  );
  return board;
}
class VictoryHost extends HTMLElement {
  cleanup?: () => void;
  disconnectedCallback() {
    this.cleanup?.();
  }
}
if (!customElements.get('gg-v4-victory-host'))
  customElements.define('gg-v4-victory-host', VictoryHost);
export function createVictoryPreview(
  options: VictoryOptions = {},
  mode: 'sheet' | 'solved' | 'sequence' = 'sequence',
) {
  const size = options.size ?? 6;
  const root = document.createElement('gg-v4-victory-host') as VictoryHost;
  root.className = 'gg-v4-victory-stage gg-v4-scope';
  root.dataset.solved = String(mode === 'solved');
  const title = el('h1', { text: 'Trees & Tents' });
  const chip = el('span', { className: 'gg-v4-solved-chip', text: 'Solved' });
  chip.hidden = mode !== 'solved';
  const subtitle = el(
    'p',
    { className: 'gg-v4-victory-subtitle', text: `EASY · ${size}×${size} ` },
    [chip],
  );
  const board = solvedBoard(size);
  const well = el('div', { className: 'gg-v4-victory-well' }, [board]);
  const status = el('p', {
    className: 'gg-v4-victory-status',
    text: mode === 'solved' ? 'Solved preview · read-only' : 'Replay the completion sequence.',
  });
  status.setAttribute('role', 'status');
  const bank = createSuccessMessagePicker(options.messages ?? VICTORY_MESSAGES);
  let sequence: ReturnType<typeof createCompletionSequence> | undefined;
  let disposed = false;
  const replay = createButton({
    label: mode === 'sheet' ? 'Open completion sheet' : 'Replay victory',
    onClick: () => {
      if (disposed) return;
      replay.focus({ preventScroll: true });
      sequence?.dispose();
      sequence = createCompletionSequence({
        ...sheetOptions(
          options,
          options.messageMode === 'bank' ? bank : (options.message ?? 'Every tent is in place.'),
          () => {
            status.textContent = 'Solved · completed board remains read-only.';
          },
        ),
        host: root,
        board,
        size,
        reducedMotion: options.reducedMotion,
      });
      chip.hidden = false;
      root.dataset.solved = 'true';
      status.textContent = 'Puzzle complete · solved preview is read-only.';
      if (options.haptics) options.success?.();
      sequence.start({ celebration: mode !== 'sheet' });
    },
  });
  const back = createButton({
    label: 'Simulate Back',
    variant: 'ghost',
    size: 'sm',
    onClick: () => {
      const sheet = root.querySelector<HTMLDialogElement>('dialog');
      if (sheet?.open) sheet.dispatchEvent(new Event('cancel', { cancelable: true }));
      else if (sequence) {
        sequence.cancel();
        status.textContent = 'Solved · completion replay cancelled.';
        replay.focus({ preventScroll: true });
        options.onDismiss?.();
      }
    },
  });
  root.append(
    el('header', { className: 'gg-v4-victory-header' }, [title, subtitle]),
    well,
    status,
    el('div', { className: 'gg-v4-victory-review-actions' }, [replay, back]),
  );
  root.cleanup = () => {
    disposed = true;
    sequence?.dispose();
  };
  return root;
}
/** Static comparison avoids competing top-layer modals in a two-theme story. */
export function createVictoryComparison(options: VictoryOptions = {}) {
  const root = createVictoryPreview(options, 'solved');
  root.querySelector('.gg-v4-victory-review-actions')?.remove();
  const sheet = createVictorySheet(
    { ...options, reducedMotion: true },
    options.message ?? 'Every tent is in place.',
  );
  const panel = sheet.querySelector<HTMLElement>('.nl-dialog__panel')!;
  panel.setAttribute('inert', '');
  const specimen = el('section', { className: 'gg-v4-victory-sheet gg-v4-victory-inline' }, [
    panel,
  ]);
  specimen.setAttribute('aria-label', 'Static completion sheet comparison');
  root.append(specimen);
  return root;
}
