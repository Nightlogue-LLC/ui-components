import { afterEach, describe, expect, it, vi } from 'vitest';
import { openDialog } from '../../components/dialog/index.js';
import { createSuccessSheet, createSuccessMessagePicker } from './success-sheet.js';
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

describe('success message bank', () => {
  it('uses only supplied copy and never repeats consecutively', () => {
    const pick = createSuccessMessagePicker(['First', 'Second', 'First', '   ']);
    let previous = pick();
    for (let i = 0; i < 30; i++) {
      const next = pick();
      expect(['First', 'Second']).toContain(next);
      expect(next).not.toBe(previous);
      previous = next;
    }
  });
  it('supports one message and rejects an empty bank', () => {
    const pick = createSuccessMessagePicker([' Only ']);
    expect(pick()).toBe('Only');
    expect(pick()).toBe('Only');
    expect(() => createSuccessMessagePicker([])).toThrow();
    expect(() => createSuccessMessagePicker(['  '])).toThrow();
  });
  it('evaluates dynamic copy once per sheet without changing it on interaction', () => {
    const message = vi.fn(() => '<A new sky>');
    const sheet = createSuccessSheet({
      title: 'Complete',
      message,
      onNewGame: vi.fn(),
      onReturnHome: vi.fn(),
      onClose: vi.fn(),
    });
    document.body.append(sheet);
    openDialog(sheet);
    expect(message).toHaveBeenCalledTimes(1);
    expect(sheet.querySelector('.nl-grim-glimmer-success-sheet__message')!.textContent).toBe(
      '<A new sky>',
    );
    sheet.querySelector<HTMLButtonElement>('.nl-dialog__close')!.click();
    expect(message).toHaveBeenCalledTimes(1);
  });
});
