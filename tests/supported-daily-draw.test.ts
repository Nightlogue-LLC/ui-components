import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createRitualDraw,
  createMonthCard,
  createMonthCollection,
  type MonthManifest,
} from '../src/projects/grim-glimmer/index.js';
const manifest: MonthManifest = {
  monthKey: '2026-11',
  title: 'Supplied month',
  imageUrl: '/real.webp',
  altText: 'Real art',
  focalPoint: { x: 0.5, y: 0.5 },
  seed: 'real',
};
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: false }));
});
afterEach(async () => {
  document.body.replaceChildren();
  await flush();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('production Daily Draw contract', () => {
  it('defaults off with no clock interval or live navigation', () => {
    const onBegin = vi.fn(),
      root = createRitualDraw({ manifest, clock: () => new Date(2026, 10, 10), onBegin });
    document.body.append(root);
    expect(root.hidden).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    root.querySelector('button')!.click();
    expect(onBegin).not.toHaveBeenCalled();
  });
  it('reveals supplied metadata without a puzzle placeholder or a dead Begin action', async () => {
    const onReveal = vi.fn(),
      root = createRitualDraw({
        manifest,
        clock: () => new Date(2026, 10, 10),
        enabled: true,
        reducedMotion: true,
        onReveal,
      });
    document.body.append(root);
    const button = root.querySelector<HTMLButtonElement>('button')!;
    button.click();
    await flush();
    expect(onReveal).toHaveBeenCalledExactlyOnceWith({
      date: '2026-11-10',
      monthKey: '2026-11',
      title: 'Supplied month',
      piece: 10,
      total: 30,
    });
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-label')).toContain('Draw revealed');
  });
  it('blocks a stale date before activation and notifies once', () => {
    let now = new Date(2026, 10, 10);
    const onBegin = vi.fn(),
      onDayChange = vi.fn();
    const root = createRitualDraw({
      manifest,
      clock: () => now,
      enabled: true,
      state: 'in-progress',
      onBegin,
      onDayChange,
    });
    document.body.append(root);
    now = new Date(2026, 10, 11);
    root.querySelector('button')!.click();
    root.querySelector('button')!.click();
    expect(onBegin).not.toHaveBeenCalled();
    expect(onDayChange).toHaveBeenCalledExactlyOnceWith('2026-11-11');
  });
  it('rechecks the local date after an in-flight Begin animation', async () => {
    let now = new Date(2026, 10, 10),
      finish!: () => void;
    const onBegin = vi.fn();
    const root = createRitualDraw({
      manifest,
      clock: () => now,
      enabled: true,
      state: 'in-progress',
      onBegin,
    });
    document.body.append(root);
    const button = root.querySelector<HTMLButtonElement>('button')!;
    button.animate = () =>
      ({
        finished: new Promise<void>((resolve) => {
          finish = resolve;
        }),
        cancel: vi.fn(),
      }) as unknown as Animation;
    button.click();
    now = new Date(2026, 10, 11);
    finish();
    await flush();
    expect(onBegin).not.toHaveBeenCalled();
  });
  it('disposes timers and suppresses detached button callbacks permanently', async () => {
    const onBegin = vi.fn(),
      root = createRitualDraw({
        manifest,
        clock: () => new Date(2026, 10, 10),
        enabled: true,
        state: 'in-progress',
        onBegin,
      });
    document.body.append(root);
    const button = root.querySelector('button')!;
    root.remove();
    root.start?.();
    button.click();
    await flush();
    expect(onBegin).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('rejects stale restoration and wrong-seed archive progress', async () => {
    const onStorage = vi.fn();
    const card = createMonthCard({
      manifest,
      localDate: '2026-11-10',
      clock: () => new Date(2026, 10, 11),
      restoreDate: '2026-11-10',
      onStorage,
    });
    document.body.append(card);
    await card.restore?.();
    expect(onStorage).not.toHaveBeenCalled();
    const archive = createMonthCollection({
      manifests: [manifest],
      progress: [{ version: 1, monthKey: '2026-11', seed: 'wrong', restoredDates: ['2026-11-01'] }],
    });
    expect(archive.textContent).toBe('No pieces restored yet');
  });
});
