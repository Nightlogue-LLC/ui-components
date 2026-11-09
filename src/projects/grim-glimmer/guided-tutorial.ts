import { createButton } from '../../components/button/index.js';
import {
  closeDialog,
  createDialog,
  getDialogActions,
  getDialogBody,
} from '../../components/dialog/index.js';
import { createBoard, createCluedBoard, updateBoard, type BoardCellState } from './board.js';
import type { TutorialOutcome } from './dialogs.js';

export interface TutorialLesson {
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
  title: string;
  lessons: readonly TutorialLesson[];
  /** Storybook can open directly at a lesson for visual iteration. Default 0. */
  initialLesson?: number;
  /** Pause before the glow begins. Outlines appear immediately. Default 0ms. */
  glowDelay?: number;
  onDone: (outcome: TutorialOutcome) => void;
}

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
  const dialog = createDialog({ title: options.title, onClose: () => options.onDone(outcome) });
  dialog.classList.add('nl-grim-glimmer-guided-tutorial');
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
      current -= 1;
      paint(true);
    },
  });
  const next = createButton({
    label: 'Next',
    onClick: () => {
      if (next.disabled) return;
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
      },
      onCellActivate: (index: number) => {
        if (index !== practice?.index || done >= practice.sequence.length) return;
        squareCells[index] = practice.sequence[done]!.state;
        done += 1;
        progress[current] = done;
        updateBoard(board, { cells: squareCells });
        sync();
        // updateBoard resets aria-disabled; restore this lesson's restricted practice target.
        restrict();
        if (!next.disabled) next.focus();
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
    if (moveFocus) {
      if (practice && next.disabled) (board.children[practice.index] as HTMLElement).focus();
      else heading.focus();
    }
  }
  paint();
  return dialog;
}
