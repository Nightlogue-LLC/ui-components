import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createToolToggle,
  createRestartToast,
  createControlsDemo,
  createControlRow,
} from '../stories/projects/grim-glimmer-v4/controls.js';
function button(root: HTMLElement, label: string) {
  return root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});
afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe('V4 tool controls', () => {
  it('changes tool once, ticks once, and supports keyboard selection', () => {
    const tick = vi.fn();
    const onTool = vi.fn();
    const root = createToolToggle({ haptics: true, tick, onTool });
    document.body.append(root);
    button(root, 'Place star').click();
    expect(tick).not.toHaveBeenCalled();
    button(root, 'Place star').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(button(root, 'Exclude cell').getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(button(root, 'Exclude cell'));
    expect(tick).toHaveBeenCalledTimes(1);
    expect(onTool).toHaveBeenCalledWith('exclude');
  });
  it('gates ticks and native-disabled controls', () => {
    const tick = vi.fn();
    const enabled = createToolToggle({ haptics: false, tick });
    button(enabled, 'Exclude cell').click();
    expect(tick).not.toHaveBeenCalled();
    const disabled = createControlRow({ disabled: true, tick, haptics: true });
    disabled.querySelectorAll<HTMLButtonElement>('button').forEach((node) => {
      expect(node.disabled).toBe(true);
      node.click();
    });
    expect(tick).not.toHaveBeenCalled();
  });
  it('exposes Undo and distinct available/disabled hint without Redo', () => {
    const root = createControlRow({ canUndo: false, hint: 'available' });
    expect(button(root, 'Undo move').disabled).toBe(true);
    expect(button(root, 'Hint available').dataset.hint).toBe('available');
    expect(button(createControlRow({ hint: 'disabled' }), 'Hint').disabled).toBe(true);
    expect(root.querySelector('[aria-label*="Redo"]')).toBeNull();
  });
});
describe('V4 restart toast lifetime', () => {
  it('announces then expires after five seconds without undoing', () => {
    const undo = vi.fn();
    const expire = vi.fn();
    const toast = createRestartToast(undo, expire);
    document.body.append(toast.root);
    toast.show();
    expect(toast.root.querySelector('[role="status"]')?.textContent).toBe('Board cleared');
    vi.advanceTimersByTime(4999);
    expect(toast.root.hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(toast.root.hidden).toBe(true);
    expect(expire).toHaveBeenCalledOnce();
    expect(undo).not.toHaveBeenCalled();
  });
  it('pauses throughout focus and resumes the remaining duration', () => {
    const toast = createRestartToast(vi.fn());
    document.body.append(toast.root);
    toast.show();
    vi.advanceTimersByTime(2000);
    toast.root.querySelector('button')!.focus();
    vi.advanceTimersByTime(10000);
    expect(toast.root.hidden).toBe(false);
    toast.root.querySelector('button')!.blur();
    vi.advanceTimersByTime(2999);
    expect(toast.root.hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(toast.root.hidden).toBe(true);
  });
  it('keeps independent hover and focus pause reasons', () => {
    const toast = createRestartToast(vi.fn());
    document.body.append(toast.root);
    toast.show();
    toast.root.dispatchEvent(new Event('pointerenter'));
    toast.root.querySelector('button')!.focus();
    toast.root.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(6000);
    expect(toast.root.hidden).toBe(false);
    toast.root.querySelector('button')!.click();
    expect(toast.root.hidden).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('pauses when backgrounded and cleans up on replay/removal', () => {
    const toast = createRestartToast(vi.fn());
    document.body.append(toast.root);
    toast.show();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(6000);
    expect(toast.root.hidden).toBe(false);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    toast.show();
    expect(vi.getTimerCount()).toBe(1);
    toast.root.remove();
    expect(vi.getTimerCount()).toBe(0);
  });
});
it('clears once, preserves spires, undoes exactly and retains tool/focus', () => {
  const transaction = vi.fn();
  const root = createControlsDemo({ onTransaction: transaction });
  document.body.append(root);
  const original = [...root.querySelectorAll('[data-index]')].map((cell) => cell.className);
  button(root, 'Exclude cell').click();
  button(root, 'Restart board').focus();
  button(root, 'Restart board').click();
  expect(root.textContent).toContain('0 marks · 2 mock history entries');
  expect(transaction).toHaveBeenCalledWith('restart: one snapshot');
  expect(root.querySelectorAll('.nl-grim-glimmer-board__cell--fixed').length).toBeGreaterThan(0);
  root.querySelector<HTMLButtonElement>('.gg-v4-restart-toast button')!.click();
  expect([...root.querySelectorAll('[data-index]')].map((cell) => cell.className)).toEqual(
    original,
  );
  expect(button(root, 'Exclude cell').getAttribute('aria-pressed')).toBe('true');
  expect(document.activeElement).toBe(button(root, 'Restart board'));
});
