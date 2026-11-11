import { closeDialog } from '../dialog/index.js';
import { SHEET_MOTION } from '../../core/motion.js';

/** Handle-only editorial gesture. Content scrolling never participates. */
export function attachEditorialSheetGesture(
  sheet: HTMLDialogElement,
  animations = true,
): () => void {
  const handle = sheet.querySelector<HTMLElement>('.nl-bottom-sheet__handle')!;
  const panel = sheet.querySelector<HTMLElement>('.nl-bottom-sheet__panel')!;
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let rebound: Animation | undefined;
  let drag: { id: number; y: number; time: number } | undefined;
  let destroyed = false;
  function release() {
    const id = drag?.id;
    drag = undefined;
    if (id !== undefined && handle.hasPointerCapture?.(id)) handle.releasePointerCapture(id);
    window.removeEventListener('blur', interrupt);
    window.removeEventListener('resize', interrupt);
    document.removeEventListener('visibilitychange', visibility);
    media?.removeEventListener?.('change', interrupt);
  }
  function interrupt() {
    rebound?.cancel();
    rebound = undefined;
    release();
    panel.style.transform = '';
  }
  const visibility = () => {
    if (document.hidden) interrupt();
  };
  function watchInterruptions() {
    window.addEventListener('blur', interrupt);
    window.addEventListener('resize', interrupt);
    document.addEventListener('visibilitychange', visibility);
    media?.addEventListener?.('change', interrupt);
  }
  function snap() {
    const from = panel.style.transform;
    release();
    rebound?.cancel();
    rebound = undefined;
    panel.style.transform = '';
    if (from && animations && !media?.matches && typeof panel.animate === 'function') {
      const current = panel.animate([{ transform: from }, { transform: 'translateY(0)' }], {
        duration: 180,
        easing: SHEET_MOTION.easing,
      });
      rebound = current;
      watchInterruptions();
      const done = () => {
        if (rebound === current) {
          rebound = undefined;
          current.cancel();
          release();
        }
      };
      void current.finished.then(done, done);
    }
  }
  const down = (event: PointerEvent) => {
    if (
      destroyed ||
      drag ||
      !sheet.open ||
      event.button !== 0 ||
      !window.matchMedia?.('(max-width: 47.99rem)').matches
    )
      return;
    interrupt();
    drag = { id: event.pointerId, y: event.clientY, time: event.timeStamp };
    if (event.isTrusted) handle.setPointerCapture?.(event.pointerId);
    watchInterruptions();
  };
  const move = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    const delta = event.clientY - drag.y;
    panel.style.transform = `translateY(${delta >= 0 ? delta : delta * 0.1}px)`;
  };
  const up = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    const delta = event.clientY - drag.y;
    const velocity = (delta / Math.max(1, event.timeStamp - drag.time)) * 1000;
    if (delta > 120 || (delta >= 24 && velocity > 500)) {
      release();
      panel.style.transform = '';
      closeDialog(sheet);
    } else snap();
  };
  const lost = () => {
    if (drag) snap();
  };
  handle.addEventListener('pointerdown', down);
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', up);
  handle.addEventListener('pointercancel', snap);
  handle.addEventListener('lostpointercapture', lost);
  sheet.addEventListener('close', interrupt);
  return () => {
    if (destroyed) return;
    destroyed = true;
    interrupt();
    handle.removeEventListener('pointerdown', down);
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', up);
    handle.removeEventListener('pointercancel', snap);
    handle.removeEventListener('lostpointercapture', lost);
    sheet.removeEventListener('close', interrupt);
    media?.removeEventListener?.('change', interrupt);
  };
}
