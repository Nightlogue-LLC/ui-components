import { describe, expect, it, vi } from 'vitest';
import { createBoard, updateBoard, type BoardCellState } from './board.js';

const cells = (n: number, fill: BoardCellState = 'empty'): BoardCellState[] =>
  Array<BoardCellState>(n * n).fill(fill);
const cellEls = (root: HTMLElement) => [...root.children] as HTMLElement[];

describe('createBoard', () => {
  it('rejects a cell array that does not match the size', () => {
    expect(() => createBoard({ label: 'b', size: 5, mode: 'preview', cells: cells(4) })).toThrow(
      /25/,
    );
    expect(() => createBoard({ label: 'b', size: 0, mode: 'preview', cells: [] })).toThrow(/size/);
  });

  it('sets the grid size and one element per cell', () => {
    const board = createBoard({ label: 'b', size: 5, mode: 'preview', cells: cells(5) });
    expect(board.style.getPropertyValue('--nl-grim-glimmer-board-size')).toBe('5');
    expect(board.children).toHaveLength(25);
  });

  it('preview mode is decorative: hidden from assistive tech, no buttons, no labels', () => {
    const board = createBoard({ label: 'b', size: 3, mode: 'preview', cells: cells(3, 'fixed') });
    expect(board.getAttribute('aria-hidden')).toBe('true');
    expect(board.querySelector('button')).toBeNull();
    expect(board.hasAttribute('aria-label')).toBe(false);
  });

  it('interactive mode: labelled group of buttons with positional accessible names', () => {
    const state = cells(2);
    state[1] = 'placed';
    const board = createBoard({ label: 'Demo board', size: 2, mode: 'interactive', cells: state });
    expect(board.getAttribute('role')).toBe('group');
    expect(board.getAttribute('aria-label')).toBe('Demo board');
    const [first, second] = cellEls(board);
    expect(first!.tagName).toBe('BUTTON');
    expect((first as HTMLButtonElement).type).toBe('button');
    expect(first!.getAttribute('aria-label')).toBe('Row 1, column 1: empty');
    expect(second!.getAttribute('aria-label')).toBe('Row 1, column 2: placed piece');
  });

  it('supports translated state words and label format', () => {
    const board = createBoard({
      label: 'b',
      size: 1,
      mode: 'interactive',
      cells: ['marked'],
      stateLabels: { marked: 'markiert' },
      cellLabel: ({ row, column, state }) => `Z${row} S${column}: ${state}`,
    });
    expect(board.children[0]!.getAttribute('aria-label')).toBe('Z1 S1: markiert');
  });

  it('reports activations by index, but not for given (fixed) cells', () => {
    const onCellActivate = vi.fn();
    const state = cells(2);
    state[0] = 'fixed';
    const board = createBoard({
      label: 'b',
      size: 2,
      mode: 'interactive',
      cells: state,
      onCellActivate,
    });
    document.body.append(board);
    cellEls(board)[0]!.click();
    expect(cellEls(board)[0]!.getAttribute('aria-disabled')).toBe('true');
    expect(onCellActivate).not.toHaveBeenCalled();
    cellEls(board)[3]!.click();
    expect(onCellActivate).toHaveBeenCalledExactlyOnceWith(3);
    board.remove();
  });

  it('readonly mode: images, no buttons, nothing activatable', () => {
    const onCellActivate = vi.fn();
    const board = createBoard({
      label: 'Solved board',
      size: 2,
      mode: 'readonly',
      cells: cells(2, 'placed'),
      onCellActivate,
    });
    document.body.append(board);
    expect(board.querySelector('button')).toBeNull();
    expect(cellEls(board).every((c) => c.getAttribute('role') === 'img')).toBe(true);
    cellEls(board)[0]!.click();
    expect(onCellActivate).not.toHaveBeenCalled();
    board.remove();
  });
});

describe('updateBoard', () => {
  it('re-applies states and labels in place, keeping the same elements and focus', () => {
    const board = createBoard({ label: 'b', size: 2, mode: 'interactive', cells: cells(2) });
    document.body.append(board);
    const before = cellEls(board);
    before[2]!.focus();

    const next = cells(2);
    next[2] = 'marked';
    updateBoard(board, { cells: next });

    expect(cellEls(board)).toEqual(before);
    expect(document.activeElement).toBe(before[2]);
    expect(before[2]!.classList.contains('nl-grim-glimmer-board__cell--marked')).toBe(true);
    expect(before[2]!.classList.contains('nl-grim-glimmer-board__cell--empty')).toBe(false);
    expect(before[2]!.getAttribute('aria-label')).toBe('Row 2, column 1: marked');
    board.remove();
  });

  it('rejects wrong-length arrays and foreign elements', () => {
    const board = createBoard({ label: 'b', size: 2, mode: 'preview', cells: cells(2) });
    expect(() => updateBoard(board, { cells: cells(3) })).toThrow();
    expect(() => updateBoard(document.createElement('div'), { cells: [] })).toThrow();
  });
});
