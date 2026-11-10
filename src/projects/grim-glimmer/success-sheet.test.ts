import { afterEach, describe, expect, it, vi } from 'vitest';
import { openDialog } from '../../components/dialog/index.js';
import { createSuccessSheet } from './success-sheet.js';
afterEach(() => document.body.replaceChildren());
function setup() {
  const callbacks = { onNewGame: vi.fn(), onReturnHome: vi.fn(), onClose: vi.fn() };
  const opener = document.createElement('button');
  document.body.append(opener);
  opener.focus();
  const sheet = createSuccessSheet({ title: 'Puzzle Complete', message: '<safe>', ...callbacks });
  document.body.append(sheet);
  openDialog(sheet);
  return { sheet, opener, ...callbacks };
}
describe('success sheet', () => {
  it('has exactly two actions, safe copy and primary initial focus', () => {
    const { sheet } = setup();
    const buttons = [...sheet.querySelectorAll<HTMLButtonElement>('.nl-dialog__actions button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['Return Home', 'New Game']);
    expect(document.activeElement).toBe(buttons[1]);
    expect(sheet.querySelector('.nl-grim-glimmer-success-sheet__message')!.textContent).toBe(
      '<safe>',
    );
  });
  it.each(['home', 'new', 'close', 'escape'] as const)(
    'reports only the %s outcome and restores focus',
    (action) => {
      const { sheet, opener, onNewGame, onReturnHome, onClose } = setup();
      const buttons = sheet.querySelectorAll<HTMLButtonElement>('.nl-dialog__actions button');
      if (action === 'escape')
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      else if (action === 'close')
        sheet.querySelector<HTMLButtonElement>('.nl-dialog__close')!.click();
      else buttons[action === 'home' ? 0 : 1]!.click();
      expect(sheet.hasAttribute('open')).toBe(false);
      expect(onNewGame).toHaveBeenCalledTimes(action === 'new' ? 1 : 0);
      expect(onReturnHome).toHaveBeenCalledTimes(action === 'home' ? 1 : 0);
      expect(onClose).toHaveBeenCalledTimes(action === 'close' || action === 'escape' ? 1 : 0);
      expect(document.activeElement).toBe(opener);
    },
  );
});
