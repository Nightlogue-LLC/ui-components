import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCluedBoard,
  createCompletionSheet,
  createCompletionSequence,
  COMPLETION_TIMING,
} from '../src/projects/grim-glimmer/index.js';
import { closeDialog, destroyDialog } from '../src/components/dialog/index.js';
const media = Object.assign(new EventTarget(), { matches: false });
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
let original: PropertyDescriptor | undefined;
const jobs: { finish: () => void; cancel: ReturnType<typeof vi.fn> }[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  jobs.length = 0;
  media.matches = false;
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('reduced-motion') ? media : { matches: true },
  );
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: () => {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const cancel = vi.fn();
      jobs.push({ finish, cancel });
      return { finished, cancel } as unknown as Animation;
    },
  });
});
afterEach(async () => {
  document.querySelectorAll('dialog').forEach(destroyDialog);
  document.body.replaceChildren();
  await flush();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (original) Object.defineProperty(HTMLElement.prototype, 'animate', original);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});
function sample(overrides: Partial<Parameters<typeof createCompletionSequence>[0]> = {}) {
  const host = document.createElement('main');
  const board = createCluedBoard({
    size: 2,
    rowClues: [1, 1],
    columnClues: [1, 1],
    cells: ['placed', 'fixed', 'empty', 'placed'],
    mode: 'readonly',
    label: 'Solved board',
    presentation: 'editorial',
  });
  host.append(board);
  document.body.append(host);
  const onNewGame = vi.fn(),
    onReturnHome = vi.fn(),
    onClose = vi.fn(),
    message = vi.fn(() => '<Quiet camp>');
  const sequence = createCompletionSequence({
    host,
    board,
    size: 2,
    title: 'Puzzle Complete',
    message,
    onNewGame,
    onReturnHome,
    onClose,
    ...overrides,
  });
  const grid = board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  return { host, board, grid, sequence, onNewGame, onReturnHome, onClose, message };
}
describe('supported completion contract', () => {
  it('renders only supplied values and preserves the legacy success API defaults', () => {
    const sheet = createCompletionSheet({
      title: 'Complete',
      message: '<Done>',
      onNewGame: vi.fn(),
      onReturnHome: vi.fn(),
      onClose: vi.fn(),
    });
    expect(sheet.querySelector('.gg-v4-victory-stats')).toBeNull();
    expect(
      [...sheet.querySelectorAll('.nl-dialog__actions button')].map((x) => x.textContent),
    ).toEqual(['Return Home', 'New Game']);
    expect(sheet.querySelector('done')).toBeNull();
    expect(sheet.querySelector('.nl-grim-glimmer-success-sheet__message')?.textContent).toBe(
      '<Done>',
    );
  });
  it('starts once and keeps decorative links outside the indexed grid', () => {
    const { host, grid, sequence, message } = sample();
    sequence.start();
    sequence.start();
    expect(grid.children).toHaveLength(4);
    expect(host.querySelectorAll('.gg-v4-victory-links')).toHaveLength(1);
    expect(host.querySelector('.gg-v4-victory-links')?.getAttribute('aria-hidden')).toBe('true');
    vi.advanceTimersByTime(600);
    expect(host.querySelector('.gg-v4-victory-links')).toBeNull();
    vi.advanceTimersByTime(99);
    expect(host.querySelector('dialog')).toBeNull();
    vi.advanceTimersByTime(1);
    expect(host.querySelector('dialog')?.open).toBe(true);
    expect(message).toHaveBeenCalledOnce();
    sequence.start();
    expect(host.querySelectorAll('dialog')).toHaveLength(1);
    expect(COMPLETION_TIMING).toMatchObject({ celebration: 600, sheet: 700, stats: 980 });
    sequence.dispose();
  });
  it.each(['disabled', 'reduced', 'unsupported', 'preview'] as const)(
    'opens immediately for %s without a celebration',
    (mode) => {
      if (mode === 'unsupported') Reflect.deleteProperty(HTMLElement.prototype, 'animate');
      const { host, sequence } = sample({
        animations: mode !== 'disabled',
        reducedMotion: mode === 'reduced',
      });
      sequence.start({ celebration: mode !== 'preview' });
      expect(host.querySelector('dialog')?.open).toBe(true);
      expect(host.querySelector('.gg-v4-victory-links')).toBeNull();
      sequence.dispose();
    },
  );
  it.each(['hidden', 'hashchange', 'popstate', 'dispose', 'removal'] as const)(
    'cancels pending presentation on %s and suppresses replay',
    async (reason) => {
      const { host, sequence, message, onNewGame } = sample();
      sequence.start();
      if (reason === 'hidden') {
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
        document.dispatchEvent(new Event('visibilitychange'));
      } else if (reason === 'removal') {
        host.remove();
        await flush();
      } else if (reason === 'dispose') sequence.dispose();
      else window.dispatchEvent(new Event(reason));
      sequence.start();
      vi.advanceTimersByTime(1500);
      expect(host.querySelector('dialog')).toBeNull();
      expect(message).not.toHaveBeenCalled();
      expect(onNewGame).not.toHaveBeenCalled();
      expect(host.querySelector('.gg-v4-victory-links')).toBeNull();
      sequence.dispose();
    },
  );
  it('settles a live animation preference immediately without a second message or sheet', () => {
    const { host, sequence, message } = sample();
    sequence.start();
    sequence.setAnimations(false);
    expect(host.querySelector('dialog')?.open).toBe(true);
    expect(host.querySelector('.gg-v4-victory-links')).toBeNull();
    sequence.setAnimations(true);
    vi.advanceTimersByTime(1500);
    expect(message).toHaveBeenCalledOnce();
    sequence.dispose();
  });
  it('suppresses an action already waiting for exit when disposed', async () => {
    const { host, sequence, onNewGame } = sample();
    sequence.start({ celebration: false });
    host.querySelector<HTMLButtonElement>('.nl-dialog__actions button:last-child')!.click();
    sequence.dispose();
    jobs.forEach((j) => j.finish());
    await flush();
    expect(onNewGame).not.toHaveBeenCalled();
    expect(host.querySelector('dialog')).toBeNull();
  });
  it('lets shared modal history settle before dispatching one action', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { host, sequence, onNewGame, onClose } = sample({ animations: false, history: true });
    sequence.start();
    host.querySelector<HTMLButtonElement>('.nl-dialog__actions button:last-child')!.click();
    expect(back).toHaveBeenCalledOnce();
    expect(onNewGame).not.toHaveBeenCalled();
    window.history.replaceState({}, '');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await flush();
    expect(onNewGame).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    sequence.dispose();
  });
  it('leaves the solved board intact after dismissal, restores focus and emits no new outcome', () => {
    const { host, grid, sequence, onClose, onNewGame } = sample({ animations: false });
    const trigger = document.createElement('button');
    host.prepend(trigger);
    trigger.focus();
    sequence.start();
    const sheet = host.querySelector<HTMLDialogElement>('dialog')!;
    closeDialog(sheet);
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
    sequence.start();
    expect(grid.children).toHaveLength(4);
    expect(onNewGame).not.toHaveBeenCalled();
    sequence.dispose();
  });
  it('validates geometry before creating timers or listeners', () => {
    expect(() => sample({ size: 0 })).toThrow();
    expect(() => sample({ size: 15 })).toThrow();
  });
});
