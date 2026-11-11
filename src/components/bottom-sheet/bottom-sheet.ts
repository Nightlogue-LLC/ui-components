import { attachEditorialSheetGesture } from './editorial-gesture.js';
import { createDialog, closeDialog, destroyDialog, type DialogOptions } from '../dialog/index.js';

export interface BottomSheetOptions extends DialogOptions {
  /** Opt-in accepted handle gesture. Project CSS owns its editorial skin. */
  presentation?: 'editorial';
  /** Honor the app animation preference in addition to reduced motion. Default true. */
  animations?: boolean;
  /** Swipe the handle down to dismiss on mobile. Default true for dismissible sheets. */
  swipeToDismiss?: boolean;
}

const cleanup = new WeakMap<HTMLDialogElement, () => void>();

/** Native modal semantics, shared dialog slots, mobile sheet and desktop dialog placement. */
export function createBottomSheet(options: BottomSheetOptions): HTMLDialogElement {
  const sheet = createDialog({ ...options, motion: 'sheet' });
  sheet.classList.add('nl-bottom-sheet');
  if (options.presentation === 'editorial') sheet.classList.add('nl-bottom-sheet--editorial');
  sheet.dataset.animations = options.animations === false ? 'off' : 'on';
  for (const part of ['panel', 'header', 'title', 'body', 'actions', 'close']) {
    sheet.querySelector(`.nl-dialog__${part}`)?.classList.add(`nl-bottom-sheet__${part}`);
  }
  const handle = document.createElement('div');
  handle.className = 'nl-bottom-sheet__handle';
  handle.setAttribute('aria-hidden', 'true');
  sheet.querySelector('.nl-bottom-sheet__panel')!.prepend(handle);
  if (
    options.presentation === 'editorial' &&
    options.dismissible !== false &&
    options.swipeToDismiss !== false
  ) {
    cleanup.set(sheet, attachEditorialSheetGesture(sheet, options.animations !== false));
  } else if (options.dismissible !== false && options.swipeToDismiss !== false) {
    let start: { id: number; x: number; y: number } | undefined;
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !window.matchMedia('(max-width: 47.99rem)').matches) return;
      start = { id: event.pointerId, x: event.clientX, y: event.clientY };
      handle.setPointerCapture?.(event.pointerId);
    });
    handle.addEventListener('pointerup', (event) => {
      const origin = start;
      start = undefined;
      if (origin?.id !== event.pointerId) return;
      const dy = event.clientY - origin.y;
      if (dy > 56 && dy > Math.abs(event.clientX - origin.x) * 1.5) closeDialog(sheet);
    });
    handle.addEventListener('pointercancel', () => {
      start = undefined;
    });
    sheet.addEventListener('close', () => {
      start = undefined;
    });
  }
  return sheet;
}

/** Terminal teardown without emitting an app close outcome. */
export function destroyBottomSheet(sheet: HTMLDialogElement): void {
  cleanup.get(sheet)?.();
  cleanup.delete(sheet);
  destroyDialog(sheet);
}
