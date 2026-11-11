import { animateSheet, animatePopover } from '../../core/motion.js';
import { uniqueId } from '../../core/id.js';
import { createIcon } from '../../components/icon/index.js';

export interface GameMenuSheetOptions {
  /** Default sheet keeps its current placement; opt in to the accepted top-right popover. */
  presentation?: 'popover';
  trigger: HTMLButtonElement;
  content: HTMLElement;
  label?: string;
  animations?: () => boolean;
  onOpenChange?: (open: boolean) => void;
  /** Adds one same-URL history entry so Android/browser Back dismisses the sheet first. */
  history?: boolean;
}
export interface GameMenuSheet {
  element: HTMLElement;
  readonly isOpen: boolean;
  open(): void;
  close(afterClose?: () => void): void;
  toggle(): void;
  destroy(): void;
}
const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';
/** A local sheet, below the persistent headers. No native top-layer dialog obscures its toggle. */
export function createGameMenuSheet(options: GameMenuSheetOptions): GameMenuSheet {
  const { trigger, content } = options;
  const root = document.createElement('div');
  root.className = 'nl-grim-glimmer-menu-sheet';
  root.hidden = true;
  const scrim = document.createElement('div');
  scrim.className = 'nl-grim-glimmer-menu-sheet__scrim';
  scrim.setAttribute('aria-hidden', 'true');
  const panel = document.createElement('section');
  panel.className = 'nl-grim-glimmer-menu-sheet__panel';
  panel.id = uniqueId('nl-game-menu');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', options.label ?? 'Game menu');
  panel.tabIndex = -1;
  content.hidden = false;
  content.removeAttribute('role');
  content.removeAttribute('aria-modal');
  const handle = document.createElement('div');
  handle.className = 'nl-grim-glimmer-menu-sheet__handle';
  handle.setAttribute('aria-hidden', 'true');
  panel.append(handle, content);
  root.append(scrim, panel);
  trigger.setAttribute('aria-label', 'Game menu');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', panel.id);
  trigger.setAttribute('aria-expanded', 'false');
  trigger.classList.add('nl-grim-glimmer-menu-toggle');
  const holder = trigger.querySelector('.nl-icon-button__icon') ?? trigger;
  const closed = document.createElement('span');
  closed.className = 'nl-grim-glimmer-menu-toggle__closed';
  closed.append(createIcon('more'));
  const opened = document.createElement('span');
  opened.className = 'nl-grim-glimmer-menu-toggle__opened';
  opened.append(createIcon('close'));
  holder.replaceChildren(closed, opened);
  const popover = options.presentation === 'popover';
  if (popover) {
    root.classList.add('nl-grim-glimmer-menu-sheet--popover');
    handle.remove();
  }
  let active = false;
  let destroyed = false;
  let closing = false;
  let motionDone = true;
  let motionVersion = 0;
  let animation: Animation | undefined;
  let historyEntry = false;
  let pendingHistory = false;
  let historyWaiter: (() => void) | undefined;
  let requestedOpen = false;
  let pendingAction: (() => void) | undefined;
  let pointer: { id: number; x: number; y: number } | undefined;
  let restoreInert: (() => void) | undefined;
  const marker = panel.id;
  const historyEnabled = options.history !== false;
  function finishClose() {
    if (destroyed || active || !motionDone || pendingHistory) return;
    closing = false;
    root.hidden = true;
    observer.disconnect();
    const action = pendingAction;
    pendingAction = undefined;
    action?.();
  }
  const setOpen = (next: boolean, fromHistory = false, afterClose?: () => void) => {
    if (destroyed) return;
    if (pendingHistory) {
      requestedOpen = next;
      pendingAction = next ? undefined : afterClose;
      return;
    }
    if (active === next) {
      if (!next) {
        pendingAction = afterClose;
        finishClose();
      }
      return;
    }
    active = next;
    closing = !next;
    pendingAction = next ? undefined : afterClose;
    animation?.cancel();
    const version = ++motionVersion;
    root.hidden = false;
    root.dataset.closing = String(!next);
    const motion = options.animations?.() !== false;
    root.dataset.animations = motion ? 'on' : 'off';
    trigger.dataset.animations = motion ? 'on' : 'off';
    trigger.setAttribute('aria-expanded', String(next));
    motionDone = false;
    if (next) {
      content.hidden = false;
      observer.observe(document.documentElement, { childList: true, subtree: true });
      const inertNodes = [
        ...(root.parentElement?.querySelectorAll<HTMLElement>(
          ':scope > [data-slot="board"], :scope > [data-slot="controls"], :scope > [data-slot="difficulty"]',
        ) ?? []),
      ];
      const previous = inertNodes.map((node) => node.inert);
      inertNodes.forEach((node) => {
        node.inert = true;
      });
      restoreInert = () =>
        inertNodes.forEach((node, i) => {
          node.inert = previous[i]!;
        });
      if (historyEnabled) {
        try {
          window.history.pushState({ ...window.history.state, nlGameMenu: marker }, '');
          historyEntry = true;
        } catch {
          historyEntry = false;
        }
      }
      document.addEventListener('keydown', keydown);
      window.addEventListener('popstate', popstate);
      (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus({ preventScroll: true });
    } else {
      content.dispatchEvent(new Event('game-menu-close'));
      restoreInert?.();
      restoreInert = undefined;
      document.removeEventListener('keydown', keydown);
      window.removeEventListener('popstate', popstate);
      if (
        !fromHistory &&
        historyEntry &&
        (window.history.state as { nlGameMenu?: unknown } | null)?.nlGameMenu === marker
      ) {
        pendingHistory = true;
        historyWaiter = () => {
          historyWaiter = undefined;
          pendingHistory = false;
          if (destroyed) return;
          if (requestedOpen) {
            requestedOpen = false;
            pendingAction = undefined;
            setOpen(true);
          } else finishClose();
        };
        window.addEventListener('popstate', historyWaiter, { once: true });
        window.history.back();
      }
      historyEntry = false;
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    }
    const animate = popover ? animatePopover : animateSheet;
    const current = animate(panel, next ? 'enter' : 'exit', { animations: motion });
    animation = current;
    const done = () => {
      if (destroyed || version !== motionVersion) return;
      current?.cancel();
      animation = undefined;
      motionDone = true;
      if (!active) finishClose();
    };
    if (current) void current.finished.then(done, done);
    else done();
    options.onOpenChange?.(next);
  };
  function popstate(): void {
    historyEntry = false;
    setOpen(false, true);
  }
  function keydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
    if (event.key !== 'Tab') return;
    const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE), trigger];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.shiftKey
      ? index <= 0
        ? items.length - 1
        : index - 1
      : (index + 1) % items.length;
    event.preventDefault();
    items[next]!.focus({ preventScroll: true });
  }
  const toggle = () => setOpen(pendingHistory ? !requestedOpen : !active);
  trigger.addEventListener('click', toggle);
  scrim.addEventListener('click', () => setOpen(false));
  panel.addEventListener('pointerdown', (event) => {
    if (popover || destroyed) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  panel.addEventListener('pointerup', (event) => {
    if (
      pointer?.id === event.pointerId &&
      event.clientY - pointer.y > 64 &&
      Math.abs(event.clientX - pointer.x) < 64
    )
      setOpen(false);
    pointer = undefined;
  });
  panel.addEventListener('pointercancel', () => {
    pointer = undefined;
  });
  let touch: { x: number; y: number } | undefined;
  panel.addEventListener(
    'touchstart',
    (event) => {
      if (popover || destroyed) return;
      const start = event.touches[0];
      touch = start && panel.scrollTop === 0 ? { x: start.clientX, y: start.clientY } : undefined;
    },
    { passive: true },
  );
  panel.addEventListener(
    'touchmove',
    (event) => {
      const current = event.touches[0];
      if (
        touch &&
        current &&
        current.clientY - touch.y > 64 &&
        Math.abs(current.clientX - touch.x) < 64
      ) {
        if (event.cancelable) event.preventDefault();
        touch = undefined;
        setOpen(false);
      }
    },
    { passive: false },
  );
  panel.addEventListener('touchend', () => {
    touch = undefined;
  });
  panel.addEventListener('touchcancel', () => {
    touch = undefined;
  });

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    motionVersion++;
    pendingAction = undefined;
    requestedOpen = false;
    animation?.cancel();
    animation = undefined;
    observer.disconnect();
    restoreInert?.();
    restoreInert = undefined;
    document.removeEventListener('keydown', keydown);
    window.removeEventListener('popstate', popstate);
    if (historyWaiter) window.removeEventListener('popstate', historyWaiter);
    historyWaiter = undefined;
    pendingHistory = false;
    if (
      historyEntry &&
      (window.history.state as { nlGameMenu?: unknown } | null)?.nlGameMenu === marker
    )
      window.history.back();
    historyEntry = false;
    trigger.removeEventListener('click', toggle);
    trigger.setAttribute('aria-expanded', 'false');
    const wasOpen = active;
    active = false;
    closing = false;
    root.remove();
    if (wasOpen) options.onOpenChange?.(false);
  }
  // Removal during entry, exit or history unwind must suppress queued routes.
  const observer = new MutationObserver(() => {
    if ((active || closing || pendingHistory) && (!trigger.isConnected || !root.isConnected))
      destroy();
  });
  return {
    element: root,
    get isOpen() {
      return active;
    },
    open: () => setOpen(true),
    close: (afterClose) => setOpen(false, false, afterClose),
    toggle,
    destroy,
  };
}
