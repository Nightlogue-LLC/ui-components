import { afterEach, describe, expect, it, vi } from 'vitest';
import { openDialog } from '../../components/dialog/index.js';
import {
  createDiscardConfirmDialog,
  createSuccessDialog,
  createTutorialDialog,
} from './dialogs.js';

// jsdom has no <dialog>.showModal, so these run on the Dialog's documented fallback path.
afterEach(() => document.body.replaceChildren());

const mount = (dialog: HTMLDialogElement) => {
  document.body.append(dialog);
  openDialog(dialog);
  return dialog;
};
const buttons = (dialog: HTMLElement) => [
  ...dialog.querySelectorAll<HTMLButtonElement>('.nl-dialog__actions button'),
];
const names = (dialog: HTMLElement) => buttons(dialog).map((b) => b.textContent);
const isOpen = (d: HTMLElement) => d.hasAttribute('open');
const stepText = (d: HTMLElement) =>
  d.querySelector('.nl-grim-glimmer-tutorial__text')!.textContent;
const cells = (d: HTMLElement) => [
  ...d.querySelectorAll<HTMLButtonElement>('.nl-grim-glimmer-board__cell'),
];

describe('tutorial dialog', () => {
  const make = (onDone = vi.fn(), steps = ['One', 'Two', 'Three']) =>
    mount(createTutorialDialog({ title: 'How to play', steps, boardLabel: 'Demo', onDone }));

  it('shows the first step, a step counter, and a 5x5 interactive demo', () => {
    const dialog = make();
    expect(dialog.querySelector('h2')!.textContent).toBe('How to play');
    expect(stepText(dialog)).toBe('One');
    expect(dialog.querySelector('.nl-grim-glimmer-tutorial__step')!.textContent).toBe(
      'Step 1 of 3',
    );
    expect(cells(dialog)).toHaveLength(25);
    expect(dialog.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(names(dialog)).toEqual(['Skip', 'Continue']);
  });

  it('Continue advances; the last step offers Finish, which closes with "finish"', () => {
    const onDone = vi.fn();
    const dialog = make(onDone);
    buttons(dialog)[1]!.click();
    expect(stepText(dialog)).toBe('Two');
    buttons(dialog)[1]!.click();
    expect(stepText(dialog)).toBe('Three');
    expect(names(dialog)).toEqual(['Skip', 'Finish']);
    buttons(dialog)[1]!.click();
    expect(isOpen(dialog)).toBe(false);
    expect(onDone).toHaveBeenCalledExactlyOnceWith('finish');
  });

  it('Skip closes at any step with "skip"', () => {
    const onDone = vi.fn();
    const dialog = make(onDone);
    buttons(dialog)[1]!.click();
    buttons(dialog)[0]!.click();
    expect(isOpen(dialog)).toBe(false);
    expect(onDone).toHaveBeenCalledExactlyOnceWith('skip');
  });

  it('dismissing another way (Escape) counts as a skip', () => {
    const onDone = vi.fn();
    make(onDone);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onDone).toHaveBeenCalledExactlyOnceWith('skip');
  });

  it('a single-step tutorial goes straight to Finish', () => {
    const dialog = make(vi.fn(), ['Only']);
    expect(names(dialog)).toEqual(['Skip', 'Finish']);
  });

  it('the demo is tappable: empty -> placed -> marked -> empty; given cells never change', () => {
    const dialog = make();
    const first = cells(dialog).find((c) => c.getAttribute('aria-disabled') !== 'true')!;
    const state = () =>
      ['empty', 'placed', 'marked'].find((s) =>
        first.classList.contains(`nl-grim-glimmer-board__cell--${s}`),
      );
    expect(state()).toBe('empty');
    first.click();
    expect(state()).toBe('placed');
    first.click();
    expect(state()).toBe('marked');
    first.click();
    expect(state()).toBe('empty');

    const given = cells(dialog).find((c) => c.getAttribute('aria-disabled') === 'true')!;
    given.click();
    expect(given.classList.contains('nl-grim-glimmer-board__cell--fixed')).toBe(true);
  });

  it('puts initial focus on the primary action and supports translated labels', () => {
    const dialog = mount(
      createTutorialDialog({
        title: 't',
        steps: ['a', 'b'],
        boardLabel: 'd',
        onDone: vi.fn(),
        labels: {
          skip: 'Überspringen',
          next: 'Weiter',
          finish: 'Fertig',
          step: (n, t) => `Schritt ${n}/${t}`,
        },
      }),
    );
    expect(names(dialog)).toEqual(['Überspringen', 'Weiter']);
    expect(dialog.querySelector('.nl-grim-glimmer-tutorial__step')!.textContent).toBe(
      'Schritt 1/2',
    );
    expect(document.activeElement).toBe(buttons(dialog)[1]);
  });

  it('requires at least one step', () => {
    expect(() =>
      createTutorialDialog({ title: 't', steps: [], boardLabel: 'b', onDone: vi.fn() }),
    ).toThrow();
  });
});

describe('success dialog', () => {
  const make = () => {
    const onPlayAgain = vi.fn();
    const onClose = vi.fn();
    const dialog = mount(
      createSuccessDialog({ title: 'Solved', message: 'Well done.', onPlayAgain, onClose }),
    );
    return { dialog, onPlayAgain, onClose };
  };

  it('is concise, has Play Again / Close, and a decorative accent', () => {
    const { dialog } = make();
    expect(dialog.querySelector('.nl-grim-glimmer-success__message')!.textContent).toBe(
      'Well done.',
    );
    expect(
      dialog.querySelector('.nl-grim-glimmer-success__accent')!.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(names(dialog)).toEqual(['Close', 'Play Again']);
    expect(document.activeElement).toBe(buttons(dialog)[1]);
  });

  it('Play Again closes and reports only onPlayAgain', () => {
    const { dialog, onPlayAgain, onClose } = make();
    buttons(dialog)[1]!.click();
    expect(isOpen(dialog)).toBe(false);
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    ['the Close button', (d: HTMLElement) => buttons(d)[0]!.click()],
    [
      'the X button',
      (d: HTMLElement) => d.querySelector<HTMLButtonElement>('.nl-dialog__close')!.click(),
    ],
    ['Escape', () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))],
  ])('closing with %s reports only onClose', (_name, close) => {
    const { dialog, onPlayAgain, onClose } = make();
    close(dialog);
    expect(isOpen(dialog)).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPlayAgain).not.toHaveBeenCalled();
  });
});

describe('discard confirmation dialog', () => {
  const make = () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const dialog = mount(
      createDiscardConfirmDialog({
        title: 'Start a new game?',
        message: 'Your progress will be lost.',
        confirmLabel: 'Discard and start new',
        onConfirm,
        onCancel,
      }),
    );
    return { dialog, onConfirm, onCancel };
  };

  it('is compulsory (no close button), names the consequence, and focuses the safe choice', () => {
    const { dialog } = make();
    expect(dialog.querySelector('.nl-dialog__close')).toBeNull();
    expect(names(dialog)).toEqual(['Cancel', 'Discard and start new']);
    expect(document.activeElement).toBe(buttons(dialog)[0]);
  });

  it('Escape does nothing: the user must choose', () => {
    const { dialog, onConfirm, onCancel } = make();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(isOpen(dialog)).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('Cancel closes and reports only onCancel', () => {
    const { dialog, onConfirm, onCancel } = make();
    buttons(dialog)[0]!.click();
    expect(isOpen(dialog)).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Confirm closes and reports only onConfirm', () => {
    const { dialog, onConfirm, onCancel } = make();
    buttons(dialog)[1]!.click();
    expect(isOpen(dialog)).toBe(false);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
