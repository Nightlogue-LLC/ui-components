import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  flush,
  installDialogPolyfill,
  pressEscapeOn,
} from '../../../tests/helpers/dialog-polyfill.js';
import {
  closeDialog,
  createDialog,
  getDialogActions,
  getDialogBody,
  openDialog,
  type DialogOptions,
} from './dialog.js';

let uninstall: (() => void) | undefined;
afterEach(() => {
  uninstall?.();
  uninstall = undefined;
  document.body.replaceChildren();
});

function mount(options: Partial<DialogOptions> = {}) {
  const onClose = vi.fn();
  const dialog = createDialog({ title: 'Tutorial', onClose, ...options });
  document.body.append(dialog);
  return { dialog, onClose };
}
const isOpen = (d: HTMLElement) => d.hasAttribute('open');
const click = (el: Element) => (el as HTMLElement).click();
const pointerdown = (el: Element) => el.dispatchEvent(new Event('pointerdown', { bubbles: true }));

describe('structure', () => {
  it('links the visible title to the dialog with aria-labelledby', () => {
    const { dialog } = mount({ title: 'How to play' });
    const heading = dialog.querySelector('h2')!;
    expect(heading.textContent).toBe('How to play');
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('sets the title as text, never HTML', () => {
    const { dialog } = mount({ title: '<img src=x onerror=alert(1)>' });
    expect(dialog.querySelector('img')).toBeNull();
  });

  it('has a labelled close button only when dismissible', () => {
    const close = mount({ closeLabel: 'Schließen' }).dialog.querySelector('.nl-dialog__close');
    expect(close?.getAttribute('aria-label')).toBe('Schließen');
    expect(mount({ dismissible: false }).dialog.querySelector('.nl-dialog__close')).toBeNull();
  });

  it('exposes body and actions containers for arbitrary DOM', () => {
    const { dialog } = mount();
    const p = document.createElement('p');
    getDialogBody(dialog).append(p);
    getDialogActions(dialog).append(document.createElement('button'));
    expect(dialog.querySelector('.nl-dialog__body p')).toBe(p);
    expect(dialog.querySelectorAll('.nl-dialog__actions button')).toHaveLength(1);
  });

  it('is created closed, and refuses to open while detached', () => {
    const { dialog } = mount();
    expect(isOpen(dialog)).toBe(false);
    expect(() => openDialog(createDialog({ title: 't' }))).toThrow(/append/);
  });
});

describe('native showModal path', () => {
  beforeEach(() => {
    uninstall = installDialogPolyfill();
  });

  it('opens modally and is idempotent', () => {
    const { dialog } = mount();
    openDialog(dialog);
    openDialog(dialog);
    expect(isOpen(dialog)).toBe(true);
  });

  it('close button closes and reports "close-button" once', async () => {
    const { dialog, onClose } = mount();
    openDialog(dialog);
    click(dialog.querySelector('.nl-dialog__close')!);
    await flush();
    expect(isOpen(dialog)).toBe(false);
    expect(onClose).toHaveBeenCalledExactlyOnceWith('close-button');
  });

  it('Escape: the native cancel is prevented, then we close with reason "escape"', async () => {
    const { dialog, onClose } = mount();
    openDialog(dialog);
    const { prevented } = pressEscapeOn(dialog);
    await flush();
    expect(prevented).toBe(true);
    expect(isOpen(dialog)).toBe(false);
    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape');
  });

  it('Escape does nothing on a non-dismissible dialog', async () => {
    const { dialog, onClose } = mount({ dismissible: false });
    openDialog(dialog);
    const { prevented } = pressEscapeOn(dialog);
    await flush();
    expect(prevented).toBe(true);
    expect(isOpen(dialog)).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a compulsory dialog is reopened if the browser closes it anyway', async () => {
    const { dialog, onClose } = mount({ dismissible: false });
    openDialog(dialog);
    dialog.close(); // e.g. Chrome's close watcher when cancel is not cancelable
    await flush();
    expect(isOpen(dialog)).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a dismissible dialog closed by the browser reports "escape"', async () => {
    const { dialog, onClose } = mount();
    openDialog(dialog);
    dialog.close();
    await flush();
    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape');
  });

  describe('backdrop', () => {
    it('closes when the press and the click both land on the backdrop', async () => {
      const { dialog, onClose } = mount();
      openDialog(dialog);
      pointerdown(dialog);
      click(dialog); // clicks on ::backdrop target the <dialog> itself
      await flush();
      expect(onClose).toHaveBeenCalledExactlyOnceWith('backdrop');
    });

    it('ignores clicks inside the content', async () => {
      const { dialog, onClose } = mount();
      openDialog(dialog);
      const inside = dialog.querySelector('.nl-dialog__body')!;
      pointerdown(inside);
      click(inside);
      await flush();
      expect(isOpen(dialog)).toBe(true);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('ignores a drag that starts in the content and ends on the backdrop', async () => {
      const { dialog, onClose } = mount();
      openDialog(dialog);
      pointerdown(dialog.querySelector('.nl-dialog__body')!);
      click(dialog);
      await flush();
      expect(isOpen(dialog)).toBe(true);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('ignores a synthetic click with no preceding press', async () => {
      const { dialog, onClose } = mount();
      openDialog(dialog);
      click(dialog);
      await flush();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('is ignored on a non-dismissible dialog', async () => {
      const { dialog, onClose } = mount({ dismissible: false });
      openDialog(dialog);
      pointerdown(dialog);
      click(dialog);
      await flush();
      expect(isOpen(dialog)).toBe(true);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('closeDialog works for non-dismissible dialogs and reports "programmatic"', async () => {
    const { dialog, onClose } = mount({ dismissible: false });
    openDialog(dialog);
    closeDialog(dialog);
    await flush();
    expect(isOpen(dialog)).toBe(false);
    expect(onClose).toHaveBeenCalledExactlyOnceWith('programmatic');
  });

  it('closeDialog on a closed dialog is a no-op', async () => {
    const { dialog, onClose } = mount();
    closeDialog(dialog);
    await flush();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('restores focus to the element that opened it', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { dialog } = mount();
    openDialog(dialog);
    expect(document.activeElement).not.toBe(opener);
    closeDialog(dialog);
    await flush();
    expect(document.activeElement).toBe(opener);
  });

  it('can be reopened after closing', async () => {
    const { dialog, onClose } = mount();
    openDialog(dialog);
    closeDialog(dialog);
    await flush();
    openDialog(dialog);
    closeDialog(dialog);
    await flush();
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('fallback path (no showModal)', () => {
  it('opens via the open attribute, marks itself modal, and focuses inside', () => {
    const { dialog } = mount();
    openDialog(dialog);
    expect(isOpen(dialog)).toBe(true);
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.classList.contains('nl-dialog--fallback')).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('honors autofocus on a consumer element (e.g. the safe choice in a confirmation)', () => {
    const { dialog } = mount({ dismissible: false });
    const cancel = document.createElement('button');
    cancel.setAttribute('autofocus', '');
    getDialogActions(dialog).append(document.createElement('button'), cancel);
    openDialog(dialog);
    expect(document.activeElement).toBe(cancel);
  });

  it('Escape closes a dismissible dialog synchronously with "escape"', () => {
    const { dialog, onClose } = mount();
    openDialog(dialog);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(isOpen(dialog)).toBe(false);
    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape');
  });

  it('Escape is ignored on a non-dismissible dialog', () => {
    const { dialog, onClose } = mount({ dismissible: false });
    openDialog(dialog);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(isOpen(dialog)).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('leaves no document listeners behind after closing (does not capture game keys)', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { dialog, onClose } = mount();
    openDialog(dialog);
    closeDialog(dialog);
    const added = add.mock.calls.filter(([type]) => type === 'keydown');
    const removed = remove.mock.calls.filter(([type]) => type === 'keydown');
    expect(added).toHaveLength(1);
    expect(removed).toHaveLength(1);
    expect(removed[0]![1]).toBe(added[0]![1]);
    expect(onClose).toHaveBeenCalledExactlyOnceWith('programmatic');
    add.mockRestore();
    remove.mockRestore();
  });

  it('backdrop and close button work, and focus returns to the opener', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { dialog, onClose } = mount();
    openDialog(dialog);
    click(dialog.querySelector('.nl-dialog__close')!);
    expect(onClose).toHaveBeenLastCalledWith('close-button');
    expect(document.activeElement).toBe(opener);

    openDialog(dialog);
    pointerdown(dialog);
    click(dialog);
    expect(onClose).toHaveBeenLastCalledWith('backdrop');
  });
});
