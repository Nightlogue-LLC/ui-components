import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  InteractionModel,
  clampView,
  interpolate,
  pinchView,
  type SelectionAdapter,
} from '../stories/projects/grim-glimmer-v4/interaction-model.js';
import { createInteractionDemo } from '../stories/projects/grim-glimmer-v4/interaction.js';
import type { BoardCellState } from '../src/projects/grim-glimmer/index.js';
const empty = (size = 5): BoardCellState[] =>
  Array.from({ length: size * size }, (): BoardCellState => 'empty');
function adapter(): SelectionAdapter {
  return { selectionStart: vi.fn(), selectionChanged: vi.fn(), selectionEnd: vi.fn() };
}
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
describe('V4 stroke transactions', () => {
  it('paints once per cell, skips spires and different glyphs, then undoes the entire stroke', () => {
    const cells = empty();
    cells[1] = 'fixed';
    cells[2] = 'excluded';
    cells[3] = 'tentative';
    const h = adapter();
    const transaction = vi.fn();
    const model = new InteractionModel({
      size: 5,
      cells,
      adapter: h,
      haptics: true,
      onTransaction: transaction,
    });
    model.begin(0);
    for (const index of [1, 2, 3, 4, 4, 0]) model.visit(index);
    model.commit();
    expect(model.cells.slice(0, 5)).toEqual(['placed', 'fixed', 'excluded', 'tentative', 'placed']);
    expect(h.selectionStart).toHaveBeenCalledTimes(1);
    expect(h.selectionChanged).toHaveBeenCalledTimes(2);
    expect(h.selectionEnd).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledWith('stroke');
    expect(model.history).toHaveLength(1);
    model.undo();
    expect(model.cells).toEqual(cells);
    expect(model.history).toHaveLength(0);
  });
  it.each(['star', 'exclude'] as const)(
    'erases only matching %s marks and does not toggle repeated visits',
    (tool) => {
      const cells = empty();
      cells[0] = tool === 'star' ? 'placed' : 'excluded';
      cells[1] = cells[0]!;
      cells[2] = tool === 'star' ? 'excluded' : 'placed';
      const model = new InteractionModel({ size: 5, cells });
      model.tool = tool;
      model.begin(0);
      model.visit(1);
      model.visit(1);
      model.visit(2);
      model.commit();
      expect(model.cells.slice(0, 3)).toEqual(['empty', 'empty', cells[2]]);
      model.undo();
      expect(model.cells).toEqual(cells);
    },
  );
  it.each(['fixed', 'excluded', 'tentative'] as const)(
    'rejects %s as a star stroke start without a history entry',
    (state) => {
      const cells = empty();
      cells[0] = state;
      const model = new InteractionModel({ size: 5, cells });
      model.begin(0);
      model.visit(1);
      model.commit();
      expect(model.cells).toEqual(cells);
      expect(model.history).toHaveLength(0);
    },
  );
  it('rolls back cancellation and closes one complete selection session', () => {
    const h = adapter();
    const model = new InteractionModel({ size: 5, cells: empty(), haptics: true, adapter: h });
    model.begin(0);
    model.visit(1);
    model.cancel();
    model.cancel();
    expect(model.cells).toEqual(empty());
    expect(model.history).toHaveLength(0);
    expect(h.selectionEnd).toHaveBeenCalledTimes(1);
  });
  it('gates all selection session calls when haptics are off', () => {
    const h = adapter();
    const model = new InteractionModel({ size: 5, cells: empty(), haptics: false, adapter: h });
    model.begin(0);
    model.visit(1);
    model.commit();
    expect(h.selectionStart).not.toHaveBeenCalled();
    expect(h.selectionChanged).not.toHaveBeenCalled();
    expect(h.selectionEnd).not.toHaveBeenCalled();
  });
  it('locks to the first two cells, projecting later movement onto that row', () => {
    const model = new InteractionModel({ size: 5, cells: empty() });
    model.begin(6);
    model.visit(7);
    model.visit(13);
    model.commit();
    expect(model.cells[8]).toBe('placed');
    expect(model.cells[13]).toBe('empty');
  });
  it('locks vertically and allows an unlocked free stroke', () => {
    const locked = new InteractionModel({ size: 5, cells: empty() });
    locked.begin(6);
    locked.visit(11);
    locked.visit(17);
    locked.commit();
    expect(locked.cells[16]).toBe('placed');
    expect(locked.cells[17]).toBe('empty');
    const free = new InteractionModel({ size: 5, cells: empty(), axisLock: false });
    free.begin(6);
    free.visit(11);
    free.visit(17);
    free.commit();
    expect(free.cells[17]).toBe('placed');
  });
  it('records restart once, keeps spires and restores exactly without a toast', () => {
    const cells = empty();
    cells[0] = 'fixed';
    cells[1] = 'placed';
    cells[2] = 'excluded';
    const model = new InteractionModel({ size: 5, cells });
    model.restart();
    model.restart();
    expect(model.history).toHaveLength(1);
    expect(model.cells[0]).toBe('fixed');
    model.undo();
    expect(model.cells).toEqual(cells);
  });
  it('discards a pending stroke before restart/undo and rejects invalid indices', () => {
    const model = new InteractionModel({ size: 5, cells: empty() });
    model.begin(-1);
    model.begin(99);
    expect(model.painting).toBe(false);
    model.begin(0);
    model.commit();
    model.begin(1);
    model.undo();
    expect(model.cells).toEqual(empty());
    model.begin(0);
    model.restart();
    expect(model.history).toHaveLength(0);
    expect(model.cells).toEqual(empty());
  });
});
describe('V4 view math and interpolation', () => {
  it.each([320, 353])('clamps the %spx viewport at fit and maximum zoom', (width) => {
    expect(clampView({ scale: 0.5, x: -100, y: 100 }, width, width)).toEqual({
      scale: 1,
      x: -0,
      y: 0,
    });
    expect(clampView({ scale: 3, x: -999, y: 999 }, width, width)).toEqual({
      scale: 1.8,
      x: -width * 0.8,
      y: 0,
    });
  });
  it('preserves the midpoint anchor, clamps zoom/pan and tolerates zero-distance starts', () => {
    const result = pinchView(
      { scale: 1, x: 0, y: 0 },
      [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ],
      [
        { x: 50, y: 100 },
        { x: 250, y: 100 },
      ],
      353,
      353,
    );
    expect(result.scale).toBe(1.8);
    expect(result.x).toBe(-120);
    expect(result.y).toBe(-80);
    expect(
      pinchView(
        result,
        [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
        [
          { x: 1, y: 1 },
          { x: 1, y: 1 },
        ],
        353,
        353,
      ).scale,
    ).toBe(1);
  });
  it('samples a fast jump through every intervening cell', () => {
    const samples = interpolate({ x: 5, y: 5 }, { x: 95, y: 5 }, 10 / 3);
    expect(new Set(samples.map((point) => Math.floor(point.x / 10)))).toEqual(
      new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    );
    expect(samples.at(-1)).toEqual({ x: 95, y: 5 });
  });
});
function setup(size: 6 | 15 = 6) {
  const root = createInteractionDemo({ size });
  document.body.append(root);
  const frame = root.querySelector<HTMLElement>('.gg-v4-pointer-viewport')!;
  const grid = root.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 600, 600));
  vi.spyOn(grid, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 600, 600));
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn((x: number, y: number) =>
      x >= 0 && x < 600 && y >= 0 && y < 600
        ? grid.children[Math.floor(y / (600 / size)) * size + Math.floor(x / (600 / size))]
        : null,
    ),
  });
  const pointer = (type: string, id: number, x: number, y: number) => {
    const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, cancelable: true });
    Object.defineProperties(event, { pointerId: { value: id }, pointerType: { value: 'touch' } });
    frame.dispatchEvent(event);
  };
  return { root, frame, grid, pointer };
}
describe('V4 DOM gesture coordination', () => {
  it('interpolates one pointer stroke, does not double-paint compatibility clicks, and undoes once', () => {
    const { root, grid, pointer } = setup();
    pointer('pointerdown', 1, 50, 50);
    pointer('pointermove', 1, 450, 50);
    pointer('pointerup', 1, 450, 50);
    expect(grid.children[2]!.classList.contains('nl-grim-glimmer-board__cell--placed')).toBe(true);
    expect(root.textContent).toContain('1 undo entries');
    grid.children[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(grid.children[0]!.classList.contains('nl-grim-glimmer-board__cell--placed')).toBe(true);
    root.querySelector<HTMLButtonElement>('[aria-label="Undo move"]')!.click();
    expect(grid.children[0]!.classList.contains('nl-grim-glimmer-board__cell--empty')).toBe(true);
  });
  it.each(['pointercancel', 'lostpointercapture'])(
    'rolls back on %s without creating history',
    (event) => {
      const { root, grid, pointer } = setup();
      pointer('pointerdown', 1, 50, 50);
      pointer(event, 1, 50, 50);
      expect(grid.children[0]!.classList.contains('nl-grim-glimmer-board__cell--empty')).toBe(true);
      expect(root.textContent).toContain('0 undo entries');
    },
  );
  it('rolls back when a second finger lands and does not paint after one finger lifts', () => {
    const { root, grid, pointer } = setup(15);
    pointer('pointerdown', 1, 20, 20);
    pointer('pointerdown', 2, 300, 300);
    expect(grid.children[0]!.classList.contains('nl-grim-glimmer-board__cell--empty')).toBe(true);
    pointer('pointermove', 2, 500, 500);
    const columns = root.querySelector<HTMLElement>('.nl-grim-glimmer-clued-board__columns')!;
    const rows = root.querySelector<HTMLElement>('.nl-grim-glimmer-clued-board__rows')!;
    expect(columns.style.transform).toContain('scaleX(');
    expect(columns.style.transform).toMatch(/px, 0(?:px)?, 0(?:px)?\)/);
    expect(rows.style.transform).toMatch(/translate3d\(0(?:px)?, /);
    expect(rows.style.transform).toContain('scaleY(');
    pointer('pointerup', 2, 500, 500);
    pointer('pointermove', 1, 100, 20);
    pointer('pointerup', 1, 100, 20);
    expect(root.textContent).toContain('0 undo entries');
  });
  it('supports keyboard clicks, roving arrows, view reset and teardown rollback', () => {
    const { root, grid, pointer } = setup(15);
    grid.children[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(root.textContent).toContain('1 undo entries');
    grid.children[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(grid.children[15]);
    root.querySelectorAll<HTMLButtonElement>('.gg-v4-zoom-tools button')[0]!.click();
    expect(root.textContent).toContain('120% zoom');
    root.querySelectorAll<HTMLButtonElement>('.gg-v4-zoom-tools button')[1]!.click();
    expect(root.textContent).toContain('100% zoom');
    pointer('pointerdown', 1, 100, 20);
    root.remove();
    expect(grid.children[2]!.classList.contains('nl-grim-glimmer-board__cell--empty')).toBe(true);
  });
  it('rolls back on window blur and resets the view on resize', () => {
    const { root, grid, pointer } = setup();
    pointer('pointerdown', 1, 50, 50);
    window.dispatchEvent(new Event('blur'));
    expect(grid.children[0]!.classList.contains('nl-grim-glimmer-board__cell--empty')).toBe(true);
    window.dispatchEvent(new Event('resize'));
    expect(root.textContent).toContain('0 undo entries · 100% zoom');
  });
});
