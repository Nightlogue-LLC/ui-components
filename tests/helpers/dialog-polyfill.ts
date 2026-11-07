/**
 * jsdom has no <dialog> methods. This test-only polyfill mimics the native behavior our Dialog
 * relies on (per the HTML spec): showModal() sets `open`; close() clears it and fires an
 * asynchronous `close` event; pressing Escape fires a cancelable `cancel` event and closes only
 * if it was not prevented. Real-browser behavior is verified separately (see docs).
 */
type Proto = HTMLElement & {
  showModal?: () => void;
  close?: () => void;
};

export function installDialogPolyfill(): () => void {
  const proto = HTMLElement.prototype as Proto;
  proto.showModal = function (this: HTMLElement) {
    if (this.hasAttribute('open')) throw new Error('InvalidStateError: already open');
    this.setAttribute('open', '');
    const focusable = this.querySelector<HTMLElement>('button, [href], input, [tabindex]');
    focusable?.focus(); // native showModal focuses the first focusable descendant
  };
  proto.close = function (this: HTMLElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    queueMicrotask(() => this.dispatchEvent(new Event('close')));
  };
  return () => {
    delete proto.showModal;
    delete proto.close;
  };
}

/** Simulates the Escape key on an open modal dialog, as a browser does. */
export function pressEscapeOn(dialog: HTMLElement): { prevented: boolean } {
  const cancel = new Event('cancel', { cancelable: true });
  dialog.dispatchEvent(cancel);
  if (!cancel.defaultPrevented) (dialog as Proto).close?.();
  return { prevented: cancel.defaultPrevented };
}

/** Lets queued microtasks (such as the async `close` event) run. */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
