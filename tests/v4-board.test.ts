import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  boardBudget,
  createV4Board,
  fixture,
  SIZES,
} from '../stories/projects/grim-glimmer-v4/board.js';

afterEach(() => document.body.replaceChildren());
describe('V4 board review', () => {
  it.each(SIZES)(
    'reuses accessible board cells at %s without inserting divider nodes into the grid',
    (size) => {
      const root = createV4Board({ size });
      const grid = root.querySelector('.nl-grim-glimmer-board')!;
      expect(grid.children).toHaveLength(size * size);
      expect(root.querySelectorAll('.gg-v4-block-line')).toHaveLength(size === 15 ? 4 : 0);
      expect(root.querySelectorAll('.gg-v4-ornament')).toHaveLength(0);
      expect(root.querySelectorAll('.gg-v4-block-line[aria-hidden="true"]')).toHaveLength(
        size === 15 ? 4 : 0,
      );
      expect(root.dataset.palette).toBe('current');
    },
  );
  it('cycles mock marks in place, preserves fixed spires and clears old conflict annotations', () => {
    const activate = vi.fn();
    const root = createV4Board({ size: 6, onCellActivate: activate });
    document.body.append(root);
    const cells = root.querySelectorAll<HTMLButtonElement>('[data-index]');
    const first = cells[0]!;
    first.focus();
    for (const state of ['tentative', 'placed', 'empty']) {
      first.click();
      expect(first.classList.contains(`nl-grim-glimmer-board__cell--${state}`)).toBe(true);
      expect(document.activeElement).toBe(first);
    }
    const fixed = cells[1]!;
    fixed.click();
    expect(activate).toHaveBeenCalledTimes(3);
    expect(fixed.getAttribute('aria-disabled')).toBe('true');
    const conflict = root.querySelector<HTMLButtonElement>('.gg-v4-conflict')!;
    conflict.click();
    expect(conflict.classList.contains('gg-v4-conflict')).toBe(false);
  });
  it.each(['pointerup', 'pointercancel', 'lostpointercapture', 'focusout'])(
    'clears active guides on %s and never changes cell state',
    (name) => {
      const root = createV4Board({ size: 6 });
      const grid = root.querySelector('.nl-grim-glimmer-board')!;
      const cell = grid.children[0]!;
      cell.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      expect(root.querySelectorAll('.gg-v4-guide')).toHaveLength(11);
      cell.dispatchEvent(new Event(name, { bubbles: true }));
      expect(root.querySelector('.gg-v4-guide')).toBeNull();
      expect(cell.classList.contains('nl-grim-glimmer-board__cell--empty')).toBe(true);
    },
  );
  it('announces zero-clue satisfied and over-count states independently of visual dimming', () => {
    const root = createV4Board({
      size: 6,
      rowStates: ['satisfied'],
      columnStates: ['over'],
    });
    const row = root.querySelector('.nl-grim-glimmer-clued-board__rows > *')!;
    const column = root.querySelector('.nl-grim-glimmer-clued-board__columns > *')!;
    expect(row.textContent).toContain('requires 0, 0 confirmed; satisfied');
    expect(column.textContent).toContain('requires 0, 1 confirmed; over count');
    expect(row.querySelector('.gg-v4-clue-number .gg-v4-clue-status')).not.toBeNull();
    expect(row.querySelector('.gg-v4-clue-status')?.textContent).toBe('✓');
    expect(column.querySelector('.gg-v4-clue-status')?.textContent).toBe('!');
  });
  it('renders read-only review boards without activating mock gameplay', () => {
    const activate = vi.fn();
    const root = createV4Board({ size: 5, interactive: false, onCellActivate: activate });
    expect(root.querySelector('button')).toBeNull();
    root.querySelector<HTMLElement>('[data-index]')!.click();
    expect(activate).not.toHaveBeenCalled();
    expect(fixture(5)).toContain('excluded');
  });
});

describe('dense-board sizing budget', () => {
  it.each([
    [393, 852, 20.8666667],
    [360, 780, 18.6666667],
  ])(
    'reports the fit compromise at %spx instead of claiming a 23px cell',
    (width, height, expected) => {
      expect(boardBudget(width, height, 15).cell).toBeCloseTo(expected, 5);
    },
  );
  it('needs 425px width for 23px dense cells with this frame', () => {
    expect(boardBudget(425, 852, 15).cell).toBe(23);
    expect(boardBudget(393, 852, 6).padding).toBe(16);
    expect(boardBudget(393, 852, 15).padding).toBe(6);
  });
  it('constrains height and avoids a negative budget on very small previews', () => {
    expect(boardBudget(800, 500, 15).card).toBe(276);
    expect(boardBudget(80, 150, 15).cell).toBe(0);
  });
});
