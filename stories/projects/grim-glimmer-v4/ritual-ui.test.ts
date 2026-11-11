import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { createRitualDraw } from './ritual-draw.js';
import { createMonthCard } from './month-card.js';
import { createMonthArt } from './month-art.js';
import { createMonthCollection } from './month-collection.js';
import { MONTHS, monthDates } from './month-model.js';
import { installDialogPolyfill } from '../../../tests/helpers/dialog-polyfill.js';
const manifest = MONTHS[1]!,
  dates = monthDates(manifest.monthKey);
let media: EventTarget & { matches: boolean }, restoreDialog: () => void;
const records: {
  node: Element;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
  cancel: ReturnType<typeof vi.fn>;
}[] = [];
let original: PropertyDescriptor | undefined;
beforeEach(() => {
  vi.useFakeTimers();
  records.length = 0;
  media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', () => media);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  restoreDialog = installDialogPolyfill();
  original = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: function (this: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
      let resolve!: () => void, reject!: (reason?: unknown) => void;
      const finished = new Promise<void>((ok, fail) => {
        resolve = ok;
        reject = fail;
      });
      const timer =
        options.iterations === Infinity
          ? undefined
          : setTimeout(resolve, Number(options.duration ?? 0) + Number(options.delay ?? 0));
      const cancel = vi.fn(() => {
        clearTimeout(timer);
        reject(Error('cancelled'));
      });
      records.push({ node: this, frames, options, cancel });
      return { finished, cancel, pause: vi.fn(), play: vi.fn() } as unknown as Animation;
    },
  });
});
afterEach(async () => {
  document.body.replaceChildren();
  await Promise.resolve();
  restoreDialog();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (original) Object.defineProperty(Element.prototype, 'animate', original);
  else Reflect.deleteProperty(Element.prototype, 'animate');
});
const advance = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
};
function draw(options: Parameters<typeof createRitualDraw>[0] = {}) {
  const root = createRitualDraw({ enabled: true, now: '2026-11-10T16:18:00', ...options });
  document.body.append(root);
  return { root, button: root.querySelector<HTMLButtonElement>('button')! };
}
function month(options: Partial<Parameters<typeof createMonthCard>[0]> = {}) {
  const root = createMonthCard({
    manifest,
    localDate: '2026-11-13',
    restoredDates: dates.slice(0, 12),
    restoreDate: dates[12],
    ...options,
  });
  document.body.append(root);
  return {
    root,
    replay: [...root.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === 'Replay restoration',
    )!,
  };
}
describe('ritual reveal, deal and lifecycle', () => {
  it('is one native button with a state-aware label, no printed ISO date, and an off-by-default flag', () => {
    const { root, button } = draw();
    expect(root.querySelectorAll('button')).toHaveLength(1);
    expect(button.getAttribute('aria-label')).toContain('Tap to draw');
    expect(root.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(root.textContent).toContain('Piece 10 of 30');
    const off = createRitualDraw({ now: '2026-11-10T16:18:00' });
    expect(off.hidden).toBe(true);
  });
  it('floats the unflipped card vertically over six seconds and stops on activation', async () => {
    const { root, button } = draw();
    const floating = records.find((record) =>
      record.node.classList.contains('gg-v4-ritual-float'),
    )!;
    expect(floating.options.duration).toBe(6000);
    expect(floating.options.iterations).toBe(Infinity);
    expect(floating.frames[1]!.transform).toBe('translateY(-4px)');
    button.click();
    expect(floating.cancel).toHaveBeenCalledOnce();
    await advance(500);
    expect(root.dataset.state).toBe('revealed-unstarted');
    expect(
      records.filter((record) => record.node.classList.contains('gg-v4-ritual-float')),
    ).toHaveLength(1);
  });
  it('flips for 500ms, settles once, then deals for 350ms through adapters only', async () => {
    const light = vi.fn(),
      medium = vi.fn(),
      flipSound = vi.fn(),
      onReveal = vi.fn(),
      onBegin = vi.fn();
    const { root, button } = draw({
      haptics: true,
      sound: true,
      light,
      medium,
      flipSound,
      onReveal,
      onBegin,
    });
    button.click();
    button.click();
    expect(light).toHaveBeenCalledOnce();
    expect(flipSound).toHaveBeenCalledOnce();
    expect(
      records.find((record) => record.frames[0]?.transform === 'rotateY(0deg)')?.options.duration,
    ).toBe(500);
    await advance(499);
    expect(onReveal).not.toHaveBeenCalled();
    await advance(1);
    expect(onReveal).toHaveBeenCalledOnce();
    expect(medium).toHaveBeenCalledOnce();
    expect(root.dataset.state).toBe('revealed-unstarted');
    button.click();
    await advance(349);
    expect(onBegin).not.toHaveBeenCalled();
    await advance(1);
    expect(onBegin).toHaveBeenCalledOnce();
    expect(onBegin.mock.calls[0]?.[0]).toMatchObject({ piece: 10, total: 30, puzzle: null });
  });
  it('gates sound/haptics, uses only 150ms opacity jobs under reduced motion, and skips loops', async () => {
    const light = vi.fn(),
      medium = vi.fn(),
      flipSound = vi.fn();
    const { button } = draw({
      reducedMotion: true,
      haptics: false,
      sound: false,
      light,
      medium,
      flipSound,
    });
    button.click();
    await advance(150);
    button.click();
    await advance(150);
    expect(light).not.toHaveBeenCalled();
    expect(medium).not.toHaveBeenCalled();
    expect(flipSound).not.toHaveBeenCalled();
    expect(
      records.every(
        (record) =>
          record.options.duration === 150 &&
          record.frames.every((frame) => Object.keys(frame).every((key) => key === 'opacity')),
      ),
    ).toBe(true);
  });
  it.each(['remove', 'background', 'reduce'] as const)(
    'does not settle a pending reveal after %s',
    async (action) => {
      const onReveal = vi.fn(),
        medium = vi.fn();
      const { root, button } = draw({ onReveal, medium, haptics: true });
      button.click();
      if (action === 'remove') root.remove();
      if (action === 'background') {
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
        document.dispatchEvent(new Event('visibilitychange'));
      }
      if (action === 'reduce') {
        media.matches = true;
        media.dispatchEvent(new Event('change'));
      }
      await advance(1000);
      expect(onReveal).not.toHaveBeenCalled();
      expect(medium).not.toHaveBeenCalled();
      if (action !== 'remove') expect(root.dataset.state).toBe('unplayed');
    },
  );
  it('counts down only at minute changes, hides lone streaks, and blocks stale draws at local midnight', async () => {
    let now = new Date(2026, 10, 10, 16, 18);
    const onDayChange = vi.fn(),
      onBegin = vi.fn();
    const { root, button } = draw({
      clock: () => now,
      state: 'solved',
      streak: 1,
      onDayChange,
      onBegin,
    });
    const live = root.querySelector('[role="status"]')!;
    expect(root.textContent).toContain('NEXT DRAW IN 7H 42M');
    expect(root.querySelector<HTMLElement>('.gg-v4-ritual-streak')!.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('.gg-v4-ritual-chevron')!.hidden).toBe(true);
    await advance(60000);
    expect(live.textContent).toBe('');
    now = new Date(2026, 10, 10, 16, 19);
    await advance(60000);
    expect(live.textContent).toBe('Next draw in 7 hours 41 minutes.');
    now = new Date(2026, 10, 11, 0, 0);
    await advance(60000);
    expect(onDayChange).toHaveBeenCalledExactlyOnceWith('2026-11-11');
    button.click();
    expect(onBegin).not.toHaveBeenCalled();
  });
});
describe('monthly art, restoration and a11y', () => {
  it('uses one image, one mask, and persistent lead paths across both layers', () => {
    const art = createMonthArt(manifest, dates.slice(0, 12), dates[12]);
    expect(art.element.querySelectorAll('image')).toHaveLength(1);
    expect(art.element.querySelectorAll('mask')).toHaveLength(1);
    expect(art.element.querySelectorAll('use')).toHaveLength(2);
    expect(art.maskPaths.filter((path) => path.style.opacity === '1')).toHaveLength(12);
    expect(art.leadPaths).toHaveLength(30);
    art.update(dates);
    expect(art.element.getAttribute('aria-label')).toBe(manifest.altText);
    const other = createMonthArt(manifest);
    expect(other.element.querySelector('image')!.id).not.toBe(
      art.element.querySelector('image')!.id,
    );
  });
  it('restores transactionally over 700ms with one progress announcement and one adapter write', async () => {
    const light = vi.fn(),
      medium = vi.fn(),
      onStorage = vi.fn();
    const { root, replay } = month({ light, medium, onStorage, haptics: true });
    replay.click();
    expect(light).toHaveBeenCalledOnce();
    await advance(699);
    expect(onStorage).not.toHaveBeenCalled();
    expect(root.querySelector('.gg-v4-month-count')!.textContent).toBe('12 of 30 pieces restored');
    await advance(1);
    expect(medium).toHaveBeenCalledOnce();
    expect(onStorage).toHaveBeenCalledOnce();
    expect(root.querySelector('[role="status"]')!.textContent).toBe(
      'Piece 13 restored. 13 of 30 pieces restored.',
    );
    expect(root.querySelector('.gg-v4-month-count')!.textContent).toBe('13 of 30 pieces restored');
  });
  it('rolls back interrupted restoration and gives no stale completion or persistence callback', async () => {
    const onStorage = vi.fn(),
      medium = vi.fn();
    const { root, replay } = month({ onStorage, medium, haptics: true });
    replay.click();
    media.matches = true;
    media.dispatchEvent(new Event('change'));
    await advance(1000);
    expect(onStorage).not.toHaveBeenCalled();
    expect(medium).not.toHaveBeenCalled();
    expect(root.querySelector('.gg-v4-month-count')!.textContent).toBe('12 of 30 pieces restored');
    expect(root.querySelectorAll('mask path[style="opacity: 1;"]')).toHaveLength(12);
    expect(replay.disabled).toBe(false);
  });
  it('crossfades the final piece in 150ms and opens the reusable completion sheet with Save/Share stubs', async () => {
    const success = vi.fn(),
      onSave = vi.fn(),
      onShare = vi.fn();
    const { root, replay } = month({
      localDate: '2026-11-30',
      restoredDates: dates.slice(0, 29),
      restoreDate: dates[29],
      reducedMotion: true,
      haptics: true,
      success,
      onSave,
      onShare,
    });
    replay.click();
    await advance(150);
    expect(success).toHaveBeenCalledOnce();
    expect(root.querySelector('dialog[open]')).not.toBeNull();
    const actions = [...root.querySelectorAll<HTMLButtonElement>('dialog button')];
    actions.find((node) => node.textContent === 'Save')!.click();
    actions.find((node) => node.textContent === 'Share')!.click();
    expect(onSave).toHaveBeenCalledOnce();
    expect(onShare).toHaveBeenCalledOnce();
    expect(
      records.every(
        (record) =>
          record.options.duration === 150 &&
          record.frames.every((frame) => Object.keys(frame).every((key) => key === 'opacity')),
      ),
    ).toBe(true);
  });
  it('does not open the completion sheet after an interrupted 900ms pulse', async () => {
    const success = vi.fn();
    const { root, replay } = month({
      localDate: '2026-11-30',
      restoredDates: dates.slice(0, 29),
      restoreDate: dates[29],
      haptics: true,
      success,
    });
    replay.click();
    await advance(700);
    media.matches = true;
    media.dispatchEvent(new Event('change'));
    await advance(2000);
    expect(success).not.toHaveBeenCalled();
    expect(root.querySelector('dialog')).toBeNull();
  });
  it('finishes the last piece with a 900ms pulse and 350ms sheen before the sheet', async () => {
    const success = vi.fn();
    const { root, replay } = month({
      localDate: '2026-11-30',
      restoredDates: dates.slice(0, 29),
      restoreDate: dates[29],
      haptics: true,
      success,
    });
    replay.click();
    await advance(700);
    expect(root.querySelector('dialog')).toBeNull();
    expect(
      records.find((record) => record.node.classList.contains('gg-v4-month-pulse'))?.options
        .duration,
    ).toBe(900);
    await advance(900);
    expect(
      records.find((record) => record.node.classList.contains('gg-v4-month-sheen'))?.options
        .duration,
    ).toBe(350);
    await advance(350);
    expect(root.querySelector('dialog[open]')).not.toBeNull();
    expect(success).toHaveBeenCalledOnce();
  });
  it('cancels restoration on removal without a storage or settle callback', async () => {
    const onStorage = vi.fn(),
      medium = vi.fn();
    const { root, replay } = month({ onStorage, medium, haptics: true });
    replay.click();
    root.remove();
    await advance(1000);
    expect(onStorage).not.toHaveBeenCalled();
    expect(medium).not.toHaveBeenCalled();
  });
  it('has a roving keyboard grid, filled/hollow pips, and expired/future play guards', () => {
    const onPlayDate = vi.fn();
    const { root } = month({ showGrid: true, onPlayDate });
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[role="gridcell"] button')];
    expect(buttons).toHaveLength(30);
    expect(buttons.filter((node) => node.tabIndex === 0)).toHaveLength(1);
    expect(buttons[0]!.textContent).toContain('●');
    expect(buttons[12]!.textContent).toContain('○');
    buttons[0]!.focus();
    buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    expect(document.activeElement).toBe(buttons[6]);
    buttons[6]!.click();
    expect(onPlayDate).toHaveBeenCalledExactlyOnceWith('2026-11-07');
    buttons[29]!.click();
    expect(onPlayDate).toHaveBeenCalledOnce();
  });
  it('offers fragmentary collection thumbnails and the empty state without storage', () => {
    const collection = createMonthCollection({
      manifests: MONTHS,
      progress: [
        {
          version: 1,
          monthKey: manifest.monthKey,
          seed: manifest.seed,
          restoredDates: dates.slice(0, 12),
        },
      ],
    });
    expect(collection.querySelectorAll('image')).toHaveLength(3);
    expect(createMonthCollection({ manifests: MONTHS, progress: [] }).textContent).toBe(
      'No pieces restored yet',
    );
  });
});
