import {
  createBoard,
  createCluedBoard,
  updateCluedBoard,
  updateBoard,
  type BoardCellState,
} from '../../../src/projects/grim-glimmer/index.js';
import { el } from '../../lib/dom.js';
import './board.css';

export const SIZES = [5, 6, 8, 15] as const;
export type Size = (typeof SIZES)[number];
export type Palette = 'current' | 'proposal';
export type ClueState = 'default' | 'satisfied' | 'over';
export const CELL_STATES = ['empty', 'fixed', 'placed', 'tentative', 'excluded'] as const;

/** Layout budget in CSS px, with zero safe-area insets. No gameplay calculations. */
export function boardBudget(
  width: number,
  height: number,
  size: Size,
  chrome = 224,
  framed = false,
) {
  const cardFrame = framed && size !== 15;
  const padding = cardFrame ? 16 : 0;
  const card = Math.max(0, Math.min(448, width - 16, height - chrome));
  const grid = Math.max(0, card - (cardFrame ? 2 : 0) - padding * 2 - 24);
  return { card, grid, cell: Math.max(0, (grid - 2 - (size - 1)) / size), padding };
}

/** Deliberately illustrative states, not a generated or solvable puzzle. */
export function fixture(size: Size): BoardCellState[] {
  return Array.from({ length: size * size }, (_, i) =>
    i % (size + 3) === 1 ? 'fixed' : i % (size + 5) === 3 ? 'placed' : 'empty',
  ).map((state, i) => (i === 5 ? 'tentative' : i === 9 ? 'excluded' : state));
}

const labels = {
  fixed: 'spire',
  placed: 'star',
  tentative: 'tentative star',
  excluded: 'X exclusion',
};
export interface BoardOptions {
  size: Size;
  palette?: Palette;
  glow?: boolean;
  /** Optional framed presentation for small review boards only. */
  framed?: boolean;
  guides?: boolean;
  interactive?: boolean;
  cells?: readonly BoardCellState[];
  rowStates?: readonly ClueState[];
  columnStates?: readonly ClueState[];
  conflict?: boolean;
  hint?: boolean;
  onCellActivate?: (index: number) => void;
}

function scope(node: HTMLElement, palette: Palette) {
  node.classList.add('gg-v4-scope', 'nl-grim-glimmer-v4');
  node.dataset.palette = palette;
}

function decorateCell(cell: HTMLElement, kind: 'hint' | 'conflict') {
  if (kind === 'conflict') cell.classList.add('gg-v4-conflict');
  else cell.append(el('span', { className: 'gg-v4-hint' }));
  cell.setAttribute(
    'aria-label',
    `${cell.getAttribute('aria-label') ?? ''}; ${kind === 'hint' ? 'hint target' : 'conflict'}`,
  );
  cell.querySelector('.gg-v4-hint')?.setAttribute('aria-hidden', 'true');
}

/** Story-only composition: shared board semantics/artwork, isolated V4 layout and skin. */
export function createV4Board(options: BoardOptions): HTMLElement {
  const { size } = options;
  const cells = [...(options.cells ?? fixture(size))];
  const values = Array.from({ length: size }, (_, i) => (i === 0 ? 0 : (i % 3) + 1));
  const root = createCluedBoard({
    presentation: 'editorial',
    label: 'V4 Stars & Spires visual fixture — not a playable puzzle',
    size,
    mode: options.interactive === false ? 'readonly' : 'interactive',
    cells,
    rowClues: values,
    columnClues: values,
    stateLabels: labels,
    onCellActivate: (index) => {
      const current = cells[index];
      cells[index] =
        current === 'tentative'
          ? 'placed'
          : current === 'placed' || current === 'excluded'
            ? 'empty'
            : 'tentative';
      updateBoard(grid, { cells });
      // Restore presentation annotations after accessible labels update.
      paintAnnotations();
      options.onCellActivate?.(index);
    },
  });
  root.classList.add('gg-v4-board-card');
  scope(root, options.palette ?? 'current');
  root.dataset.size = String(size);
  root.dataset.framed = String(options.framed === true && size !== 15);
  root.dataset.glow = String(options.glow ?? true);
  const grid = root.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  const reports = (states?: readonly ClueState[]) =>
    values.map((value, i) => {
      const status = states?.[i] ?? (i === 1 ? 'satisfied' : i === 2 ? 'over' : 'default');
      return {
        status,
        confirmed:
          status === 'over' ? value + 1 : status === 'satisfied' ? value : Math.max(0, value - 1),
      };
    });
  updateCluedBoard(root, {
    cells,
    rowFeedback: reports(options.rowStates),
    columnFeedback: reports(options.columnStates),
  });
  // Keep the older accessible sentence in the fixture comparison.
  root.querySelectorAll('.nl-grim-glimmer-visually-hidden').forEach((description) => {
    description.textContent = (description.textContent ?? '').replace(
      /^(Row|Column) (\d+): (\d+);/,
      '$1 $2: requires $3,',
    );
  });
  function paintAnnotations() {
    grid.querySelectorAll('.gg-v4-hint').forEach((node) => node.remove());
    grid
      .querySelectorAll('.gg-v4-conflict')
      .forEach((node) => node.classList.remove('gg-v4-conflict'));
    const star = cells.indexOf('placed');
    const empty = cells.indexOf('empty');
    if (options.conflict !== false && star >= 0)
      decorateCell(grid.children[star] as HTMLElement, 'conflict');
    if (options.hint !== false && empty >= 0)
      decorateCell(grid.children[empty] as HTMLElement, 'hint');
  }
  paintAnnotations();
  const clearGuides = () =>
    grid.querySelectorAll('.gg-v4-guide').forEach((cell) => cell.classList.remove('gg-v4-guide'));
  if (options.guides !== false && options.interactive !== false) {
    grid.addEventListener('pointerdown', (event) => {
      const cell =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-index]') : null;
      if (!cell || cell.getAttribute('aria-disabled') === 'true') return;
      clearGuides();
      const index = Number(cell.dataset.index);
      [...grid.children].forEach((item, i) =>
        item.classList.toggle(
          'gg-v4-guide',
          Math.floor(i / size) === Math.floor(index / size) || i % size === index % size,
        ),
      );
      // Capture only to receive release/cancel; drag-paint belongs to Phase 3.
      cell.setPointerCapture?.(event.pointerId);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture', 'focusout'])
      grid.addEventListener(name, clearGuides);
  }
  return root;
}

export function createV4Cell(
  state: BoardCellState,
  palette: Palette = 'current',
  annotation?: 'hint' | 'conflict',
) {
  const host = el('div', { className: 'gg-v4-cell-sample' });
  scope(host, palette);
  host.dataset.glow = 'true';
  const grid = createBoard({
    size: 1,
    mode: 'readonly',
    cells: [state],
    label: 'Cell specimen',
    stateLabels: labels,
  });
  host.append(grid);
  if (annotation) decorateCell(grid.children[0] as HTMLElement, annotation);
  return host;
}

export function boardStage(options: BoardOptions): HTMLElement {
  const root = el('section', { className: 'gg-v4-board-stage' });
  scope(root, options.palette ?? 'current');
  root.setAttribute('aria-label', 'Isolated V4 board review');
  const header = el('header', { className: 'gg-v4-review-header' }, [
    el('h1', { text: 'Stars & Spires' }),
    el('p', {
      text: `V4 · ${options.size} × ${options.size} · ${options.palette ?? 'current'} palette`,
    }),
  ]);
  const well = el('div', { className: 'gg-v4-board-well' }, [createV4Board(options)]);
  const footer = el('footer', { className: 'gg-v4-review-footer' }, [
    el('p', { text: 'Visual fixture · no puzzle rules' }),
    el('p', {
      text:
        options.size === 15
          ? 'Dense board: fit preview. Zoom is deferred to Phase 3.'
          : 'Tap an empty cell: tentative → confirmed → empty.',
    }),
  ]);
  root.append(header, well, footer);
  return root;
}
