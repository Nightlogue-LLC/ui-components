import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canonicalDate,
  getDailySeed,
  dailyPlaceholder,
  moonPhase,
  DAILY_DRAW_ENABLED,
  homeBudget,
  HOME_TIMING,
} from '../stories/projects/grim-glimmer-v4/home-model.js';
import {
  createHome,
  createFaceDownPreview,
  createEntrancePreview,
} from '../stories/projects/grim-glimmer-v4/home.js';
import {
  createHeroCard,
  createFaceDownCard,
  createStatusLine,
  createDailyDraw,
} from '../stories/projects/grim-glimmer-v4/home-parts.js';
import { createCardCarousel } from '../stories/projects/grim-glimmer-v4/home-carousel.js';
import { createHomeMotion } from '../stories/projects/grim-glimmer-v4/home-motion.js';
import {
  createPuzzleHeader,
  createConstellationPath,
  createLoading,
  createEmpty,
} from '../stories/projects/grim-glimmer-v4/home-support.js';
let media: EventTarget & { matches: boolean };
const records: {
  node: HTMLElement;
  frames: Keyframe[];
  timing: KeyframeAnimationOptions;
  cancel: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  finish: () => void;
}[] = [];
let original: PropertyDescriptor | undefined;
beforeEach(() => {
  vi.useFakeTimers();
  records.length = 0;
  media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', () => media);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: function (this: HTMLElement, frames: Keyframe[], timing: KeyframeAnimationOptions) {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const record = {
        node: this,
        frames,
        timing,
        cancel: vi.fn(),
        pause: vi.fn(),
        play: vi.fn(),
        finish,
      };
      records.push(record);
      return { ...record, finished } as unknown as Animation;
    },
  });
});
afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (original) Object.defineProperty(HTMLElement.prototype, 'animate', original);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
function button(root: HTMLElement, text: string) {
  return [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (node) => node.textContent === text,
  )!;
}
function geometry(carousel: ReturnType<typeof createCardCarousel>) {
  Object.defineProperty(carousel.list, 'clientWidth', { configurable: true, value: 393 });
  [...carousel.list.children].forEach((node, i) => {
    Object.defineProperty(node, 'offsetLeft', { configurable: true, value: 65.25 + i * 290.5 });
    Object.defineProperty(node, 'offsetWidth', { configurable: true, value: 262.5 });
  });
}
describe('Daily Draw boundary', () => {
  it('is off by default, deterministic per canonical date, and returns no puzzle', () => {
    expect(DAILY_DRAW_ENABLED).toBe(false);
    expect(getDailySeed('2026-11-10')).toBe(getDailySeed('2026-11-10'));
    expect(getDailySeed('2026-11-11')).not.toBe(getDailySeed('2026-11-10'));
    expect(dailyPlaceholder('2026-11-10')).toEqual({
      date: '2026-11-10',
      seed: getDailySeed('2026-11-10'),
      puzzle: null,
      status: 'placeholder',
    });
    const root = createHome({ launch: 'return' });
    expect(root.querySelector('.gg-v4-daily')?.hasAttribute('hidden')).toBe(true);
  });
  it.each(['2026-2-02', '2026-02-30', '2025-02-29', '2026-11-10T00:00:00Z', 'not-a-date'])(
    'rejects noncanonical or invalid %s',
    (date) => {
      expect(() => canonicalDate(date)).toThrow();
    },
  );
  it('accepts leap days and provides eight decorative phases without changing the selected date', () => {
    expect(canonicalDate('2024-02-29').toISOString()).toBe('2024-02-29T00:00:00.000Z');
    const phases = new Set(
      Array.from({ length: 30 }, (_, i) => moonPhase(`2026-11-${String(i + 1).padStart(2, '0')}`)),
    );
    expect(phases.size).toBe(8);
  });
  it.each(['unplayed', 'in-progress', 'solved'] as const)(
    'routes only a %s placeholder through the injected callback',
    (state) => {
      const onOpen = vi.fn(),
        storage = vi.spyOn(Storage.prototype, 'setItem');
      const root = createDailyDraw({ date: '2026-11-10', state, onOpen });
      root.click();
      expect(onOpen).toHaveBeenCalledExactlyOnceWith(dailyPlaceholder('2026-11-10'));
      expect(storage).not.toHaveBeenCalled();
      if (state === 'solved') expect(root.textContent).toContain('Drawn');
    },
  );
});
describe('Tarot structure and full Home', () => {
  it('keeps resume and New puzzle as separate native targets using shared Card/Button', () => {
    const onResume = vi.fn(),
      onNewPuzzle = vi.fn(),
      onPlay = vi.fn();
    const root = createHeroCard({ inProgress: true, onResume, onNewPuzzle, onPlay });
    expect(root.querySelector('button button')).toBeNull();
    expect(root.querySelector('button a')).toBeNull();
    root.querySelector<HTMLButtonElement>('.gg-v4-tarot-hit')!.click();
    button(root, 'New puzzle').click();
    expect(onResume).toHaveBeenCalledOnce();
    expect(onNewPuzzle).toHaveBeenCalledOnce();
    expect(onPlay).not.toHaveBeenCalled();
    expect(root.querySelector('.gg-v4-tarot-board')?.children).toHaveLength(25);
  });
  it('announces playable versus locked cards and restricts face-down visible copy', () => {
    expect(createHeroCard().querySelector('button')?.getAttribute('aria-label')).toBe(
      'Play Stars & Spires',
    );
    const card = createFaceDownCard('III');
    expect(card.textContent).toBe('IIIUnrevealed');
    expect(card.getAttribute('aria-disabled')).toBe('true');
    expect(card.getAttribute('aria-label')).toContain('locked');
  });
  it('hides zero/invalid status and supports solved-only copy', () => {
    expect(createStatusLine(0, 5).hidden).toBe(true);
    expect(createStatusLine(Infinity, 5).hidden).toBe(true);
    expect(createStatusLine(14).textContent).toBe('14 solved');
  });
  it('keeps original wordmark URLs/crop, 5 ambient stars, explicit daily opt-in and mock navigation', () => {
    const onNavigate = vi.fn();
    const root = createHome({
      dailyEnabled: true,
      solved: 14,
      streak: 3,
      launch: 'return',
      onNavigate,
    });
    document.body.append(root);
    expect(root.querySelectorAll('.gg-v4-home-logo image')).toHaveLength(2);
    expect(root.querySelector('.gg-v4-home-logo svg')?.getAttribute('viewBox')).toBe(
      '237 949 1533 247',
    );
    expect(root.querySelectorAll('.gg-v4-ambient-star')).toHaveLength(5);
    expect(root.querySelector('.gg-v4-daily')?.hasAttribute('hidden')).toBe(false);
    root.querySelector<HTMLButtonElement>('[aria-label="Settings"]')!.click();
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('settings');
    expect(root.textContent).not.toContain('Choose a puzzle');
  });
  it.each([
    [393, 852, 420, 262.5],
    [360, 780, 405, 253.125],
  ])(
    'reports arithmetic layout budget at %s×%s, not a claimed browser fit',
    (width, height, cardHeight, cardWidth) => {
      expect(homeBudget(width, height)).toMatchObject({ cardHeight, cardWidth, logo: 96 });
      expect(homeBudget(width, height).sidePeek).toBeGreaterThan(30);
      expect(homeBudget(width, height, { daily: false, status: false }).cardHeight).toBe(420);
    },
  );
});
describe('Native snap carousel contract', () => {
  it('keeps three accessible logical items with two inert edge clones and a settled live status', () => {
    const carousel = createCardCarousel({ reducedMotion: true });
    geometry(carousel);
    document.body.append(carousel.element);
    carousel.mount();
    expect(carousel.list.children).toHaveLength(5);
    expect(carousel.list.querySelectorAll('[data-clone][aria-hidden="true"]')).toHaveLength(2);
    carousel.list.querySelectorAll<HTMLElement>('[data-clone]').forEach((clone) => {
      expect(clone.inert).toBe(true);
      clone.querySelectorAll('button').forEach((button) => expect(button.tabIndex).toBe(-1));
    });
    expect(carousel.list.scrollLeft).toBe(290.5);
    expect(carousel.selected()).toBe(0);
    carousel.dispose();
  });
  it('emits one tick per new settled logical card, not each scroll event, and rebases clone edges', () => {
    const tick = vi.fn(),
      onCard = vi.fn();
    const carousel = createCardCarousel({ haptics: true, reducedMotion: true, tick, onCard });
    geometry(carousel);
    document.body.append(carousel.element);
    carousel.mount();
    carousel.list.scrollLeft = 581;
    carousel.list.dispatchEvent(new Event('scroll'));
    carousel.list.dispatchEvent(new Event('scroll'));
    expect(tick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(140);
    expect(tick).toHaveBeenCalledOnce();
    carousel.list.dispatchEvent(new Event('scrollend'));
    expect(tick).toHaveBeenCalledOnce();
    expect(onCard).toHaveBeenCalledExactlyOnceWith(1);
    carousel.list.scrollLeft = 1162;
    carousel.settle();
    expect(carousel.selected()).toBe(0);
    expect(carousel.list.scrollLeft).toBe(290.5);
    expect(tick).toHaveBeenCalledTimes(2);
    carousel.dispose();
  });
  it('supports arrow/Home/End on native card buttons, updates pressed indicators and gates haptics', () => {
    const tick = vi.fn();
    const carousel = createCardCarousel({ haptics: false, reducedMotion: true, tick });
    geometry(carousel);
    document.body.append(carousel.element);
    carousel.mount();
    const hit = carousel.cards[0]!.querySelector<HTMLButtonElement>('button')!;
    hit.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    expect(carousel.selected()).toBe(2);
    expect(document.activeElement).toBe(carousel.cards[2]);
    expect(carousel.element.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
    carousel.cards[2]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    expect(carousel.selected()).toBe(0);
    expect(tick).not.toHaveBeenCalled();
    carousel.dispose();
  });
  it('clears queued settles and listeners when disposed', () => {
    const onCard = vi.fn();
    const carousel = createCardCarousel({ onCard });
    geometry(carousel);
    document.body.append(carousel.element);
    carousel.mount();
    carousel.list.scrollLeft = 581;
    carousel.list.dispatchEvent(new Event('scroll'));
    carousel.dispose();
    vi.advanceTimersByTime(500);
    expect(onCard).not.toHaveBeenCalled();
  });
});
describe('Home motion budgets and cleanup', () => {
  it('runs 600ms content and a one-time 1600ms full embellishment, using transform/opacity only', () => {
    const root = createHome({ dailyEnabled: true });
    document.body.append(root);
    const finite = records.filter((r) => r.timing.iterations !== Infinity),
      loops = records.filter((r) => r.timing.iterations === Infinity);
    expect(finite).toHaveLength(7);
    expect(loops).toHaveLength(5);
    const cards = finite.filter((r) => r.node.classList.contains('gg-v4-tarot'));
    expect(cards.map((r) => r.timing.delay)).toEqual([250, 320, 390]);
    expect(HOME_TIMING.cardDelay + 2 * HOME_TIMING.cardStagger + HOME_TIMING.cardDuration).toBe(
      600,
    );
    const sheen = finite.find((r) => r.node.classList.contains('gg-v4-tarot-sheen'))!;
    expect(Number(sheen.timing.delay) + Number(sheen.timing.duration)).toBe(1600);
    for (const r of records)
      for (const frame of r.frames)
        expect(
          Object.keys(frame).every((key) => ['opacity', 'transform', 'offset'].includes(key)),
        ).toBe(true);
  });
  it('does not replay cold entrance on return and collapses reduced motion to one 150ms fade', () => {
    const root = createHome({ launch: 'return' });
    document.body.append(root);
    expect(records.filter((r) => r.timing.iterations !== Infinity)).toHaveLength(0);
    root.remove();
    records.length = 0;
    document.body.append(createHome({ reducedMotion: true, dailyEnabled: true }));
    expect(records).toHaveLength(1);
    expect(records[0]!.timing.duration).toBe(150);
    expect(records[0]!.frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });
  it('pauses ambient work in the background and removes all jobs/listeners on teardown', () => {
    const root = createHome();
    document.body.append(root);
    const loops = records.filter((r) => r.timing.iterations === Infinity),
      finite = records.filter((r) => r.timing.iterations !== Infinity);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(loops.every((r) => r.pause.mock.calls.length === 1)).toBe(true);
    expect(finite.every((r) => r.cancel.mock.calls.length === 1)).toBe(true);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(loops.every((r) => r.play.mock.calls.length === 1)).toBe(true);
    root.remove();
    expect(loops.every((r) => r.cancel.mock.calls.length === 1)).toBe(true);
    records.length = 0;
    media.dispatchEvent(new Event('change'));
    expect(records).toHaveLength(0);
  });
  it('cancels ambient and finite jobs when the OS switches to reduced motion', () => {
    const root = createHome();
    document.body.append(root);
    media.matches = true;
    media.dispatchEvent(new Event('change'));
    expect(records.every((r) => r.cancel.mock.calls.length === 1)).toBe(true);
  });
  it('gives locked feedback without routing, removes shake for reduced motion, and keeps haptics gated', () => {
    const tick = vi.fn(),
      onLocked = vi.fn();
    const root = createFaceDownPreview({ haptics: true, tick, onLocked });
    document.body.append(root);
    root.querySelector<HTMLButtonElement>('button')!.click();
    expect(tick).toHaveBeenCalledOnce();
    expect(onLocked).toHaveBeenCalledOnce();
    expect(records.at(-1)!.timing.duration).toBe(200);
    root.remove();
    records.length = 0;
    const reduced = createFaceDownPreview({ haptics: false, tick, onLocked, reducedMotion: true });
    document.body.append(reduced);
    reduced.querySelector<HTMLButtonElement>('button')!.click();
    expect(tick).toHaveBeenCalledOnce();
    expect(records).toHaveLength(0);
  });
  it('replays by replacing the isolated Home, cleaning prior work rather than stacking it', () => {
    const root = createEntrancePreview();
    document.body.append(root);
    const old = root.querySelector('.gg-v4-home');
    button(root, 'Replay entrance').click();
    expect(root.querySelectorAll('.gg-v4-home')).toHaveLength(1);
    expect(root.querySelector('.gg-v4-home')).not.toBe(old);
    expect(records.slice(0, 11).every((r) => r.cancel.mock.calls.length === 1)).toBe(true);
  });
  it('disposes completed finite animation handles and ignores replay after unmount', async () => {
    const root = createHome();
    document.body.append(root);
    records.filter((r) => r.timing.iterations !== Infinity).forEach((r) => r.finish());
    await flush();
    expect(
      records
        .filter((r) => r.timing.iterations !== Infinity)
        .every((r) => r.cancel.mock.calls.length === 1),
    ).toBe(true);
    const detached = createHomeMotion(document.createElement('div'));
    detached.dispose();
    const count = records.length;
    detached.replay();
    expect(records).toHaveLength(count);
  });
});
describe('Header, progress and pending states', () => {
  it('shows clamped placement progress without a level number, Hint, gear or bottom nav', () => {
    const root = createPuzzleHeader({ placed: 8, total: 5 });
    expect(root.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('5');
    expect(root.textContent).toContain('Easy · 5×5');
    expect(root.textContent).not.toContain('No.');
    expect(root.querySelector('[aria-label="Settings"]')).toBeNull();
    expect(root.querySelector('nav')).toBeNull();
  });
  it('keeps mock progression/empty/loading separate from gameplay and uses shared current action', () => {
    const onCurrent = vi.fn(),
      path = createConstellationPath({ onCurrent, reducedMotion: true });
    document.body.append(path);
    button(path, 'Continue').click();
    expect(onCurrent).toHaveBeenCalledOnce();
    expect(path.querySelectorAll('[data-state="locked"] button')).toHaveLength(0);
    expect(createEmpty().textContent).toContain('No constellations charted yet.');
    const loading = createLoading({ reducedMotion: true });
    document.body.append(loading);
    expect(loading.getAttribute('aria-busy')).toBe('true');
    expect(loading.querySelectorAll('.gg-v4-loading-board > span')).toHaveLength(26);
    expect(loading.querySelector('nav')).toBeNull();
    expect(records).toHaveLength(0);
  });
});

it('bounds repeated locked-card shake to one active animation per card', () => {
  const root = createFaceDownPreview();
  document.body.append(root);
  const button = root.querySelector<HTMLButtonElement>('button')!;
  for (let i = 0; i < 5; i++) button.click();
  expect(records).toHaveLength(5);
  expect(records.slice(0, 4).every((record) => record.cancel.mock.calls.length === 1)).toBe(true);
  expect(records[4]!.cancel).not.toHaveBeenCalled();
  root.remove();
  expect(records[4]!.cancel).toHaveBeenCalledOnce();
});
