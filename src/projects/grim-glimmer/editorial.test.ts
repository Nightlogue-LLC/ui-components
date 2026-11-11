import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCluedBoard,
  updateCluedBoard,
  createTarotGameplayHeader,
  createGameControlRow,
  updateGameControlRow,
  createGameToolToggle,
  updateGameToolToggle,
  type BoardCellState,
  type GameControlState,
} from './index.js';

afterEach(() => document.body.replaceChildren());
const state: GameControlState = { mode: 'tent', canUndo: true, haptics: true };
const options = (size: number) => ({
  label: 'Real adapter board',
  size,
  mode: 'interactive' as const,
  presentation: 'editorial' as const,
  cells: Array<BoardCellState>(size * size).fill('empty'),
  rowClues: Array<number>(size).fill(0),
  columnClues: Array<number>(size).fill(0),
});
const button = (root: HTMLElement, label: string) =>
  root.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;

describe('supported editorial board', () => {
  it.each([6, 8, 10, 12, 15])('renders %s without fixture marks, clues or annotations', (size) => {
    const root = createCluedBoard(options(size));
    expect(root.classList.contains('nl-grim-glimmer-v4')).toBe(true);
    expect(root.querySelectorAll('.nl-grim-glimmer-board__cell--empty')).toHaveLength(size * size);
    expect(root.querySelectorAll('.gg-v4-clue-number')).toHaveLength(size * 2);
    expect(root.querySelectorAll('[data-v4-status="default"]')).toHaveLength(size * 2);
    expect(root.querySelectorAll('.gg-v4-hint, .gg-v4-conflict')).toHaveLength(0);
    expect(root.querySelectorAll('.gg-v4-block-line')).toHaveLength(size === 15 ? 4 : 0);
    expect(
      root
        .querySelector('.gg-v4-grid-frame')
        ?.children[0]?.classList.contains('nl-grim-glimmer-board'),
    ).toBe(true);
  });
  it('updates live feedback in place, clears stale annotations and preserves focus and custom labels', () => {
    const props = options(6);
    const root = createCluedBoard({
      ...props,
      rowClueLabel: (row, value) => `R${row} needs ${value}`,
    });
    document.body.append(root);
    const cell = root.querySelector<HTMLButtonElement>('[data-index="0"]')!;
    cell.focus();
    updateCluedBoard(root, {
      cells: ['placed', ...props.cells.slice(1)],
      conflicts: [0],
      hints: [1],
      rowFeedback: Array.from({ length: 6 }, () => ({ status: 'over', confirmed: 1 })),
      columnFeedback: Array.from({ length: 6 }, () => ({ status: 'satisfied', confirmed: 0 })),
    });
    expect(root.querySelectorAll('.gg-v4-clue-status')).toHaveLength(6);
    expect(root.textContent).toContain('R1 needs 0; 1 confirmed; over count');
    expect(cell.getAttribute('aria-label')).toContain('conflict');
    expect(document.activeElement).toBe(cell);
    updateCluedBoard(root, { cells: props.cells });
    expect(root.querySelectorAll('.gg-v4-clue-status, .gg-v4-conflict, .gg-v4-hint')).toHaveLength(
      0,
    );
    expect(cell.getAttribute('aria-label')).not.toContain('conflict');
    expect(document.activeElement).toBe(cell);
  });
  it('rejects malformed feedback before modifying the board', () => {
    const props = options(6),
      root = createCluedBoard(props),
      before = root.outerHTML;
    expect(() => updateCluedBoard(root, { cells: props.cells, hints: [36] })).toThrow();
    expect(() =>
      updateCluedBoard(root, {
        cells: props.cells,
        rowFeedback: [{ status: 'over', confirmed: 7 }],
      }),
    ).toThrow();
    expect(root.outerHTML).toBe(before);
  });
  it('leaves legacy geometry and clue markup opt-in', () => {
    const legacy = { ...options(6), presentation: undefined };
    const root = createCluedBoard(legacy);
    expect(root.classList.contains('nl-grim-glimmer-v4')).toBe(false);
    expect(root.querySelector('.gg-v4-grid-frame, .gg-v4-clue-number')).toBeNull();
    expect(
      root
        .querySelector('.nl-grim-glimmer-clued-board__body')
        ?.lastElementChild?.classList.contains('nl-grim-glimmer-board'),
    ).toBe(true);
  });
  it('does not mutate supplied cells or calculate moves on activation', () => {
    const props = options(6),
      activate = vi.fn();
    const root = createCluedBoard({ ...props, onCellActivate: activate });
    root.querySelector<HTMLButtonElement>('[data-index="0"]')!.click();
    expect(activate).toHaveBeenCalledWith(0);
    expect(props.cells.every((cell) => cell === 'empty')).toBe(true);
    expect(root.querySelector('.nl-grim-glimmer-board__cell--tentative')).toBeNull();
  });
});

describe('supported tarot header', () => {
  it('keeps independent identity fields, rectangular dimensions and honest help labels', () => {
    const help = vi.fn(),
      menu = vi.fn();
    const root = createTarotGameplayHeader({
      tarotNumeral: 'IV',
      archetypeTitle: 'The Lantern',
      puzzleName: '<Future Puzzle>',
      difficulty: 'Hard',
      columns: 10,
      rows: 12,
      hintLabel: 'How to Play',
      onHint: help,
      onMenu: menu,
    });
    expect(root.querySelector('h1')!.textContent).toBe('<Future Puzzle>');
    expect(root.querySelector('future')).toBeNull();
    expect(root.textContent).toContain('IV · THE LANTERN');
    expect(root.textContent).toContain('Hard · 10×12');
    button(root, 'How to Play').click();
    button(root, 'Game menu').click();
    expect(help).toHaveBeenCalledOnce();
    expect(menu).toHaveBeenCalledOnce();
    expect(() =>
      createTarotGameplayHeader({
        tarotNumeral: 'I',
        archetypeTitle: 'X',
        puzzleName: 'X',
        difficulty: 'Easy',
        columns: NaN,
        rows: 6,
      }),
    ).toThrow();
  });
});

describe('controlled editorial controls', () => {
  it('requests changes without owning app state and updates tool/focus in place', () => {
    const change = vi.fn(),
      tick = vi.fn();
    const root = createGameToolToggle({ ...state, tick, onModeChange: change });
    document.body.append(root);
    button(root, 'Place tent').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(change).toHaveBeenCalledWith('exclude');
    expect(tick).toHaveBeenCalledOnce();
    expect(button(root, 'Place tent').getAttribute('aria-pressed')).toBe('true');
    const focused = button(root, 'Exclude cell');
    expect(document.activeElement).toBe(focused);
    updateGameToolToggle(root, { ...state, mode: 'exclude', haptics: false });
    expect(root.querySelector('[aria-label="Exclude cell"]')).toBe(focused);
    expect(focused.getAttribute('aria-pressed')).toBe('true');
    button(root, 'Place tent').click();
    expect(tick).toHaveBeenCalledOnce();
  });
  it('updates disabled/history/hint state without recreating native controls or emitting feedback', () => {
    const undo = vi.fn(),
      restart = vi.fn(),
      tick = vi.fn();
    const root = createGameControlRow({
      ...state,
      tick,
      onUndo: undo,
      onRestart: restart,
      onHint: vi.fn(),
      onModeChange: vi.fn(),
    });
    const control = button(root, 'Undo move');
    control.click();
    expect(undo).toHaveBeenCalledOnce();
    updateGameControlRow(root, {
      ...state,
      canUndo: false,
      disabled: true,
      hint: 'available',
      reducedMotion: true,
    });
    expect(button(root, 'Undo move')).toBe(control);
    root.querySelectorAll<HTMLButtonElement>('button').forEach((node) => {
      expect(node.disabled).toBe(true);
      node.click();
    });
    expect(undo).toHaveBeenCalledOnce();
    expect(restart).not.toHaveBeenCalled();
    expect(tick).toHaveBeenCalledOnce();
    expect(root.dataset.reducedMotion).toBe('true');
    updateGameControlRow(root, { ...state, hint: 'disabled', haptics: false });
    expect(button(root, 'Hint').disabled).toBe(true);
    button(root, 'Restart board').click();
    expect(restart).toHaveBeenCalledOnce();
    expect(tick).toHaveBeenCalledOnce();
  });
  it('can omit the duplicate hint and disables actions without app callbacks', () => {
    const root = createGameControlRow({ ...state, showHint: false });
    expect(root.querySelector('[aria-label*="Hint"]')).toBeNull();
    expect(root.querySelector('[aria-label*="Redo"], [role="status"]')).toBeNull();
    root
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((node) => expect(node.disabled).toBe(true));
  });
});
