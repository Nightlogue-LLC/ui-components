import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createBoardInteractions,
  createCluedBoard,
  updateCluedBoard,
  type BoardCellState,
} from '../src/projects/grim-glimmer/index.js';

const instances: ReturnType<typeof createBoardInteractions>[] = [];
afterEach(() => {
  instances.splice(0).forEach((instance) => instance.destroy());
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function setup({ zoom = false, activate = false } = {}) {
  const legacy = vi.fn();
  const board = createCluedBoard({
    presentation: 'editorial',
    size: 6,
    mode: 'interactive',
    label: 'Trees and tents',
    cells: Array.from({ length: 36 }, (): BoardCellState => 'empty'),
    rowClues: [0, 1, 2, 3, 2, 1],
    columnClues: [1, 2, 3, 2, 1, 0],
    onCellActivate: legacy,
  });
  const frame = board.querySelector<HTMLElement>('.gg-v4-grid-frame')!;
  const grid = board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  document.body.append(board);
  let width = 600;
  vi.spyOn(frame, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 0, width, width),
  );
  vi.spyOn(grid, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, width, width));
  // Return a cell even out of bounds to exercise viewport clipping before DOM hit testing.
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(
      (x: number, y: number) =>
        grid.children[Math.max(0, Math.min(35, Math.floor(y / 100) * 6 + Math.floor(x / 100)))],
    ),
  });
  const stroke = {
    begin: vi.fn<(index: number) => void>(),
    visit: vi.fn<(index: number) => void>(),
    commit: vi.fn(),
    cancel: vi.fn(),
  };
  const onActivate = vi.fn();
  const onViewChange = vi.fn();
  const api = createBoardInteractions({
    board,
    size: 6,
    stroke,
    zoom,
    ...(activate ? { onActivate } : {}),
    onViewChange,
  });
  instances.push(api);
  api.mount();
  const pointer = (
    type: string,
    id: number,
    x: number,
    y = 50,
    extra: Record<string, unknown> = {},
  ) => {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
    Object.defineProperties(
      event,
      Object.fromEntries(
        Object.entries({ pointerId: id, pointerType: 'touch', ...extra }).map(([key, value]) => [
          key,
          { value },
        ]),
      ),
    );
    frame.dispatchEvent(event);
    return event;
  };
  return {
    board,
    frame,
    grid,
    api,
    stroke,
    pointer,
    legacy,
    onActivate,
    onViewChange,
    resize: (value: number) => {
      width = value;
    },
  };
}
describe('supported board gesture adapter', () => {
  it('interpolates a stroke and delegates one commit without owning cell state or double-clicking', () => {
    const { pointer, stroke, grid, legacy } = setup();
    pointer('pointerdown', 1, 50);
    pointer('pointermove', 1, 550);
    pointer('pointerup', 1, 550);
    expect(stroke.begin).toHaveBeenCalledExactlyOnceWith(0);
    expect(new Set(stroke.visit.mock.calls.map(([index]) => index))).toEqual(
      new Set([0, 1, 2, 3, 4, 5]),
    );
    expect(stroke.commit).toHaveBeenCalledTimes(1);
    expect(stroke.cancel).not.toHaveBeenCalled();
    grid.children[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(stroke.begin).toHaveBeenCalledTimes(1);
    expect(legacy).not.toHaveBeenCalled();
    expect(grid.children[0]!.classList.contains('nl-grim-glimmer-board__cell--empty')).toBe(true);
  });
  it('permits caller-owned keyboard activation and skips disabled fixed cells', () => {
    const { api, grid, board, onActivate, stroke, legacy, pointer } = setup({ activate: true });
    (grid.children[0] as HTMLButtonElement).click();
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(0);
    expect(stroke.begin).not.toHaveBeenCalled();
    expect(legacy).not.toHaveBeenCalled();
    updateCluedBoard(board, {
      cells: Array.from({ length: 36 }, (_, index) => (index === 0 ? 'fixed' : 'empty')),
    });
    (grid.children[0] as HTMLButtonElement).click();
    pointer('pointerdown', 1, 50);
    pointer('pointermove', 1, 150);
    pointer('pointerup', 1, 150);
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(stroke.begin).not.toHaveBeenCalled();
    api.setEnabled(false);
    (grid.children[1] as HTMLButtonElement).click();
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
  it('defaults keyboard activation to one transaction and keeps one roving focus target', () => {
    const { api, grid, stroke } = setup({ zoom: true });
    (grid.children[0] as HTMLButtonElement).click();
    expect(stroke.begin).toHaveBeenCalledExactlyOnceWith(0);
    expect(stroke.commit).toHaveBeenCalledTimes(1);
    api.setView({ scale: 1.8, x: 0, y: 0 });
    grid.children[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'End', cancelable: true }),
    );
    expect(document.activeElement).toBe(grid.children[5]);
    expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(api.getView().x).toBe(-480);
  });
  it.each([
    'pointercancel',
    'lostpointercapture',
    'blur',
    'hidden',
    'disable',
    'unmount',
    'destroy',
    'resize',
  ])('rolls back unfinished work on %s, once, without a commit', (kind) => {
    const { pointer, stroke, api } = setup();
    pointer('pointerdown', 1, 50);
    if (kind === 'blur' || kind === 'resize') window.dispatchEvent(new Event(kind));
    else if (kind === 'hidden') {
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      document.dispatchEvent(new Event('visibilitychange'));
    } else if (kind === 'disable') api.setEnabled(false);
    else if (kind === 'unmount') api.unmount();
    else if (kind === 'destroy') api.destroy();
    else pointer(kind, 1, 50);
    pointer('pointerup', 1, 150);
    api.cancel();
    expect(stroke.cancel).toHaveBeenCalledTimes(1);
    expect(stroke.commit).not.toHaveBeenCalled();
  });
  it('cancels on removal and allows an explicit remount without duplicate listeners', async () => {
    const { pointer, board, api, stroke } = setup();
    pointer('pointerdown', 1, 50);
    board.remove();
    await Promise.resolve();
    expect(stroke.cancel).toHaveBeenCalledTimes(1);
    document.body.append(board);
    api.mount();
    api.mount();
    pointer('pointerdown', 1, 50);
    pointer('pointerup', 1, 50);
    expect(stroke.begin).toHaveBeenCalledTimes(2);
    expect(stroke.commit).toHaveBeenCalledTimes(1);
  });
  it('rolls back before pinch, clamps/pins clue axes, suspends at three pointers and waits for all fingers', () => {
    const { pointer, stroke, api, board } = setup({ zoom: true });
    pointer('pointerdown', 1, 100, 100);
    pointer('pointerdown', 2, 300, 100);
    expect(stroke.cancel).toHaveBeenCalledTimes(1);
    pointer('pointermove', 2, 500, 100);
    expect(api.getView()).toEqual({ scale: 1.8, x: -60, y: -80 });
    const columns = board.querySelector<HTMLElement>('.nl-grim-glimmer-clued-board__columns')!;
    const rows = board.querySelector<HTMLElement>('.nl-grim-glimmer-clued-board__rows')!;
    expect(columns.style.transform).toContain('scaleX(1.8)');
    expect(rows.style.transform).toContain('scaleY(1.8)');
    expect(columns.style.transform).toMatch(/translate3d\(-60px, 0(?:px)?, 0(?:px)?\)/);
    expect(rows.style.transform).toMatch(/translate3d\(0(?:px)?, -80px, 0(?:px)?\)/);
    pointer('pointerdown', 3, 400, 400);
    pointer('pointermove', 2, 550, 100);
    expect(api.getView().x).toBe(-60);
    pointer('pointerup', 3, 400, 400);
    pointer('pointermove', 2, 550, 100);
    expect(api.getView().x).toBe(-60);
    pointer('pointerup', 2, 550, 100);
    pointer('pointermove', 1, 200, 100);
    pointer('pointerup', 1, 200, 100);
    expect(stroke.begin).toHaveBeenCalledTimes(1);
    expect(stroke.commit).not.toHaveBeenCalled();
  });
  it('keeps zoom opt-in and rejects nonfinite view input', () => {
    const { api, pointer, stroke } = setup();
    pointer('pointerdown', 1, 100);
    pointer('pointerdown', 2, 300);
    pointer('pointermove', 2, 500);
    api.setView({ scale: 1.8, x: -300, y: -300 });
    expect(api.getView()).toEqual({ scale: 1, x: 0, y: 0 });
    expect(stroke.cancel).toHaveBeenCalledTimes(1);
    expect(() => api.setView({ scale: NaN, x: 0, y: 0 })).toThrow('finite');
  });
  it('clips outside points before hit testing and samples coalesced paths through intervening cells', () => {
    const { pointer, stroke } = setup();
    pointer('pointerdown', 1, 650);
    pointer('pointerup', 1, 650);
    expect(stroke.begin).not.toHaveBeenCalled();
    pointer('pointerdown', 1, 50);
    pointer('pointermove', 1, 50, 150, {
      getCoalescedEvents: () => [{ clientX: 550, clientY: 50 }],
    });
    pointer('pointerup', 1, 50, 150);
    expect(stroke.visit).toHaveBeenCalledWith(5);
    expect(stroke.visit).toHaveBeenCalledWith(6);
  });
  it('cancels on container resize and disconnects its observers at teardown', () => {
    let resizeCallback: () => void = () => undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resizeCallback = callback;
        }
        observe() {
          return undefined;
        }
        disconnect = disconnect;
      },
    );
    const { pointer, stroke, api, resize } = setup({ zoom: true });
    api.setView({ scale: 1.8, x: -100, y: -100 });
    pointer('pointerdown', 1, 50);
    resize(500);
    resizeCallback();
    expect(stroke.cancel).toHaveBeenCalledTimes(1);
    expect(api.getView().scale).toBe(1);
    api.destroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
  it('restores markup/focus defaults and legacy activation on terminal destroy', () => {
    const { api, board, grid, legacy, pointer, stroke } = setup();
    expect(() => createBoardInteractions({ board, size: 6, stroke })).toThrow('already');
    api.destroy();
    api.destroy();
    api.mount();
    expect(board.querySelector('.nl-grim-glimmer-zoom-content')).toBeNull();
    expect(board.querySelector('.nl-grim-glimmer-column-window')).toBeNull();
    expect(grid.children[0]!.getAttribute('tabindex')).toBeNull();
    (grid.children[0] as HTMLButtonElement).click();
    expect(legacy).toHaveBeenCalledExactlyOnceWith(0);
    pointer('pointerdown', 1, 50);
    expect(stroke.begin).not.toHaveBeenCalled();
  });
  it('validates board mode and size before changing markup', () => {
    const { board, stroke, api } = setup();
    api.destroy();
    const markup = board.innerHTML;
    expect(() => createBoardInteractions({ board, size: 5, stroke })).toThrow('matching');
    expect(board.innerHTML).toBe(markup);
    expect(() =>
      createBoardInteractions({ board: document.createElement('div'), size: 6, stroke }),
    ).toThrow('editorial');
  });
});
