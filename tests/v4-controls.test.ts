import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createToolToggle,
  createControlsDemo,
  createControlRow,
} from '../stories/projects/grim-glimmer-v4/controls.js';
function button(root: HTMLElement, label: string) {
  return root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
}
afterEach(() => {
  document.body.replaceChildren();
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
  button(root, 'Undo move').focus();
  button(root, 'Undo move').click();
  expect([...root.querySelectorAll('[data-index]')].map((cell) => cell.className)).toEqual(
    original,
  );
  expect(button(root, 'Exclude cell').getAttribute('aria-pressed')).toBe('true');
  expect(document.activeElement).toBe(button(root, 'Undo move'));
  expect(root.querySelector('.gg-v4-restart-toast')).toBeNull();
});
