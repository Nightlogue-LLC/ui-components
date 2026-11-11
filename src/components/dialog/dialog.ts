import { createIcon } from '../icon/index.js';
import { createIconButton } from '../icon-button/index.js';
import { animateSheet } from '../../core/motion.js';
import { uniqueId } from '../../core/id.js';

export type DialogCloseReason = 'close-button' | 'escape' | 'backdrop' | 'programmatic';

export interface DialogOptions {
  /** Visible heading; also the dialog's accessible name (via aria-labelledby). */
  title: string;
  /** Shared sheet motion; ordinary dialogs retain their approved presentation. */
  motion?: 'sheet';
  animations?: boolean;
  /**
   * Whether the user may dismiss it (close button, Escape, backdrop click). Default true.
   * Use `false` for compulsory choices: the dialog then closes only through `closeDialog`.
   */
  dismissible?: boolean;
  /** Accessible name of the close button. Default "Close". Provide a translation if needed. */
  closeLabel?: string;
  /** Called once, after the dialog has closed, with why it closed. */
  onClose?: (reason: DialogCloseReason) => void;
}

interface State {
  destroyed?: boolean;
  pendingNotification?: () => void;
  dismissible: boolean;
  motion?: 'sheet';
  animations?: boolean;
  animation?: Animation;
  closing?: boolean;
  releaseHistory?: () => boolean;
  onClose: ((reason: DialogCloseReason) => void) | undefined;
  /** Reason set by our own close paths, consumed by the close handler. */
  pendingReason: DialogCloseReason | undefined;
  returnFocus: Element | null;
  /** True when the current click began on the backdrop (guards drag-out-of-content clicks). */
  downOnBackdrop: boolean;
  fallbackKeydown: ((event: KeyboardEvent) => void) | undefined;
}

const states = new WeakMap<HTMLDialogElement, State>();

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Creates a modal dialog on the native `<dialog>` element. It is created closed and detached:
 * append content with `getDialogBody()` / `getDialogActions()`, put the dialog inside your themed
 * container (so it inherits the theme), then call `openDialog()`.
 *
 * Dismissal: close button, Escape and backdrop click are each honored only when `dismissible`.
 * No global listeners remain after it closes, and nothing here touches game or keyboard controls.
 */
export function createDialog(options: DialogOptions): HTMLDialogElement {
  const { title, dismissible = true, closeLabel = 'Close', onClose } = options;

  const dialog = document.createElement('dialog');
  dialog.classList.add('nl-dialog');
  const titleId = uniqueId('nl-dialog-title');
  dialog.setAttribute('aria-labelledby', titleId);

  const state: State = {
    dismissible,
    motion: options.motion,
    animations: options.animations,
    onClose,
    pendingReason: undefined,
    returnFocus: null,
    downOnBackdrop: false,
    fallbackKeydown: undefined,
  };
  states.set(dialog, state);

  const heading = document.createElement('h2');
  heading.className = 'nl-dialog__title';
  heading.id = titleId;
  heading.textContent = title;

  const header = document.createElement('div');
  header.className = 'nl-dialog__header';
  header.append(heading);

  if (dismissible) {
    const close = createIconButton({ label: closeLabel, icon: createIcon('close') });
    close.classList.add('nl-dialog__close');
    close.addEventListener('click', () => finish(dialog, 'close-button'));
    header.append(close);
  }

  const body = document.createElement('div');
  body.className = 'nl-dialog__body';
  const actions = document.createElement('div');
  actions.className = 'nl-dialog__actions';

  const panel = document.createElement('div');
  panel.className = 'nl-dialog__panel';
  panel.append(header, body, actions);
  dialog.append(panel);

  // Escape. Always cancel the browser's own close so WE decide (and know the reason).
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (state.dismissible) finish(dialog, 'escape');
  });

  // Backdrop clicks target the <dialog> itself (the panel fills it, so content clicks never do).
  // Require the press to have started on the backdrop too, so dragging a text selection out of
  // the content and releasing over the backdrop does not dismiss.
  dialog.addEventListener('pointerdown', (event) => {
    state.downOnBackdrop = event.target === dialog;
  });
  dialog.addEventListener('click', (event) => {
    const fromBackdrop = event.target === dialog && state.downOnBackdrop;
    state.downOnBackdrop = false;
    if (fromBackdrop && state.dismissible) finish(dialog, 'backdrop');
  });

  // Native close (fires asynchronously after dialog.close()).
  dialog.addEventListener('close', () => {
    if (state.destroyed) return;
    const reason = state.pendingReason;
    state.pendingReason = undefined;
    if (reason) {
      complete(dialog, reason);
    } else if (state.dismissible) {
      complete(dialog, 'escape'); // the browser closed it on its own (e.g. a second Escape)
    } else if (typeof dialog.showModal === 'function' && dialog.isConnected) {
      dialog.showModal(); // a compulsory dialog must not be closable by the browser: reopen
    }
  });

  return dialog;
}

/** Container for the dialog's main content. Append arbitrary DOM here (never innerHTML). */
export function getDialogBody(dialog: HTMLDialogElement): HTMLElement {
  return part(dialog, '.nl-dialog__body');
}

/** Container for the dialog's action buttons (hidden while empty). */
export function getDialogActions(dialog: HTMLDialogElement): HTMLElement {
  return part(dialog, '.nl-dialog__actions');
}

function part(dialog: HTMLDialogElement, selector: string): HTMLElement {
  const found = dialog.querySelector<HTMLElement>(selector);
  if (!found) throw new Error('Not a dialog made by createDialog');
  return found;
}

/** Opens the dialog modally. It must already be attached to the document. No-op if open. */
export function openDialog(dialog: HTMLDialogElement, options: { history?: boolean } = {}): void {
  const state = stateOf(dialog);
  if (state.destroyed) throw new Error('Cannot open a destroyed dialog');
  if (dialog.hasAttribute('open')) return;
  if (!dialog.isConnected) {
    throw new Error(
      'openDialog: append the dialog to the document (inside your themed container) first.',
    );
  }
  state.returnFocus = document.activeElement;
  if (options.history) {
    const marker = uniqueId('nl-modal-history');
    let entry = true;
    const back = () => {
      if (!state.dismissible) {
        window.history.pushState({ ...window.history.state, nlModal: marker }, '');
        return;
      }
      entry = false;
      finish(dialog, 'escape');
    };
    try {
      window.history.pushState({ ...window.history.state, nlModal: marker }, '');
      window.addEventListener('popstate', back);
      state.releaseHistory = () => {
        window.removeEventListener('popstate', back);
        const consume =
          entry && (window.history.state as { nlModal?: string } | null)?.nlModal === marker;
        entry = false;
        if (consume) window.history.back();
        return consume;
      };
    } catch {
      /* History can be unavailable in embedded previews. */
    }
  }

  if (state.motion === 'sheet') dialog.dataset.nlEntering = 'true';
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
    enter(dialog, state);
    return;
  }

  // Fallback for environments without <dialog>.showModal(): visually modal via CSS, Escape handled
  // here, initial focus set manually. There is no focus trap or `inert` in this path.
  dialog.setAttribute('open', '');
  dialog.setAttribute('aria-modal', 'true');
  dialog.classList.add('nl-dialog--fallback');
  enter(dialog, state);
  state.fallbackKeydown = (event) => {
    if (event.key === 'Escape' && state.dismissible) {
      event.preventDefault();
      finish(dialog, 'escape');
    }
  };
  document.addEventListener('keydown', state.fallbackKeydown);
  const target =
    dialog.querySelector<HTMLElement>('[autofocus]') ??
    dialog.querySelector<HTMLElement>(FOCUSABLE);
  if (target) {
    target.focus({ preventScroll: true });
  } else {
    dialog.tabIndex = -1;
    dialog.focus({ preventScroll: true });
  }
}

/** Closes the dialog from app code (works for non-dismissible dialogs too). */
export function closeDialog(dialog: HTMLDialogElement): void {
  finish(dialog, 'programmatic');
}

/** Terminal teardown: removes motion, history/fallback listeners and pending callbacks. */
export function destroyDialog(dialog: HTMLDialogElement): void {
  const state = stateOf(dialog);
  if (state.destroyed) return;
  state.destroyed = true;
  state.pendingReason = undefined;
  state.onClose = undefined;
  state.animation?.cancel();
  state.animation = undefined;
  if (state.fallbackKeydown) document.removeEventListener('keydown', state.fallbackKeydown);
  state.fallbackKeydown = undefined;
  if (state.pendingNotification) window.removeEventListener('popstate', state.pendingNotification);
  state.pendingNotification = undefined;
  state.releaseHistory?.();
  state.releaseHistory = undefined;
  if (dialog.open && typeof dialog.close === 'function') dialog.close();
  dialog.removeAttribute('open');
  delete dialog.dataset.nlEntering;
  dialog.remove();
  const back = state.returnFocus;
  state.returnFocus = null;
  if (back instanceof HTMLElement && back.isConnected) back.focus({ preventScroll: true });
}

function stateOf(dialog: HTMLDialogElement): State {
  const state = states.get(dialog);
  if (!state) throw new Error('Not a dialog made by createDialog');
  return state;
}

function enter(dialog: HTMLDialogElement, state: State): void {
  state.animation?.cancel();
  state.closing = false;
  if (state.motion === 'sheet') {
    state.animation = animateSheet(dialog, 'enter', {
      animations: state.animations,
      placement: 'responsive',
    });
    const current = state.animation;
    current?.finished.then(
      () => {
        if (state.animation === current) {
          current.cancel();
          state.animation = undefined;
          delete dialog.dataset.nlEntering;
        }
      },
      () => undefined,
    );
    if (!current) delete dialog.dataset.nlEntering;
  }
}

function finish(dialog: HTMLDialogElement, reason: DialogCloseReason): void {
  const state = stateOf(dialog);
  if (state.destroyed || !dialog.hasAttribute('open') || state.closing) return;
  state.closing = true;
  state.pendingReason = reason;
  state.animation?.cancel();
  const commit = () => {
    state.animation?.cancel();
    state.animation = undefined;
    if (state.destroyed || !dialog.hasAttribute('open')) return;
    if (typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      dialog.removeAttribute('aria-modal');
      dialog.classList.remove('nl-dialog--fallback');
      state.pendingReason = undefined;
      complete(dialog, reason);
    }
  };
  state.animation =
    state.motion === 'sheet'
      ? animateSheet(dialog, 'exit', { animations: state.animations, placement: 'responsive' })
      : undefined;
  if (state.animation) state.animation.finished.then(commit, commit);
  else commit();
}

function complete(dialog: HTMLDialogElement, reason: DialogCloseReason): void {
  const state = stateOf(dialog);
  if (state.fallbackKeydown) {
    document.removeEventListener('keydown', state.fallbackKeydown);
    state.fallbackKeydown = undefined;
  }
  state.closing = false;
  delete dialog.dataset.nlEntering;
  state.animation?.cancel();
  state.animation = undefined;
  const back = state.returnFocus;
  state.returnFocus = null;
  if (back instanceof HTMLElement && back.isConnected) back.focus({ preventScroll: true });
  const release = state.releaseHistory;
  state.releaseHistory = undefined;
  if (release) {
    const notify = () => {
      state.pendingNotification = undefined;
      if (!state.destroyed) state.onClose?.(reason);
    };
    state.pendingNotification = notify;
    window.addEventListener('popstate', notify, { once: true });
    if (!release()) {
      window.removeEventListener('popstate', notify);
      notify();
    }
  } else state.onClose?.(reason);
}
