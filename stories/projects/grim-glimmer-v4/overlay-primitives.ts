import { createBottomSheet } from '../../../src/components/bottom-sheet/index.js';
import { closeDialog, type DialogOptions } from '../../../src/components/dialog/index.js';
import { SHEET_MOTION } from '../../../src/core/motion.js';
import { el } from '../../lib/dom.js';
import './overlays.css';
export function createSwitch(label: string, checked: boolean, change: (value: boolean) => void) {
  const row = el('label', { className: 'gg-v4-preference-row' });
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.setAttribute('role', 'switch');
  const target = el('span', { className: 'gg-v4-switch-target' });
  const track = el('span', { className: 'gg-v4-switch-track' }, [
    el('span', { className: 'gg-v4-switch-thumb' }),
  ]);
  track.setAttribute('aria-hidden', 'true');
  input.addEventListener('change', () => change(input.checked));
  target.append(input, track);
  row.append(el('span', { text: label }), target);
  return row;
}
export interface SheetProposal {
  dialog: HTMLDialogElement;
  destroy: () => void;
}
/** Additive story facade over the actual Nightlogue sheet; production defaults stay intact. */
export function createProposalSheet(options: DialogOptions): SheetProposal {
  let rebound: Animation | undefined;
  let drag: { id: number; y: number; time: number } | undefined;
  const sheet = createBottomSheet({ ...options, swipeToDismiss: false });
  sheet.classList.add('gg-v4-proposal-sheet');
  const panel = sheet.querySelector<HTMLElement>('.nl-bottom-sheet__panel')!;
  const handle = sheet.querySelector<HTMLElement>('.nl-bottom-sheet__handle')!;
  function release() {
    const id = drag?.id;
    drag = undefined;
    if (id !== undefined && handle.hasPointerCapture?.(id)) handle.releasePointerCapture(id);
  }
  function snap() {
    const from = panel.style.transform;
    release();
    rebound?.cancel();
    if (
      from &&
      options.animations !== false &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches &&
      typeof panel.animate === 'function'
    ) {
      const current = panel.animate([{ transform: from }, { transform: 'translateY(0)' }], {
        duration: 180,
        easing: SHEET_MOTION.easing,
      });
      rebound = current;
      void current.finished.then(
        () => {
          if (rebound === current) {
            panel.style.transform = '';
            rebound = undefined;
          }
        },
        () => undefined,
      );
    } else panel.style.transform = '';
  }
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || options.dismissible === false) return;
    rebound?.cancel();
    rebound = undefined;
    panel.style.transform = '';
    drag = { id: event.pointerId, y: event.clientY, time: event.timeStamp };
    if (event.isTrusted) handle.setPointerCapture?.(event.pointerId);
  });
  handle.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    const delta = event.clientY - drag.y;
    panel.style.transform = `translateY(${delta >= 0 ? delta : delta * 0.1}px)`;
  });
  handle.addEventListener('pointerup', (event) => {
    if (drag?.id !== event.pointerId) return;
    const delta = event.clientY - drag.y;
    const velocity = (delta / Math.max(1, event.timeStamp - drag.time)) * 1000;
    if (delta > 120 || (delta >= 24 && velocity > 500)) {
      panel.style.transform = `translateY(${Math.max(0, delta)}px)`;
      release();
      closeDialog(sheet);
    } else snap();
  });
  handle.addEventListener('pointercancel', snap);
  handle.addEventListener('lostpointercapture', () => {
    if (drag) snap();
  });
  sheet.addEventListener('close', () => {
    rebound?.cancel();
    rebound = undefined;
    release();
    panel.style.transform = '';
  });
  return {
    dialog: sheet,
    destroy: () => {
      rebound?.cancel();
      release();
      closeDialog(sheet);
      sheet.getAnimations?.().forEach((animation) => animation.cancel());
    },
  };
}
class OverlayHost extends HTMLElement {
  cleanup?: () => void;
  disconnectedCallback() {
    this.cleanup?.();
  }
}
if (!customElements.get('gg-v4-overlay-host'))
  customElements.define('gg-v4-overlay-host', OverlayHost);
export function overlayHost() {
  const root = document.createElement('gg-v4-overlay-host') as OverlayHost;
  root.className = 'gg-v4-overlay-stage gg-v4-scope';
  return root;
}
