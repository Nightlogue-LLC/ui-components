import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBottomSheet } from './bottom-sheet.js';
import { openDialog } from '../dialog/index.js';
afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});
function swipe(sheet: HTMLDialogElement, dx = 0, dy = 90) {
  const handle = sheet.querySelector('.nl-bottom-sheet__handle')!;
  for (const [type, x, y] of [
    ['pointerdown', 10, 10],
    ['pointerup', 10 + dx, 10 + dy],
  ] as const) {
    const event = new MouseEvent(type, { button: 0, clientX: x, clientY: y });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    handle.dispatchEvent(event);
  }
}
describe('bottom sheet', () => {
  it.each([true, false])('respects dismissible=%s for swipe and Escape', (dismissible) => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const onClose = vi.fn();
    const sheet = createBottomSheet({ title: 'Sheet', dismissible, onClose });
    document.body.append(sheet);
    openDialog(sheet);
    swipe(sheet);
    expect(sheet.hasAttribute('open')).toBe(!dismissible);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(dismissible ? 1 : 0);
  });
  it('ignores horizontal gestures, short drags and disabled swipes', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    for (const swipeToDismiss of [true, false]) {
      const sheet = createBottomSheet({ title: 'Sheet', swipeToDismiss, animations: false });
      document.body.append(sheet);
      openDialog(sheet);
      swipe(sheet, 120, 60);
      swipe(sheet, 0, 20);
      if (!swipeToDismiss) swipe(sheet);
      expect(sheet.hasAttribute('open')).toBe(true);
      expect(sheet.dataset.animations).toBe('off');
    }
  });
});
