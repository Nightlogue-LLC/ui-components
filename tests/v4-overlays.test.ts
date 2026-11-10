import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createOverlayPreview } from '../stories/projects/grim-glimmer-v4/overlay-fixtures.js';
import {
  createSettingsPreview,
  DEFAULT_PREFERENCES,
} from '../stories/projects/grim-glimmer-v4/settings-proposal.js';
import { createProposalSheet } from '../stories/projects/grim-glimmer-v4/overlay-primitives.js';
import { createHowTo, V4_LESSONS } from '../stories/projects/grim-glimmer-v4/howto-proposal.js';
import { openDialog, closeDialog } from '../src/components/dialog/index.js';
let scheme: EventTarget & { matches: boolean };
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
beforeEach(() => {
  scheme = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('color-scheme')
      ? scheme
      : Object.assign(new EventTarget(), { matches: query.includes('max-width') }),
  );
});
afterEach(async () => {
  document.querySelectorAll('dialog').forEach(closeDialog);
  document.body.replaceChildren();
  await flush();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function button(root: HTMLElement, label: string) {
  return [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (n) => n.textContent === label,
  )!;
}
function preview(
  entry: 'menu' | 'difficulty' | 'howto' = 'menu',
  options: Parameters<typeof createOverlayPreview>[0] = {},
) {
  const root = createOverlayPreview({ reducedMotion: true, ...options }, entry);
  document.body.append(root);
  return root;
}
function pointer(handle: HTMLElement, type: string, y: number, time: number) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientY: y });
  Object.defineProperties(event, { pointerId: { value: 1 }, timeStamp: { value: time } });
  handle.dispatchEvent(event);
}
describe('V4 menu and difficulty flows', () => {
  it('keeps one stable trigger and icon holder; restores focus and board interactivity on toggle/Escape/Back', () => {
    const push = vi.spyOn(window.history, 'pushState');
    const root = preview();
    const trigger = root.querySelector<HTMLButtonElement>('[aria-label="Game menu"]')!;
    const icon = trigger.querySelector('.nl-icon-button__icon');
    for (const route of ['toggle', 'escape', 'back']) {
      trigger.click();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(root.querySelector<HTMLElement>('[data-slot="board"]')!.inert).toBe(true);
      if (route === 'toggle') trigger.click();
      else if (route === 'escape')
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      else window.dispatchEvent(new PopStateEvent('popstate'));
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(trigger);
      expect(root.querySelector<HTMLElement>('[data-slot="board"]')!.inert).not.toBe(true);
      expect(trigger.querySelector('.nl-icon-button__icon')).toBe(icon);
    }
    expect(push).not.toHaveBeenCalled();
  });
  it('traps Tab between menu content and trigger', () => {
    const root = preview();
    const trigger = root.querySelector<HTMLButtonElement>('[aria-label="Game menu"]')!;
    trigger.click();
    button(root, 'Settings').focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(trigger);
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(button(root, 'Settings'));
  });
  it('emits mock preferences and gates haptics, without storage writes', () => {
    const tick = vi.fn(),
      onChange = vi.fn(),
      storage = vi.spyOn(Storage.prototype, 'setItem');
    const root = preview('menu', { tick, onChange });
    button(root, 'Open game menu').click();
    const switches = root.querySelectorAll<HTMLInputElement>('[role="switch"]');
    switches[2]!.click();
    switches[0]!.click();
    expect(tick).not.toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({ haptics: false, sound: false });
    expect(storage).not.toHaveBeenCalled();
  });
  it('routes Settings once after closing the popover', () => {
    const onNavigate = vi.fn();
    const root = preview('menu', { onNavigate });
    button(root, 'Open game menu').click();
    button(root, 'Settings').click();
    expect(root.querySelector('.gg-v4-popover')?.hasAttribute('hidden')).toBe(true);
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('settings');
  });
  it('retains selected Hard after visiting and dismissing help; starts only the requested mock puzzle', async () => {
    const onNewGame = vi.fn();
    const root = preview('difficulty', { onNewGame });
    button(root, 'Open difficulty sheet').click();
    root.querySelector<HTMLInputElement>('input[value="hard"]')!.click();
    button(root, 'How to Play').click();
    await flush();
    expect(root.querySelector('.gg-v4-howto[open]')).not.toBeNull();
    button(root, 'Skip').click();
    await flush();
    expect(root.querySelector<HTMLInputElement>('input[value="hard"]')!.checked).toBe(true);
    button(root.querySelector('dialog')!, 'New Game').click();
    await flush();
    expect(onNewGame).toHaveBeenCalledExactlyOnceWith('hard');
    expect(root.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(button(root, 'Open difficulty sheet'));
  });
  it('destroys an open modal and its pending outcome when the story unmounts', async () => {
    const onNewGame = vi.fn();
    const root = preview('difficulty', { onNewGame });
    button(root, 'Open difficulty sheet').click();
    root.remove();
    await flush();
    expect(root.querySelector('dialog')).toBeNull();
    expect(onNewGame).not.toHaveBeenCalled();
  });
});
describe('V4 proposal sheet gesture contract', () => {
  it.each([
    [120, 1000, false],
    [121, 1000, true],
    [24, 40, true],
    [23, 1, false],
    [100, 200, false],
  ] as const)('offset %spx in %sms dismisses: %s', (distance, time, dismissed) => {
    const onClose = vi.fn();
    const part = createProposalSheet({ title: 'Gesture', animations: false, onClose });
    document.body.append(part.dialog);
    openDialog(part.dialog);
    const handle = part.dialog.querySelector<HTMLElement>('.nl-bottom-sheet__handle')!;
    pointer(handle, 'pointerdown', 0, 0);
    pointer(handle, 'pointermove', distance, time);
    pointer(handle, 'pointerup', distance, time);
    expect(part.dialog.open).toBe(!dismissed);
    expect(onClose).toHaveBeenCalledTimes(dismissed ? 1 : 0);
    part.destroy();
  });
  it('uses .1 upward elasticity and cancels a drag without dismissing', () => {
    const part = createProposalSheet({ title: 'Gesture', animations: false });
    document.body.append(part.dialog);
    openDialog(part.dialog);
    const handle = part.dialog.querySelector<HTMLElement>('.nl-bottom-sheet__handle')!,
      panel = part.dialog.querySelector<HTMLElement>('.nl-bottom-sheet__panel')!;
    pointer(handle, 'pointerdown', 100, 0);
    pointer(handle, 'pointermove', 0, 100);
    expect(panel.style.transform).toBe('translateY(-10px)');
    pointer(handle, 'pointercancel', 0, 100);
    expect(panel.style.transform).toBe('');
    expect(part.dialog.open).toBe(true);
    part.destroy();
  });
  it('ignores body scrolling for swipe dismissal and honors non-primary input', () => {
    const part = createProposalSheet({ title: 'Scroll', animations: false });
    document.body.append(part.dialog);
    openDialog(part.dialog);
    const body = part.dialog.querySelector<HTMLElement>('.nl-dialog__body')!;
    pointer(body, 'pointerdown', 0, 0);
    pointer(body, 'pointerup', 400, 20);
    expect(part.dialog.open).toBe(true);
    const handle = part.dialog.querySelector<HTMLElement>('.nl-bottom-sheet__handle')!;
    handle.dispatchEvent(new MouseEvent('pointerdown', { button: 2 }));
    pointer(handle, 'pointerup', 400, 20);
    expect(part.dialog.open).toBe(true);
    part.destroy();
  });
});
describe('V4 settings and tutorial', () => {
  it('uses labelled native switches and scoped controlled theme state', () => {
    const onChange = vi.fn();
    const root = createSettingsPreview({ onChange });
    document.body.append(root);
    const dark = root.querySelector<HTMLInputElement>('input[value="dark"]')!;
    dark.click();
    expect(dark.checked).toBe(true);
    expect(root.dataset.nlMode).toBe('dark');
    expect(document.documentElement.hasAttribute('data-nl-mode')).toBe(false);
    const music = root.querySelectorAll<HTMLInputElement>('[role="switch"]')[1]!;
    music.click();
    expect(music.checked).toBe(true);
    expect(music.closest('label')?.textContent).toBe('Music');
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({ appearance: 'dark', music: true });
    expect(DEFAULT_PREFERENCES.music).toBe(false);
  });
  it('follows live system color changes only in System mode, then removes the listener', () => {
    const remove = vi.spyOn(scheme, 'removeEventListener');
    const root = createSettingsPreview();
    document.body.append(root);
    scheme.matches = true;
    scheme.dispatchEvent(new Event('change'));
    expect(root.dataset.nlMode).toBe('dark');
    root.querySelector<HTMLInputElement>('input[value="light"]')!.click();
    scheme.dispatchEvent(new Event('change'));
    expect(root.dataset.nlMode).toBe('light');
    root.remove();
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
  });
  it('keeps all three practice marks gated and exposes current/total dots without interactive navigation', async () => {
    const root = preview('howto', { initialLesson: 1 });
    button(root, 'Open guided tutorial').click();
    expect(button(root, 'Next').disabled).toBe(true);
    expect(root.querySelectorAll('.gg-v4-step-dot')).toHaveLength(9);
    const cell = root.querySelector<HTMLButtonElement>('dialog .nl-grim-glimmer-board__cell')!;
    for (let i = 0; i < 2; i++) {
      cell.click();
      expect(button(root, 'Next').disabled).toBe(true);
    }
    cell.click();
    expect(button(root, 'Next').disabled).toBe(false);
    button(root, 'Next').click();
    await flush();
    expect(root.querySelector('.gg-v4-step-dots')?.textContent).toBe('Step 3 of 9');
    expect(root.querySelectorAll('.gg-v4-step-dot button')).toHaveLength(0);
  });
  it('adds two-finger guidance without replacing existing lessons or promising all-grid zoom', () => {
    expect(V4_LESSONS).toHaveLength(9);
    const part = createHowTo({ initialLesson: 7, reducedMotion: true });
    expect(part.dialog.textContent).toContain('On a 15×15 board, use two fingers to zoom and pan.');
    expect(part.dialog.textContent).toContain('One finger places marks.');
    expect(part.dialog.dataset.reducedMotion).toBe('true');
    part.destroy();
  });
});

describe('V4 overlay lifecycle and motion', () => {
  it('waits for the 160ms popover exit and suppresses queued navigation after a reopen', async () => {
    const onNavigate = vi.fn();
    const root = preview('menu', { reducedMotion: false, onNavigate });
    const panel = root.querySelector<HTMLElement>('.nl-grim-glimmer-menu-sheet__panel')!;
    const motions: { finish: () => void; frames: Keyframe[]; options: KeyframeAnimationOptions }[] =
      [];
    panel.animate = (frames: Keyframe[], options: KeyframeAnimationOptions) => {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      motions.push({ finish, frames, options });
      return { finished, cancel: vi.fn() } as unknown as Animation;
    };
    const trigger = root.querySelector<HTMLButtonElement>('[aria-label="Game menu"]')!;
    trigger.click();
    button(root, 'Settings').click();
    expect(onNavigate).not.toHaveBeenCalled();
    trigger.click();
    motions.forEach((m) => m.finish());
    await flush();
    expect(onNavigate).not.toHaveBeenCalled();
    trigger.click();
    motions.at(-1)!.finish();
    await flush();
    expect(onNavigate).not.toHaveBeenCalled();
    trigger.click();
    button(root, 'Settings').click();
    motions.at(-1)!.finish();
    await flush();
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('settings');
    for (const motion of motions) {
      expect(motion.options.duration).toBe(160);
      for (const frame of motion.frames)
        expect(Object.keys(frame)).toEqual(['transform', 'opacity']);
    }
  });
  it('uses the existing 280ms motion in both sheet directions and waits before notifying', async () => {
    const onClose = vi.fn();
    const part = createProposalSheet({ title: 'Shared motion', onClose });
    document.body.append(part.dialog);
    const records: { frames: Keyframe[]; options: KeyframeAnimationOptions; finish: () => void }[] =
      [];
    part.dialog.animate = (frames: Keyframe[], options: KeyframeAnimationOptions) => {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      records.push({ frames, options, finish });
      return { finished, cancel: vi.fn() } as unknown as Animation;
    };
    openDialog(part.dialog);
    records[0]!.finish();
    await flush();
    closeDialog(part.dialog);
    expect(part.dialog.open).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    expect(records[0]!.frames).toEqual([...records[1]!.frames].reverse());
    expect(records.map((r) => r.options.duration)).toEqual([280, 280]);
    records[1]!.finish();
    await flush();
    expect(part.dialog.open).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
    part.destroy();
  });
  it.each(['back', 'escape', 'backdrop'])(
    'dismisses the difficulty sheet through %s and restores focus',
    (route) => {
      const root = preview('difficulty');
      button(root, 'Open difficulty sheet').click();
      const dialog = root.querySelector('dialog')!;
      if (route === 'back') button(root, 'Simulate Back').click();
      else if (route === 'escape') dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
      else {
        dialog.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        dialog.click();
      }
      expect(root.querySelector('dialog')).toBeNull();
      expect(document.activeElement).toBe(button(root, 'Open difficulty sheet'));
    },
  );
});
