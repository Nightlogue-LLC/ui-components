import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createVictoryPreview,
  createVictorySheet,
  createVictoryComparison,
  VICTORY_TIMING,
} from '../stories/projects/grim-glimmer-v4/victory.js';
import { openDialog, closeDialog } from '../src/components/dialog/index.js';
let reduce: EventTarget & { matches: boolean };
let originalAnimate: PropertyDescriptor | undefined;
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
beforeEach(() => {
  vi.useFakeTimers();
  reduce = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('reduced-motion') ? reduce : { matches: true },
  );
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
});
afterEach(async () => {
  document.querySelectorAll('dialog').forEach(closeDialog);
  document.body.replaceChildren();
  await flush();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});
function button(root: HTMLElement, text: string) {
  return [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (node) => node.textContent === text,
  )!;
}
function replay(root: HTMLElement) {
  root.querySelector<HTMLButtonElement>('.gg-v4-victory-review-actions button')!.click();
}
describe('V4 completion composition', () => {
  it('reuses two shared actions, safe dynamic copy and mock statistics without a grabber/large star', () => {
    const message = vi.fn(() => '<A completed sky>');
    const sheet = createVictorySheet({ reducedMotion: true }, message);
    expect(message).toHaveBeenCalledOnce();
    expect(sheet.querySelector('img')).toBeNull();
    expect(sheet.querySelector('.nl-grim-glimmer-success-sheet__message')?.textContent).toBe(
      '<A completed sky>',
    );
    expect(
      [...sheet.querySelectorAll('.nl-dialog__actions button')].map((node) => node.textContent),
    ).toEqual(['Return Home', 'Next Puzzle']);
    expect(sheet.querySelector('.nl-bottom-sheet__handle')).toBeNull();
    expect(sheet.querySelector('.nl-grim-glimmer-success-sheet__star')).toBeNull();
    expect(sheet.querySelector('.gg-v4-victory-stats')?.getAttribute('aria-label')).toContain(
      'TIME 02:14, HINTS 0, MISTAKES 1',
    );
    expect(sheet.querySelector('.nl-dialog__close')?.getAttribute('aria-label')).toBe(
      'Close completion',
    );
  });
  it('can hide stats and accepts explicit mocked values', () => {
    expect(
      createVictorySheet({ showStats: false }, 'Complete').querySelector('.gg-v4-victory-stats'),
    ).toBeNull();
    expect(
      createVictorySheet({ time: '04:10', hints: 2, mistakes: 3 }, 'Complete').textContent,
    ).toContain('TIME 04:10');
  });
  it.each(['Return Home', 'Next Puzzle'] as const)(
    'routes only the %s mock action after closing',
    async (label) => {
      const onHome = vi.fn();
      const onNext = vi.fn();
      const onDismiss = vi.fn();
      const sheet = createVictorySheet(
        { reducedMotion: true, onHome, onNext, onDismiss },
        'Complete',
      );
      document.body.append(sheet);
      openDialog(sheet);
      button(sheet, label).click();
      await flush();
      expect(sheet.open).toBe(false);
      expect(onHome).toHaveBeenCalledTimes(label === 'Return Home' ? 1 : 0);
      expect(onNext).toHaveBeenCalledTimes(label === 'Next Puzzle' ? 1 : 0);
      expect(onDismiss).not.toHaveBeenCalled();
    },
  );
  it('handles optional Medium separately and consumes the outcome before reopening', () => {
    const onMedium = vi.fn();
    const onDismiss = vi.fn();
    const sheet = createVictorySheet(
      { reducedMotion: true, tryMedium: true, onMedium, onDismiss },
      'Complete',
    );
    document.body.append(sheet);
    openDialog(sheet);
    button(sheet, 'Try Medium →').click();
    expect(onMedium).toHaveBeenCalledOnce();
    expect(onDismiss).not.toHaveBeenCalled();
    openDialog(sheet);
    sheet.querySelector<HTMLButtonElement>('.nl-dialog__close')!.click();
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onMedium).toHaveBeenCalledOnce();
  });
  it('uses non-modal inert comparisons for two-theme review', () => {
    const root = createVictoryComparison();
    document.body.append(root);
    expect(root.querySelector('dialog')).toBeNull();
    expect(root.querySelector('.gg-v4-victory-inline [inert]')).not.toBeNull();
    expect(root.querySelector('.gg-v4-solved-chip')?.hasAttribute('hidden')).toBe(false);
  });
});
describe('V4 victory sequence', () => {
  it.each([6, 15] as const)(
    'locks a read-only %s board, emits one success and opens at 700ms',
    (size) => {
      const success = vi.fn();
      const root = createVictoryPreview({ size, haptics: true, success });
      document.body.append(root);
      replay(root);
      expect(root.dataset.solved).toBe('true');
      expect(success).toHaveBeenCalledOnce();
      expect(root.querySelector('.nl-grim-glimmer-board button')).toBeNull();
      expect(root.querySelectorAll('.gg-v4-victory-links')).toHaveLength(1);
      expect(root.querySelector('dialog')).toBeNull();
      vi.advanceTimersByTime(699);
      expect(root.querySelector('dialog')).toBeNull();
      vi.advanceTimersByTime(1);
      expect(root.querySelector('dialog')?.open).toBe(true);
    },
  );
  it('replays pending work without duplicate overlays or a stale second sheet', () => {
    const root = createVictoryPreview();
    document.body.append(root);
    replay(root);
    vi.advanceTimersByTime(300);
    replay(root);
    expect(root.querySelectorAll('.gg-v4-victory-links')).toHaveLength(1);
    vi.advanceTimersByTime(699);
    expect(root.querySelector('dialog')).toBeNull();
    vi.advanceTimersByTime(1);
    expect(root.querySelectorAll('dialog[open]')).toHaveLength(1);
  });
  it.each(['x', 'escape', 'back', 'backdrop'] as const)(
    'dismisses via %s while retaining Solved, restoring focus and cleaning pending effects',
    (route) => {
      const onDismiss = vi.fn();
      const root = createVictoryPreview({ reducedMotion: true, onDismiss });
      document.body.append(root);
      replay(root);
      const sheet = root.querySelector<HTMLDialogElement>('dialog')!;
      if (route === 'x') sheet.querySelector<HTMLButtonElement>('.nl-dialog__close')!.click();
      else if (route === 'escape')
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      else if (route === 'back') button(root, 'Simulate Back').click();
      else {
        sheet.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        sheet.click();
      }
      expect(sheet.open).toBe(false);
      expect(onDismiss).toHaveBeenCalledOnce();
      expect(root.querySelector('.gg-v4-solved-chip')?.hasAttribute('hidden')).toBe(false);
      expect(document.activeElement).toBe(
        root.querySelector('.gg-v4-victory-review-actions button'),
      );
      vi.advanceTimersByTime(1);
      expect(vi.getTimerCount()).toBe(0);
    },
  );
  it('cancels a pending opening when Back occurs before the sheet exists', () => {
    const onDismiss = vi.fn();
    const root = createVictoryPreview({ onDismiss });
    document.body.append(root);
    replay(root);
    vi.advanceTimersByTime(200);
    button(root, 'Simulate Back').click();
    vi.advanceTimersByTime(1000);
    expect(root.querySelector('dialog')).toBeNull();
    expect(root.dataset.solved).toBe('true');
    expect(onDismiss).toHaveBeenCalledOnce();
  });
  it('uses the message bank once per sheet and never repeats consecutive messages', () => {
    const root = createVictoryPreview({
      reducedMotion: true,
      messageMode: 'bank',
      messages: ['One sky', 'Another sky'],
    });
    document.body.append(root);
    replay(root);
    const first = root.querySelector('.nl-grim-glimmer-success-sheet__message')!.textContent;
    replay(root);
    const second = root.querySelector('.nl-grim-glimmer-success-sheet__message')!.textContent;
    expect(second).not.toBe(first);
    expect(root.querySelectorAll('dialog[open]')).toHaveLength(1);
  });
  it('honors reduced motion and the haptics preference without a delayed opening', () => {
    const success = vi.fn();
    const root = createVictoryPreview({ reducedMotion: true, haptics: false, success });
    document.body.append(root);
    replay(root);
    expect(root.querySelector('dialog')?.open).toBe(true);
    expect(root.querySelector('.gg-v4-victory-links')).toBeNull();
    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(success).not.toHaveBeenCalled();
  });
  it('handles reduced motion changing before sheet opening', () => {
    const root = createVictoryPreview();
    document.body.append(root);
    replay(root);
    vi.advanceTimersByTime(100);
    reduce.matches = true;
    reduce.dispatchEvent(new Event('change'));
    expect(root.querySelector('dialog')?.open).toBe(true);
    expect(root.querySelector('.gg-v4-victory-links')).toBeNull();
    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('cancels backgrounded or removed sequences with no later dialog or navigation', () => {
    const onNext = vi.fn();
    const root = createVictoryPreview({ onNext });
    document.body.append(root);
    replay(root);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(1000);
    expect(root.querySelector('dialog')).toBeNull();
    expect(root.dataset.solved).toBe('true');
    replay(root);
    root.remove();
    vi.advanceTimersByTime(2000);
    expect(root.querySelector('dialog')).toBeNull();
    expect(onNext).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('suppresses an old navigation outcome when replay interrupts a closing sheet', async () => {
    const completions: (() => void)[] = [];
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: () => {
        let finish!: () => void;
        const finished = new Promise<void>((resolve) => {
          finish = resolve;
        });
        completions.push(finish);
        return { finished, cancel: vi.fn() } as unknown as Animation;
      },
    });
    const onNext = vi.fn();
    const root = createVictoryPreview({ onNext });
    document.body.append(root);
    replay(root);
    vi.advanceTimersByTime(700);
    button(root.querySelector('dialog')!, 'Next Puzzle').click();
    replay(root);
    completions.forEach((complete) => complete());
    await flush();
    expect(onNext).not.toHaveBeenCalled();
    root.remove();
  });
  it('starts stats after shared sheet entry, staggers at 60ms and animates only transform/opacity', async () => {
    const records: { frames: Keyframe[]; options: KeyframeAnimationOptions; node: HTMLElement }[] =
      [];
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: function (this: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) {
        records.push({ frames, options, node: this });
        return { finished: Promise.resolve(), cancel: vi.fn() } as unknown as Animation;
      },
    });
    const root = createVictoryPreview();
    document.body.append(root);
    replay(root);
    vi.advanceTimersByTime(700);
    await flush();
    const sheet = root.querySelector<HTMLDialogElement>('dialog')!;
    expect(sheet.dataset.statsPending).toBe('true');
    vi.advanceTimersByTime(279);
    expect(records.filter((record) => record.node.classList.contains('gg-v4-stat'))).toHaveLength(
      0,
    );
    vi.advanceTimersByTime(1);
    expect(sheet.dataset.statsPending).toBeUndefined();
    const stats = records.filter((record) => record.node.classList.contains('gg-v4-stat'));
    expect(stats.map((record) => record.options.delay)).toEqual([0, 60, 120]);
    expect(VICTORY_TIMING.stats).toBe(980);
    for (const { frames } of records)
      for (const frame of frames)
        expect(Object.keys(frame).every((key) => ['transform', 'opacity'].includes(key))).toBe(
          true,
        );
    await flush();
  });
});
