import { createButton } from '../../components/button/index.js';
import {
  closeDialog,
  createDialog,
  destroyDialog,
  getDialogActions,
  getDialogBody,
} from '../../components/dialog/index.js';
import { createBoard, createCluedBoard, updateBoard, type BoardCellState } from './board.js';
import { createGameplayMotion } from './gameplay-motion.js';
import type { TutorialOutcome } from './dialogs.js';

export interface TutorialLesson {
  /** Optional app-owned gesture/other visual, cloned without parsing text as markup. */
  illustration?: Node;
  title: string;
  instruction: string;
  boardLabel: string;
  size: number;
  /** Square board, or a single row when rowOnly is true. */
  cells: readonly BoardCellState[];
  rowOnly?: boolean;
  rowClues?: readonly number[];
  columnClues?: readonly number[];
  highlights?: readonly number[];
  highlightTone?: 'guidance' | 'error';
  highlightRow?: number;
  highlightColumn?: number;
  /** Only this cell is interactive. Every state must be reached before Next is enabled. */
  practice?: {
    index: number;
    sequence: readonly { state: BoardCellState; instruction: string }[];
  };
}

export interface GuidedTutorialOptions {
  /** Opt into approved editorial dots and shared transform/opacity guidance pulse. */
  presentation?: 'editorial';
  reducedMotion?: boolean;
  animations?: boolean;
  stateLabels?: Partial<Record<BoardCellState, string>>;
  title: string;
  lessons: readonly TutorialLesson[];
  /** Storybook can open directly at a lesson for visual iteration. Default 0. */
  initialLesson?: number;
  /** Pause before the legacy CSS glow begins. Outlines appear immediately. Default 0ms. */
  glowDelay?: number;
  onDone: (outcome: TutorialOutcome) => void;
}

const cleanups = new WeakMap<HTMLDialogElement, () => void>();

/** Presentation and local practice progress only. Lesson content belongs to the caller. */
export function createGuidedTutorialDialog(options: GuidedTutorialOptions): HTMLDialogElement {
  if (!options.lessons.length) throw new Error('Guided tutorial needs at least one lesson');
  for (const lesson of options.lessons) {
    const count = lesson.rowOnly ? lesson.size : lesson.size * lesson.size;
    if (!Number.isInteger(lesson.size) || lesson.size < 1 || lesson.cells.length !== count) {
      throw new Error('Tutorial lesson cells must match its dimensions');
    }
    if (
      lesson.practice &&
      (!lesson.practice.sequence.length ||
        !Number.isInteger(lesson.practice.index) ||
        lesson.practice.index < 0 ||
        lesson.practice.index >= count ||
        lesson.cells[lesson.practice.index] === 'fixed')
    ) {
      throw new Error('Tutorial practice needs an editable cell and a nonempty sequence');
    }
    if (
      (lesson.rowClues || lesson.columnClues) &&
      (lesson.rowOnly || !lesson.rowClues || !lesson.columnClues)
    ) {
      throw new Error('Clued lessons need a full board and both clue arrays');
    }
  }
  let current = Math.max(
    0,
    Math.min(options.lessons.length - 1, Math.trunc(options.initialLesson ?? 0) || 0),
  );
  const progress = options.lessons.map(() => 0);
  let outcome: TutorialOutcome = 'skip';
  let destroyed = false;
  const editorial = options.presentation === 'editorial';
  const dialog = createDialog({
    title: options.title,
    onClose: () => {
      closed();
      if (!destroyed && dialog.isConnected) options.onDone(outcome);
    },
  });
  dialog.classList.add('nl-grim-glimmer-guided-tutorial');
  if (editorial) dialog.classList.add('nl-grim-glimmer-guided-tutorial--editorial');
  dialog.dataset.reducedMotion = String(
    options.reducedMotion === true || options.animations === false,
  );
  dialog.style.setProperty(
    '--nl-grim-glimmer-tutorial-glow-delay',
    `${Math.max(0, options.glowDelay ?? 0)}ms`,
  );

  const counter = document.createElement('p');
  counter.className = 'nl-grim-glimmer-tutorial__step';
  const heading = document.createElement('h3');
  heading.className = 'nl-grim-glimmer-guided-tutorial__heading';
  heading.tabIndex = -1;
  const visual = document.createElement('div');
  visual.className = 'nl-grim-glimmer-guided-tutorial__visual';
  const instruction = document.createElement('p');
  instruction.className = 'nl-grim-glimmer-guided-tutorial__instruction';
  instruction.setAttribute('role', 'status');
  instruction.setAttribute('aria-atomic', 'true');
  getDialogBody(dialog).append(counter, heading, visual, instruction);

  const skip = createButton({
    label: 'Skip',
    variant: 'ghost',
    onClick: () => closeDialog(dialog),
  });
  const back = createButton({
    label: 'Back',
    variant: 'secondary',
    onClick: () => {
      if (destroyed) return;
      current -= 1;
      paint(true);
    },
  });
  const next = createButton({
    label: 'Next',
    onClick: () => {
      if (destroyed || next.disabled) return;
      if (current === options.lessons.length - 1) {
        outcome = 'finish';
        closeDialog(dialog);
      } else {
        current += 1;
        paint(true);
      }
    },
  });
  next.setAttribute('autofocus', '');
  getDialogActions(dialog).append(skip, back, next);

  function paint(moveFocus = false): void {
    if (destroyed) return;
    stopPulse();
    const lesson = options.lessons[current]!;
    const practice = lesson.practice;
    let done = progress[current]!;
    counter.textContent = `Step ${current + 1} of ${options.lessons.length}`;
    heading.textContent = lesson.title;
    back.hidden = current === 0;
    next.querySelector('.nl-button__label')!.textContent =
      current === options.lessons.length - 1 ? 'Begin' : 'Next';
    const sync = () => {
      next.disabled = !!practice && done < practice.sequence.length;
      instruction.textContent =
        done && practice ? practice.sequence[done - 1]!.instruction : lesson.instruction;
    };
    sync();
    const cells = [...lesson.cells];
    if (practice && done) cells[practice.index] = practice.sequence[done - 1]!.state;
    // createBoard accepts square data. A row lesson displays only its first row.
    const squareCells = lesson.rowOnly
      ? [...cells, ...Array<BoardCellState>(lesson.size * (lesson.size - 1)).fill('empty')]
      : cells;
    const boardOptions = {
      label: lesson.boardLabel,
      size: lesson.size,
      cells: squareCells,
      mode: practice ? ('interactive' as const) : ('readonly' as const),
      stateLabels: {
        fixed: 'spire',
        placed: 'confirmed star',
        tentative: 'tentative star',
        excluded: 'excluded',
        ...options.stateLabels,
      },
      onCellActivate: (index: number) => {
        if (destroyed || index !== practice?.index || done >= practice.sequence.length) return;
        squareCells[index] = practice.sequence[done]!.state;
        done += 1;
        progress[current] = done;
        updateBoard(board, { cells: squareCells });
        sync();
        // updateBoard resets aria-disabled; restore this lesson's restricted practice target.
        restrict();
        if (!next.disabled) next.focus({ preventScroll: true });
      },
    };
    const shell =
      lesson.rowClues && lesson.columnClues
        ? createCluedBoard({
            ...boardOptions,
            rowClues: lesson.rowClues,
            columnClues: lesson.columnClues,
          })
        : createBoard(boardOptions);
    const board = shell.matches('.nl-grim-glimmer-board')
      ? shell
      : shell.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
    if (lesson.rowOnly) {
      board.classList.add('nl-grim-glimmer-guided-tutorial__row');
      [...board.children].slice(lesson.size).forEach((cell) => cell.remove());
    }
    const tone = lesson.highlightTone ?? 'guidance';
    const highlight = (node: Element | undefined | null) => {
      node?.classList.add('nl-grim-glimmer-guided-tutorial__highlight');
      node?.setAttribute('data-highlight-tone', tone);
    };
    lesson.highlights?.forEach((index) => highlight(board.children[index]));
    if (lesson.highlightRow !== undefined) {
      const row = lesson.highlightRow;
      for (let col = 0; col < lesson.size; col += 1)
        highlight(board.children[row * lesson.size + col]);
      highlight(shell.querySelector('.nl-grim-glimmer-clued-board__rows')?.children[row]);
    }
    if (lesson.highlightColumn !== undefined) {
      const col = lesson.highlightColumn;
      for (let row = 0; row < lesson.size; row += 1)
        highlight(board.children[row * lesson.size + col]);
      highlight(shell.querySelector('.nl-grim-glimmer-clued-board__columns')?.children[col]);
    }
    function restrict(): void {
      if (!practice) return;
      [...board.children].forEach((node, index) => {
        const cell = node as HTMLButtonElement;
        cell.disabled = index !== practice.index;
        cell.setAttribute(
          'aria-disabled',
          String(cell.disabled || done >= practice.sequence.length),
        );
      });
    }
    restrict();
    visual.replaceChildren(shell);
    if (lesson.illustration) visual.append(lesson.illustration.cloneNode(true));
    syncEditorial();
    if (moveFocus) {
      if (practice && next.disabled)
        (board.children[practice.index] as HTMLElement).focus({ preventScroll: true });
      else heading.focus({ preventScroll: true });
    }
  }

  let pulse: ReturnType<typeof createGameplayMotion> | undefined;
  let ring: HTMLElement | undefined;
  const dots = document.createElement('div');
  dots.className = 'gg-v4-step-dots';
  dots.setAttribute('role', 'status');
  dots.setAttribute('aria-live', 'polite');
  dots.setAttribute('aria-atomic', 'true');
  if (editorial) {
    counter.hidden = true;
    counter.setAttribute('aria-hidden', 'true');
    counter.after(dots);
  }
  function stopPulse() {
    pulse?.dispose();
    pulse = undefined;
    ring?.remove();
    ring = undefined;
  }
  function syncEditorial() {
    if (!editorial) return;
    dots.replaceChildren();
    const spoken = document.createElement('span');
    spoken.className = 'nl-grim-glimmer-visually-hidden';
    spoken.textContent = `Step ${current + 1} of ${options.lessons.length}`;
    dots.append(spoken);
    options.lessons.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = 'gg-v4-step-dot';
      dot.setAttribute('aria-hidden', 'true');
      if (index === current) dot.dataset.current = 'true';
      dots.append(dot);
    });
    if (!dialog.open) return;
    const target = visual.querySelector<HTMLElement>(
      '.nl-grim-glimmer-board__cell.nl-grim-glimmer-guided-tutorial__highlight',
    );
    if (!target) return;
    ring = document.createElement('span');
    ring.className = 'nl-grim-glimmer-tutorial-ring';
    ring.setAttribute('aria-hidden', 'true');
    target.append(ring);
    pulse = createGameplayMotion({
      hint: ring,
      reducedMotion: options.reducedMotion,
      animations: options.animations,
    });
    pulse.mount();
  }
  const removal = new MutationObserver(() => {
    if (!dialog.isConnected) destroyGuidedTutorialDialog(dialog);
  });
  const opened = () => {
    if (destroyed || !editorial) return;
    stopPulse();
    syncEditorial();
    removal.observe(document.documentElement, { childList: true, subtree: true });
  };
  const closed = () => {
    stopPulse();
    removal.disconnect();
  };
  dialog.addEventListener('nl-dialog-open', opened);
  dialog.addEventListener('close', closed);
  cleanups.set(dialog, () => {
    destroyed = true;
    closed();
    dialog.removeEventListener('nl-dialog-open', opened);
    dialog.removeEventListener('close', closed);
  });
  paint();
  return dialog;
}

/** Terminal teardown: no skipped/finished outcome is emitted during screen unmount. */
export function destroyGuidedTutorialDialog(dialog: HTMLDialogElement): void {
  const cleanup = cleanups.get(dialog);
  if (!cleanup) return;
  cleanup();
  cleanups.delete(dialog);
  destroyDialog(dialog);
}
