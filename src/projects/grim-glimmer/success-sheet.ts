import { createBottomSheet } from '../../components/bottom-sheet/index.js';
import { closeDialog, getDialogActions, getDialogBody } from '../../components/dialog/index.js';
import { createButton } from '../../components/button/index.js';

export interface SuccessSheetOptions {
  title: string;
  /** Fixed copy or a message picker, evaluated once for each new success sheet. */
  message: string | (() => string);
  animations?: boolean;
  labels?: { newGame?: string; returnHome?: string; close?: string };
  onNewGame: () => void;
  onReturnHome: () => void;
  /** Dismissal keeps the completed board visible and read-only. */
  onClose: () => void;
}

/** Issue #19 preview; legacy createSuccessDialog stays compatible until app migration. */
export function createSuccessSheet(options: SuccessSheetOptions): HTMLDialogElement {
  let action: 'new' | 'home' | undefined;
  const sheet = createBottomSheet({
    title: options.title,
    closeLabel: options.labels?.close,
    animations: options.animations,
    onClose: () => {
      const outcome = action;
      action = undefined;
      if (outcome === 'new') options.onNewGame();
      else if (outcome === 'home') options.onReturnHome();
      else options.onClose();
    },
  });
  sheet.classList.add('nl-grim-glimmer-success-sheet');
  const star = document.createElement('span');
  star.className = 'nl-grim-glimmer-success-sheet__star';
  star.setAttribute('aria-hidden', 'true');
  const message = document.createElement('p');
  message.className = 'nl-grim-glimmer-success-sheet__message';
  message.textContent = typeof options.message === 'function' ? options.message() : options.message;
  getDialogBody(sheet).append(star, message);
  const newGame = createButton({
    label: options.labels?.newGame ?? 'New Game',
    onClick: () => {
      action = 'new';
      closeDialog(sheet);
    },
  });
  newGame.autofocus = true;
  getDialogActions(sheet).append(
    createButton({
      label: options.labels?.returnHome ?? 'Return Home',
      variant: 'secondary',
      onClick: () => {
        action = 'home';
        closeDialog(sheet);
      },
    }),
    newGame,
  );
  return sheet;
}

/** Keep one picker per message bank in the app; consecutive sheets never repeat a message. */
export function createSuccessMessagePicker(messages: readonly string[]): () => string {
  const bank = [...new Set(messages.map((message) => message.trim()).filter(Boolean))];
  if (bank.length === 0) throw new Error('Success message bank must contain non-empty text.');
  let previous = -1;
  return () => {
    const count = bank.length - (previous >= 0 && bank.length > 1 ? 1 : 0);
    let next = Math.floor(Math.random() * count);
    if (bank.length > 1 && previous >= 0 && next >= previous) next += 1;
    previous = next;
    return bank[next]!;
  };
}
