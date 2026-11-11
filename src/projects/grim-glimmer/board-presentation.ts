import type { CluedBoardOptions, BoardCellState } from './board.js';

export type ClueStatus = 'default' | 'satisfied' | 'over';
export interface ClueFeedback {
  status: ClueStatus;
  confirmed: number;
}
export interface CluedBoardFeedback {
  rowFeedback?: readonly ClueFeedback[];
  columnFeedback?: readonly ClueFeedback[];
  conflicts?: readonly number[];
  hints?: readonly number[];
}
export interface CluedBoardUpdate extends CluedBoardFeedback {
  cells: readonly BoardCellState[];
}

/** Validate before updating any DOM. Statuses/counts are app reports, never inferred here. */
export function validateBoardFeedback(size: number, feedback: CluedBoardFeedback): void {
  for (const track of [feedback.rowFeedback, feedback.columnFeedback]) {
    if (
      track &&
      (track.length !== size ||
        track.some(
          (item) =>
            !['default', 'satisfied', 'over'].includes(item.status) ||
            !Number.isInteger(item.confirmed) ||
            item.confirmed < 0 ||
            item.confirmed > size,
        ))
    )
      throw new Error('Clue feedback must match board size and contain valid counts/statuses');
  }
  for (const indices of [feedback.conflicts, feedback.hints]) {
    if (indices?.some((index) => !Number.isInteger(index) || index < 0 || index >= size * size))
      throw new Error('Board annotation index is out of bounds');
  }
}

/** Adds accepted frame-free geometry; compatibility classes keep existing V4 consumers stable. */
export function applyEditorialBoard(root: HTMLElement, size: number): void {
  root.classList.add('nl-grim-glimmer-v4', 'gg-v4-board-card');
  root.dataset.size = String(size);
  root.dataset.framed = 'false';
  const grid = root.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  const frame = document.createElement('div');
  frame.className = 'gg-v4-grid-frame';
  grid.replaceWith(frame);
  frame.append(grid);
  if (size === 15) {
    for (const boundary of [5, 10]) {
      for (const axis of ['row', 'column']) {
        const line = document.createElement('span');
        line.className = `gg-v4-block-line gg-v4-block-line--${axis}`;
        line.setAttribute('aria-hidden', 'true');
        line.dataset.boundary = String(boundary);
        line.style.setProperty(
          '--gg-v4-cut',
          `calc(1px + (100% - 16px) * ${boundary / 15} + ${boundary - 0.5}px)`,
        );
        frame.append(line);
      }
    }
  }
}

export function paintBoardFeedback(
  root: HTMLElement,
  options: CluedBoardOptions,
  feedback: CluedBoardFeedback,
): void {
  for (const [axis, values, reports, label] of [
    ['rows', options.rowClues, feedback.rowFeedback, options.rowClueLabel],
    ['columns', options.columnClues, feedback.columnFeedback, options.columnClueLabel],
  ] as const) {
    root
      .querySelectorAll<HTMLElement>(`.nl-grim-glimmer-clued-board__${axis} > *`)
      .forEach((clue, index) => {
        const report = reports?.[index];
        clue.dataset.v4Status = report?.status ?? 'default';
        const number = clue.querySelector<HTMLElement>('[aria-hidden="true"]')!;
        number.classList.add('gg-v4-clue-number');
        number.textContent = String(values[index]);
        if (report?.status === 'over') {
          const marker = document.createElement('span');
          marker.className = 'gg-v4-clue-status';
          marker.setAttribute('aria-hidden', 'true');
          marker.textContent = '!';
          number.append(marker);
        }
        const base =
          label?.(index + 1, values[index]!) ??
          `${axis === 'rows' ? 'Row' : 'Column'} ${index + 1}: ${values[index]}`;
        clue.querySelector('.nl-grim-glimmer-visually-hidden')!.textContent = report
          ? `${base}; ${report.confirmed} confirmed; ${report.status === 'over' ? 'over count' : report.status === 'satisfied' ? 'satisfied' : 'not marked satisfied'}`
          : base;
      });
  }
  const grid = root.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  [...grid.children].forEach((cell, index) => {
    cell.classList.toggle('gg-v4-conflict', feedback.conflicts?.includes(index) ?? false);
    cell.querySelectorAll('.gg-v4-hint').forEach((node) => node.remove());
    if (feedback.hints?.includes(index)) {
      const ring = document.createElement('span');
      ring.className = 'gg-v4-hint';
      ring.setAttribute('aria-hidden', 'true');
      cell.append(ring);
    }
    const annotations = [
      feedback.conflicts?.includes(index) ? 'conflict' : '',
      feedback.hints?.includes(index) ? 'hint target' : '',
    ].filter(Boolean);
    if (options.mode !== 'preview' && annotations.length)
      cell.setAttribute(
        'aria-label',
        `${cell.getAttribute('aria-label')}; ${annotations.join('; ')}`,
      );
  });
}
