/**
 * A square board of cells for previews, tutorials and mock flows.
 *
 * This is presentation only: it draws whatever cell states it is given and reports activations.
 * It has no puzzle rules, generation or solving; those belong to the game app. The glyphs are
 * deliberately generic geometric placeholders (circle / triangle / dot), not final artwork.
 */
export type BoardCellState = 'empty' | 'fixed' | 'placed' | 'marked' | 'tentative' | 'excluded';

/**
 * - preview:     static decoration (hidden from assistive tech), e.g. inside a collection card.
 * - interactive: cells are buttons; `fixed` cells are announced but not activatable.
 * - readonly:    cells are images (e.g. a solved board that stays visible but cannot be changed).
 */
export type BoardMode = 'preview' | 'interactive' | 'readonly';

export interface BoardProps {
  /** Row-major, length `size * size`. */
  cells: readonly BoardCellState[];
}

export interface BoardOptions extends BoardProps {
  /** Accessible name of the board (ignored for `preview`). */
  label: string;
  size: number;
  mode: BoardMode;
  /** Called with the cell index when an activatable cell is pressed. Interactive mode only. */
  onCellActivate?: (index: number) => void;
  /** Words used in each cell's accessible name. Provide translations as needed. */
  stateLabels?: Partial<Record<BoardCellState, string>>;
  /** Builds a cell's accessible name from its position (1-based) and state word. */
  cellLabel?: (info: { row: number; column: number; state: string }) => string;
}

const DEFAULT_STATE_LABELS: Record<BoardCellState, string> = {
  empty: 'empty',
  fixed: 'given piece',
  placed: 'placed piece',
  marked: 'marked',
  tentative: 'tentative tent',
  excluded: 'excluded',
};

interface Config {
  size: number;
  mode: BoardMode;
  labels: Record<BoardCellState, string>;
  cellLabel: NonNullable<BoardOptions['cellLabel']>;
}

const configs = new WeakMap<HTMLElement, Config>();

export function createBoard(options: BoardOptions): HTMLElement {
  const { size, mode, label, onCellActivate, cells } = options;
  if (!Number.isInteger(size) || size < 1)
    throw new Error('createBoard: size must be a positive integer');
  if (cells.length !== size * size)
    throw new Error(`createBoard: expected ${size * size} cells, got ${cells.length}`);

  const root = document.createElement('div');
  root.classList.add('nl-grim-glimmer-board', `nl-grim-glimmer-board--${mode}`);
  root.style.setProperty('--nl-grim-glimmer-board-size', String(size));
  if (mode === 'preview') {
    root.setAttribute('aria-hidden', 'true');
  } else {
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', label);
  }

  configs.set(root, {
    size,
    mode,
    labels: { ...DEFAULT_STATE_LABELS, ...options.stateLabels },
    cellLabel:
      options.cellLabel ?? (({ row, column, state }) => `Row ${row}, column ${column}: ${state}`),
  });

  const nodes = cells.map((_, index) => {
    const cell = document.createElement(mode === 'interactive' ? 'button' : 'span');
    cell.classList.add('nl-grim-glimmer-board__cell');
    cell.dataset.index = String(index);
    if (cell instanceof HTMLButtonElement) cell.type = 'button';
    if (mode === 'readonly') cell.setAttribute('role', 'img');
    return cell;
  });
  root.append(...nodes);

  if (mode === 'interactive' && onCellActivate) {
    root.addEventListener('click', (event) => {
      const cell =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-index]') : null;
      if (!cell || cell.getAttribute('aria-disabled') === 'true') return;
      onCellActivate(Number(cell.dataset.index));
    });
  }

  updateBoard(root, { cells });
  return root;
}

/** Re-applies cell states in place (keeps keyboard focus). Pass the full `cells` array. */
export function updateBoard(root: HTMLElement, props: BoardProps): void {
  const config = configs.get(root);
  if (!config) throw new Error('updateBoard: element was not made by createBoard');
  if (props.cells.length !== config.size * config.size) {
    throw new Error(
      `updateBoard: expected ${config.size * config.size} cells, got ${props.cells.length}`,
    );
  }
  const states: BoardCellState[] = ['empty', 'fixed', 'placed', 'marked', 'tentative', 'excluded'];
  props.cells.forEach((state, index) => {
    const cell = root.children[index];
    if (!(cell instanceof HTMLElement)) return;
    for (const s of states) cell.classList.toggle(`nl-grim-glimmer-board__cell--${s}`, s === state);
    if (config.mode === 'preview') return;
    cell.setAttribute(
      'aria-label',
      config.cellLabel({
        row: Math.floor(index / config.size) + 1,
        column: (index % config.size) + 1,
        state: config.labels[state],
      }),
    );
    if (config.mode === 'interactive') {
      cell.setAttribute('aria-disabled', state === 'fixed' ? 'true' : 'false');
    }
  });
}

/** Clue counts are supplied by the game, never derived from presentation state. */
export interface CluedBoardOptions extends BoardOptions {
  rowClues: readonly number[];
  columnClues: readonly number[];
  rowClueLabel?: (row: number, value: number) => string;
  columnClueLabel?: (column: number, value: number) => string;
}

/** Engraved board with column counts above and row counts on the right. */
export function createCluedBoard(options: CluedBoardOptions): HTMLElement {
  const { size, rowClues, columnClues } = options;
  const valid = (values: readonly number[]) =>
    values.length === size && values.every((n) => Number.isInteger(n) && n >= 0 && n <= size);
  if (!valid(rowClues) || !valid(columnClues)) {
    throw new Error(
      'createCluedBoard: clue arrays must match size and contain counts from 0 to size',
    );
  }
  const shell = document.createElement('section');
  shell.className = 'nl-grim-glimmer-clued-board';
  shell.style.setProperty('--nl-grim-glimmer-clued-board-size', String(size));
  if (options.mode === 'preview') shell.setAttribute('aria-hidden', 'true');

  const columns = document.createElement('div');
  columns.className = 'nl-grim-glimmer-clued-board__columns';
  columns.setAttribute('aria-label', 'Column clues');
  columnClues.forEach((value, index) => {
    const clue = document.createElement('span');
    clue.className = 'nl-grim-glimmer-clued-board__clue';
    clue.textContent = String(value);
    clue.setAttribute(
      'aria-label',
      options.columnClueLabel?.(index + 1, value) ?? `Column ${index + 1}: ${value}`,
    );
    columns.append(clue);
  });

  const rows = document.createElement('div');
  rows.className = 'nl-grim-glimmer-clued-board__rows';
  rows.setAttribute('aria-label', 'Row clues');
  rowClues.forEach((value, index) => {
    const clue = document.createElement('span');
    clue.className = 'nl-grim-glimmer-clued-board__clue';
    clue.textContent = String(value);
    clue.setAttribute(
      'aria-label',
      options.rowClueLabel?.(index + 1, value) ?? `Row ${index + 1}: ${value}`,
    );
    rows.append(clue);
  });

  const grid = createBoard(options);
  grid.classList.add('nl-grim-glimmer-board--engraved');
  const body = document.createElement('div');
  body.className = 'nl-grim-glimmer-clued-board__body';
  body.append(grid, rows);
  shell.append(columns, body);
  return shell;
}
