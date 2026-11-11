import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSwitch, updateSwitch } from '../src/components/switch/index.js';
import { createBottomSheet, destroyBottomSheet } from '../src/components/bottom-sheet/index.js';
import {
  createDialog,
  openDialog,
  closeDialog,
  destroyDialog,
} from '../src/components/dialog/index.js';
import {
  createGameMenuSheet,
  createGameplayMotion,
  GAMEPLAY_MOTION,
} from '../src/projects/grim-glimmer/index.js';

const media = Object.assign(new EventTarget(), { matches: false });
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
beforeEach(() => {
  media.matches = false;
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('max-width') ? { matches: true } : media,
  );
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});
afterEach(() => {
  document.querySelectorAll('dialog').forEach(destroyDialog);
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function animation(node: HTMLElement) {
  const jobs: {
    finish: () => void;
    cancel: ReturnType<typeof vi.fn>;
    timing: KeyframeAnimationOptions;
  }[] = [];
  node.animate = (_frames: Keyframe[], timing: KeyframeAnimationOptions) => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const cancel = vi.fn();
    jobs.push({ finish, cancel, timing });
    return { finished, cancel } as unknown as Animation;
  };
  return jobs;
}
function pointer(handle: HTMLElement, type: string, y: number, time = 0) {
  const event = new MouseEvent(type, { button: 0, clientY: y, bubbles: true });
  Object.defineProperties(event, { pointerId: { value: 1 }, timeStamp: { value: time } });
  handle.dispatchEvent(event);
}

describe('shared switch', () => {
  it('uses safe visible label text and native checked state with switch semantics', () => {
    const change = vi.fn();
    const row = createSwitch({ label: '<Sound>', checked: true, onChange: change });
    expect(row.querySelector('sound')).toBeNull();
    expect(row.textContent).toBe('<Sound>');
    document.body.append(row);
    const input = row.querySelector<HTMLInputElement>('input')!;
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.checked).toBe(true);
    input.click();
    expect(change).toHaveBeenCalledExactlyOnceWith(false);
  });
  it('applies external state without replacing focus or emitting a change', () => {
    const change = vi.fn(),
      row = createSwitch({ label: 'Haptics', checked: false, onChange: change });
    document.body.append(row);
    const input = row.querySelector<HTMLInputElement>('input')!;
    input.focus();
    updateSwitch(row, { label: 'Feedback', checked: true, reducedMotion: true });
    expect(document.activeElement).toBe(input);
    expect(input.checked).toBe(true);
    expect(change).not.toHaveBeenCalled();
    expect(row.dataset.reducedMotion).toBe('true');
    updateSwitch(row, { label: 'Feedback', checked: true, disabled: true });
    input.click();
    expect(change).not.toHaveBeenCalled();
    expect(() => updateSwitch(row, { label: ' ', checked: false })).toThrow();
    expect(input.checked).toBe(true);
  });
});

describe('editorial sheets and terminal dialog teardown', () => {
  it('drops a pending close callback and its exit animation on teardown', async () => {
    const close = vi.fn(),
      sheet = createBottomSheet({ title: 'Options', presentation: 'editorial', onClose: close });
    document.body.append(sheet);
    const jobs = animation(sheet);
    openDialog(sheet);
    closeDialog(sheet);
    expect(jobs.map((job) => job.timing.duration)).toEqual([280, 280]);
    destroyBottomSheet(sheet);
    jobs.forEach((job) => job.finish());
    await flush();
    expect(close).not.toHaveBeenCalled();
    expect(sheet.isConnected).toBe(false);
    expect(() => openDialog(sheet)).toThrow();
    destroyBottomSheet(sheet);
  });
  it.each(['blur', 'resize'])('cancels the handle drag on %s without a close outcome', (event) => {
    const close = vi.fn(),
      sheet = createBottomSheet({
        title: 'Options',
        presentation: 'editorial',
        animations: false,
        onClose: close,
      });
    document.body.append(sheet);
    openDialog(sheet);
    const handle = sheet.querySelector<HTMLElement>('.nl-bottom-sheet__handle')!,
      panel = sheet.querySelector<HTMLElement>('.nl-bottom-sheet__panel')!;
    pointer(handle, 'pointerdown', 0);
    pointer(handle, 'pointermove', 90, 300);
    expect(panel.style.transform).toBe('translateY(90px)');
    window.dispatchEvent(new Event(event));
    expect(panel.style.transform).toBe('');
    pointer(handle, 'pointerup', 150, 600);
    expect(sheet.open).toBe(true);
    expect(close).not.toHaveBeenCalled();
    destroyBottomSheet(sheet);
  });
  it('does not turn content scrolling or desktop drags into a dismissal', () => {
    const sheet = createBottomSheet({
      title: 'Options',
      presentation: 'editorial',
      animations: false,
    });
    document.body.append(sheet);
    openDialog(sheet);
    const body = sheet.querySelector<HTMLElement>('.nl-dialog__body')!;
    pointer(body, 'pointerdown', 0);
    pointer(body, 'pointerup', 200, 200);
    expect(sheet.open).toBe(true);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const handle = sheet.querySelector<HTMLElement>('.nl-bottom-sheet__handle')!;
    pointer(handle, 'pointerdown', 0);
    pointer(handle, 'pointerup', 200, 200);
    expect(sheet.open).toBe(true);
    destroyBottomSheet(sheet);
  });
  it('removes fallback Escape handling and suppresses outcomes after destruction', () => {
    const close = vi.fn(),
      dialog = createDialog({ title: 'Modal', onClose: close });
    document.body.append(dialog);
    openDialog(dialog);
    destroyDialog(dialog);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(close).not.toHaveBeenCalled();
  });
});

function menu(history = false) {
  const root = document.createElement('main'),
    trigger = document.createElement('button'),
    content = document.createElement('div');
  content.append(document.createElement('button'));
  const board = document.createElement('div');
  board.dataset.slot = 'board';
  const part = createGameMenuSheet({ trigger, content, presentation: 'popover', history });
  root.append(trigger, board, part.element);
  document.body.append(root);
  const jobs = animation(
    part.element.querySelector<HTMLElement>('.nl-grim-glimmer-menu-sheet__panel')!,
  );
  return { root, trigger, board, part, jobs };
}
describe('supported popover lifecycle', () => {
  it('waits for both history consumption and exit before dispatching an action', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { part, jobs } = menu(true),
      action = vi.fn();
    part.open();
    part.close(action);
    expect(back).toHaveBeenCalledOnce();
    jobs.at(-1)!.finish();
    await flush();
    expect(action).not.toHaveBeenCalled();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(action).toHaveBeenCalledOnce();
    part.destroy();
    window.history.replaceState({}, '');
  });
  it('invalidates pending navigation when reopened and tears down listeners on removal', async () => {
    const { root, trigger, board, part, jobs } = menu(),
      action = vi.fn();
    const holder = trigger.querySelector('.nl-icon-button__icon');
    part.open();
    part.close(action);
    part.open();
    jobs.forEach((job) => job.finish());
    await flush();
    expect(action).not.toHaveBeenCalled();
    expect(part.isOpen).toBe(true);
    expect(trigger.querySelector('.nl-icon-button__icon')).toBe(holder);
    part.close(action);
    root.remove();
    await flush();
    jobs.forEach((job) => job.finish());
    await flush();
    expect(action).not.toHaveBeenCalled();
    expect(board.inert).not.toBe(true);
    trigger.click();
    expect(part.isOpen).toBe(false);
    part.destroy();
  });
  it('does not dismiss a popover from a content swipe', () => {
    const { part } = menu();
    part.open();
    const panel = part.element.querySelector<HTMLElement>('.nl-grim-glimmer-menu-sheet__panel')!;
    pointer(panel, 'pointerdown', 0);
    pointer(panel, 'pointerup', 200, 200);
    expect(part.isOpen).toBe(true);
    part.destroy();
  });
});

describe('published gameplay motion', () => {
  it('preserves accepted timing and applies final presentation with animations off', () => {
    const grid = document.createElement('div');
    grid.append(document.createElement('span'));
    const jobs = animation(grid),
      done = vi.fn();
    const motion = createGameplayMotion({ animations: false });
    motion.dissolve(grid, 1, done);
    expect(done).toHaveBeenCalledOnce();
    expect(jobs).toHaveLength(0);
    expect(GAMEPLAY_MOTION).toMatchObject({ screen: 560, dissolveFade: 480, dissolveCap: 1200 });
    motion.dispose();
  });
  it('cancels stale dissolve callbacks and never starts new work after disposal', async () => {
    const grid = document.createElement('div'),
      cell = document.createElement('span');
    grid.append(cell);
    animation(grid);
    const jobs = animation(cell),
      done = vi.fn(),
      motion = createGameplayMotion();
    motion.dissolve(grid, 1, done);
    motion.dispose();
    jobs[0]!.finish();
    await flush();
    motion.changes(grid, ['empty'], ['placed']);
    motion.dissolve(grid, 1, done);
    motion.mount();
    expect(jobs).toHaveLength(1);
    expect(done).not.toHaveBeenCalled();
    expect(jobs[0]!.cancel).toHaveBeenCalled();
  });
  it('settles an in-flight dissolve once when the app disables animations', async () => {
    const grid = document.createElement('div'),
      cell = document.createElement('span');
    grid.append(cell);
    animation(grid);
    const jobs = animation(cell),
      done = vi.fn(),
      motion = createGameplayMotion();
    motion.mount();
    motion.dissolve(grid, 1, done);
    motion.setAnimations(false);
    expect(done).toHaveBeenCalledOnce();
    jobs[0]!.finish();
    await flush();
    expect(done).toHaveBeenCalledOnce();
    motion.dispose();
  });
});
