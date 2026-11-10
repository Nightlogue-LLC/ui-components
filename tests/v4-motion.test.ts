import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMotionSystem,
  dissolveTiming,
  V4_MOTION,
  pixelPlan,
} from '../stories/projects/grim-glimmer-v4/motion.js';
import {
  createMarkPreview,
  createHintPreview,
  createDissolvePreview,
  createIntegratedMotion,
  createScreenPreview,
} from '../stories/projects/grim-glimmer-v4/motion-fixtures.js';
import { createV4Board } from '../stories/projects/grim-glimmer-v4/board.js';
interface Recorded {
  node: HTMLElement;
  frames: Keyframe[];
  timing: KeyframeAnimationOptions;
  animation: Animation;
  cancel: ReturnType<typeof vi.fn>;
  finish: () => void;
  reject: () => void;
}
const records: Recorded[] = [];
let original: PropertyDescriptor | undefined;
let media: EventTarget & { matches: boolean };
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
beforeEach(() => {
  records.length = 0;
  original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
  media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', () => media);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: function (this: HTMLElement, frames: Keyframe[], timing: KeyframeAnimationOptions) {
      let finish!: () => void;
      let reject!: () => void;
      const finished = new Promise<void>((resolve, fail) => {
        finish = resolve;
        reject = () => fail(new Error('cancelled'));
      });
      const cancel = vi.fn();
      const animation = { finished, cancel } as unknown as Animation;
      records.push({ node: this, frames, timing, animation, cancel, finish, reject });
      return animation;
    },
  });
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (original) Object.defineProperty(HTMLElement.prototype, 'animate', original);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});
function board() {
  const root = createV4Board({
    size: 5,
    interactive: false,
    cells: Array.from({ length: 25 }, () => 'empty'),
    hint: false,
    conflict: false,
  });
  document.body.append(root);
  return root.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
}
describe('V4 motion contracts', () => {
  it('places a star and ring with distinct budgets and restores the actual glyph', async () => {
    const grid = board();
    const cell = grid.children[0] as HTMLElement;
    const motion = createMotionSystem();
    motion.changes(grid, ['empty'], ['placed']);
    expect(records.map((record) => record.timing.duration)).toEqual([200, 280]);
    expect(records[0]!.timing.easing).toBe('cubic-bezier(.34,1.56,.64,1)');
    expect(cell.classList.contains('gg-v4-motion-hidden')).toBe(true);
    records.forEach((record) => record.finish());
    await flush();
    expect(cell.querySelector('.gg-v4-motion-overlay')).toBeNull();
    expect(cell.classList.contains('gg-v4-motion-hidden')).toBe(false);
  });
  it('reveals two fixed X strokes using transform only in 120ms total', () => {
    const grid = board();
    const motion = createMotionSystem();
    motion.changes(grid, ['empty'], ['excluded']);
    expect(records.map((record) => [record.timing.duration, record.timing.delay])).toEqual([
      [60, 0],
      [60, 60],
    ]);
    expect(records.flatMap((record) => record.frames.flatMap(Object.keys))).toEqual([
      'transform',
      'transform',
      'transform',
      'transform',
    ]);
    motion.dispose();
    expect(grid.querySelector('.gg-v4-motion-x-axis')).toBeNull();
  });
  it('fades a snapshot for erase without changing state, fill or focus', async () => {
    const root = createIntegratedMotion({ reducedMotion: false });
    document.body.append(root);
    const cell = root.querySelector<HTMLButtonElement>('[data-index="0"]')!;
    cell.focus();
    cell.click();
    cell.click();
    const erase = records.at(-1)!;
    expect(erase.timing.duration).toBe(100);
    expect(cell.classList.contains('nl-grim-glimmer-board__cell--empty')).toBe(true);
    expect(document.activeElement).toBe(cell);
    erase.finish();
    await flush();
    expect(cell.querySelector('.gg-v4-motion-overlay')).toBeNull();
  });
  it('cancels repeated actions and ignores stale completion from an older placement', async () => {
    const grid = board();
    const motion = createMotionSystem();
    motion.changes(grid, ['empty'], ['placed']);
    const old = [...records];
    motion.changes(grid, ['placed'], ['excluded']);
    old.forEach((record) => {
      expect(record.cancel).toHaveBeenCalled();
      record.finish();
    });
    await flush();
    expect(grid.children[0]!.querySelectorAll('.gg-v4-motion-x-axis')).toHaveLength(2);
    records.slice(2).forEach((record) => record.finish());
    await flush();
    expect(grid.children[0]!.querySelector('.gg-v4-motion-x-axis')).toBeNull();
  });
  it('cleans rejected animations without leaving a hidden glyph', async () => {
    const grid = board();
    const motion = createMotionSystem();
    motion.changes(grid, ['empty'], ['placed']);
    records[0]!.reject();
    await flush();
    expect(grid.children[0]!.classList.contains('gg-v4-motion-hidden')).toBe(false);
    expect(grid.querySelector('.gg-v4-motion-overlay')).toBeNull();
  });
  it.each([5, 6, 8, 15])('caps the %s-wide board dissolve including fade at 1200ms', (size) => {
    const budgets = Array.from({ length: size * size }, (_, index) => dissolveTiming(index, size));
    expect(Math.max(...budgets.map(({ duration, delay }) => duration + delay))).toBeLessThanOrEqual(
      V4_MOTION.dissolveCap,
    );
    expect(budgets[0]!.delay).toBe(budgets.at(-1)!.delay);
    expect(budgets[0]!.delay).toBeGreaterThan(budgets[Math.floor((size * size) / 2)]!.delay);
  });
  it('runs screen push with the preferred 560ms timing and opacity/transform only', () => {
    const node = document.createElement('div');
    const motion = createMotionSystem();
    motion.screen(node);
    expect(records[0]!.timing.duration).toBe(560);
    expect(records[0]!.frames[0]).toEqual({ transform: 'translateX(24px)', opacity: 0 });
    motion.dispose();
  });
  it('commits dissolve once, rejects stale replay completion, and keeps row history undoable', async () => {
    const root = createDissolvePreview({ size: 5 });
    document.body.append(root);
    const replay = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === 'Replay dissolve',
    )!;
    replay.click();
    const first = [...records];
    replay.click();
    first.forEach((record) => record.finish());
    await flush();
    expect(root.textContent).toContain('0 undo entries');
    records.slice(first.length).forEach((record) => record.finish());
    await flush();
    expect(root.textContent).toContain('1 undo entries');
    const undo = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === 'Undo preview',
    )!;
    undo.click();
    expect(root.textContent).toContain('0 undo entries');
  });
  it('uses no animation or stale overlay under explicit or OS reduced motion', () => {
    const grid = board();
    const complete = vi.fn();
    const motion = createMotionSystem({ reducedMotion: true });
    motion.changes(grid, ['empty'], ['placed']);
    motion.dissolve(grid, 5, complete);
    expect(complete).toHaveBeenCalledOnce();
    expect(records).toHaveLength(0);
    media.matches = true;
    createMotionSystem().changes(grid, ['empty'], ['excluded']);
    expect(records).toHaveLength(0);
  });
  it('settles a pending dissolve immediately if reduced motion changes mid-flight', async () => {
    const grid = board();
    const complete = vi.fn();
    const motion = createMotionSystem();
    motion.mount();
    motion.dissolve(grid, 5, complete);
    media.matches = true;
    media.dispatchEvent(new Event('change'));
    expect(complete).toHaveBeenCalledOnce();
    records.forEach((record) => record.finish());
    await flush();
    expect(complete).toHaveBeenCalledOnce();
    motion.dispose();
  });
  it('uses a static hint when reduced and cancels/restarts pulse on background visibility', () => {
    const root = createHintPreview({ reducedMotion: true });
    document.body.append(root);
    expect(records).toHaveLength(0);
    root.remove();
    const live = createHintPreview();
    document.body.append(live);
    expect(records.at(-1)!.timing.iterations).toBe(Infinity);
    expect(records.at(-1)!.timing.duration).toBe(V4_MOTION.hint);
    const pulse = records.at(-1)!;
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(pulse.cancel).toHaveBeenCalled();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(records).toHaveLength(2);
    live.remove();
    expect(records.at(-1)!.cancel).toHaveBeenCalled();
  });
  it('preserves one-entry replay and one haptic session without motion-owned feedback', () => {
    const adapter = { selectionStart: vi.fn(), selectionChanged: vi.fn(), selectionEnd: vi.fn() };
    const root = createMarkPreview({ haptics: true, adapter });
    document.body.append(root);
    root.querySelector('button')!.click();
    root.querySelector('button')!.click();
    expect(root.textContent).toContain('1 undo entries');
    expect(adapter.selectionStart).toHaveBeenCalledTimes(2);
    expect(adapter.selectionChanged).toHaveBeenCalledTimes(2);
    expect(adapter.selectionEnd).toHaveBeenCalledTimes(2);
    root.remove();
    expect(root.querySelector('.gg-v4-motion-overlay')).toBeNull();
  });
  it('only animates transform and opacity across placement, hint, screen and dissolve', () => {
    const grid = board();
    const hint = document.createElement('span');
    const motion = createMotionSystem({ hint });
    motion.mount();
    motion.changes(grid, ['empty'], ['placed']);
    motion.screen(document.createElement('div'));
    motion.dissolve(grid, 5, vi.fn());
    for (const record of records)
      for (const frame of record.frames)
        expect(Object.keys(frame).every((key) => ['transform', 'opacity'].includes(key))).toBe(
          true,
        );
    motion.dispose();
  });
  it('offers slower review without changing the preferred timing constants', () => {
    const root = createScreenPreview({ reviewSpeed: 0.25 });
    document.body.append(root);
    const replay = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === 'Replay screen push',
    )!;
    replay.click();
    expect(records.at(-1)!.timing.duration).toBe(2240);
    const first = records.at(-1)!;
    const normal = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === '1× proposed',
    )!;
    normal.click();
    expect(first.cancel).toHaveBeenCalled();
    expect(normal.getAttribute('aria-pressed')).toBe('true');
    replay.click();
    expect(records.at(-1)!.timing.duration).toBe(560);
    expect(V4_MOTION.screen).toBe(560);
  });
  it('scales dissolve delays and duration together for quarter-speed review', () => {
    const grid = board();
    const motion = createMotionSystem({ reviewSpeed: 0.25, dissolveStyle: 'center' });
    motion.dissolve(grid, 5, vi.fn());
    expect(records[0]!.timing.duration).toBe(1920);
    expect(records[0]!.timing.delay).toBeCloseTo(dissolveTiming(0, 5).delay * 4);
    motion.dispose();
  });
  it.each([5, 6, 8, 15])(
    'uses grid-aligned fine pixels with the same total timing at size %s',
    (size) => {
      const plan = pixelPlan(size, 'pixels', 42);
      expect(plan.length).toBeGreaterThanOrEqual(225);
      expect(plan.length).toBeLessThanOrEqual(324);
      expect(new Set(plan.map((part) => `${part.cell}:${part.row}:${part.column}`)).size).toBe(
        plan.length,
      );
      expect(Math.max(...plan.map((part) => part.delay + part.duration))).toBe(960);
      expect(Math.min(...plan.map((part) => part.delay))).toBe(0);
      expect(plan.every((part) => part.row < part.parts && part.column < part.parts)).toBe(true);
    },
  );
  it('reproduces a seeded pattern, shuffles across cells and offers a whole-cell comparison', () => {
    expect(pixelPlan(6, 'pixels', 42)).toEqual(pixelPlan(6, 'pixels', 42));
    expect(pixelPlan(6, 'pixels', 42)).not.toEqual(pixelPlan(6, 'pixels', 43));
    expect(pixelPlan(6, 'cells', 42)).toHaveLength(36);
    const delays = pixelPlan(6, 'pixels', 42).map((part) => part.delay);
    expect(delays).not.toEqual([...delays].sort((a, b) => a - b));
  });
  it('clips copies into tiles without duplicating cell indices and cleans interruptions', async () => {
    const grid = board();
    const cells = [...grid.children];
    const motion = createMotionSystem();
    motion.dissolve(grid, 5, vi.fn());
    expect(grid.children).toHaveLength(25);
    expect(grid.querySelectorAll('[data-index]')).toHaveLength(25);
    expect(grid.querySelectorAll('.gg-v4-pixel-tile')).toHaveLength(225);
    expect(grid.querySelectorAll('.gg-v4-pixel-tile[aria-hidden="true"]')).toHaveLength(225);
    expect(grid.querySelector('.gg-v4-pixel-copy')?.hasAttribute('tabindex')).toBe(false);
    const old = [...records];
    motion.cancel();
    expect(grid.querySelector('.gg-v4-pixel-source')).toBeNull();
    expect(grid.querySelector('.gg-v4-pixel-tile')).toBeNull();
    motion.dissolve(grid, 5, vi.fn());
    old.forEach((record) => record.finish());
    await flush();
    expect(grid.querySelectorAll('.gg-v4-pixel-tile')).toHaveLength(225);
    expect([...grid.children]).toEqual(cells);
    motion.dispose();
    expect(grid.querySelector('.gg-v4-pixel-copy')).toBeNull();
  });
  it('falls back to final state if Web Animations is unavailable', () => {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
    const grid = board();
    const motion = createMotionSystem();
    const complete = vi.fn();
    motion.changes(grid, ['empty'], ['placed']);
    motion.dissolve(grid, 5, complete);
    expect(grid.querySelector('.gg-v4-motion-overlay')).toBeNull();
    expect(complete).toHaveBeenCalledOnce();
  });
});
