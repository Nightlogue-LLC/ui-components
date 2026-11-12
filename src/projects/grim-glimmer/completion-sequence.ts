import { SHEET_MOTION } from '../../core/motion.js';
import { openDialog, destroyDialog } from '../../components/dialog/index.js';
import { createCompletionSheet, type CompletionSheetOptions } from './completion-sheet.js';

export const COMPLETION_TIMING = {
  celebration: 600,
  sheet: 700,
  stats: 700 + SHEET_MOTION.duration,
  stagger: 60,
  statDuration: 180,
} as const;
export interface CompletionSequenceOptions extends CompletionSheetOptions {
  host: HTMLElement;
  board: HTMLElement;
  size: number;
  reducedMotion?: boolean;
  history?: boolean;
  /** Optional app modal presenter; this controller still owns terminal disposal. */
  present?: (sheet: HTMLDialogElement) => void;
}

/** One visual sequence per real completion. Never writes a game result or emits haptics. */
export function createCompletionSequence(options: CompletionSequenceOptions) {
  if (!Number.isInteger(options.size) || options.size < 1)
    throw new Error('Completion size must be a positive integer');
  const grid = options.board.querySelector<HTMLElement>('.nl-grim-glimmer-board');
  if (grid?.children.length !== options.size * options.size)
    throw new Error('Completion board must match its size');
  let started = false;
  let stopped = false;
  let disposed = false;
  let enabled = options.animations !== false;
  let sheet: HTMLDialogElement | undefined;
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const animations = new Set<Animation>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const decorations = new Set<HTMLElement>();
  const reduced = () => !enabled || options.reducedMotion === true || media?.matches === true;
  const current = () =>
    started && !stopped && !disposed && options.host.isConnected && options.board.isConnected;
  const movable = () => !reduced() && !document.hidden && typeof grid.animate === 'function';
  function clearMotion() {
    timers.forEach(clearTimeout);
    timers.clear();
    animations.forEach((job) => job.cancel());
    animations.clear();
    decorations.forEach((node) => node.remove());
    decorations.clear();
    if (sheet) delete sheet.dataset.statsPending;
  }
  function schedule(callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (current()) callback();
    }, delay);
    timers.add(timer);
  }
  function animate(node: HTMLElement, frames: Keyframe[], timing: KeyframeAnimationOptions) {
    if (!current() || !movable() || typeof node.animate !== 'function') return;
    const job = node.animate(frames, { fill: 'both', ...timing });
    animations.add(job);
    void job.finished.then(
      () => {
        if (animations.delete(job)) job.cancel();
      },
      () => animations.delete(job),
    );
  }
  function decoration(className: string, parent: HTMLElement) {
    const node = document.createElement('span');
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    parent.append(node);
    decorations.add(node);
    return node;
  }
  function celebrate() {
    const marks = [...grid!.children].filter((cell) =>
      cell.classList.contains('nl-grim-glimmer-board__cell--placed'),
    ) as HTMLElement[];
    const links = decoration('gg-v4-victory-links', options.board);
    const points = marks.map((cell) => {
      const index = [...grid!.children].indexOf(cell);
      return {
        x: ((index % options.size) + 0.5) / options.size,
        y: (Math.floor(index / options.size) + 0.5) / options.size,
      };
    });
    // Place links in the grid coordinate system without adding a non-cell child to the grid.
    const gridBox = grid!.getBoundingClientRect(),
      boardBox = options.board.getBoundingClientRect();
    links.style.inset = 'auto';
    links.style.left = `${gridBox.left - boardBox.left}px`;
    links.style.top = `${gridBox.top - boardBox.top}px`;
    links.style.width = `${gridBox.width}px`;
    links.style.height = `${gridBox.height}px`;
    points.slice(1).forEach((point, index) => {
      const from = points[index]!;
      const length = Math.hypot(point.x - from.x, point.y - from.y);
      const angle = (Math.atan2(point.y - from.y, point.x - from.x) * 180) / Math.PI;
      const line = decoration('gg-v4-victory-link', links);
      line.style.cssText = `left:calc(${from.x * 100}% + ${0.5 - from.x}px);top:calc(${from.y * 100}% + ${0.5 - from.y}px);width:calc(${length * 100}% - ${length}px);transform:rotate(${angle}deg);`;
      animate(
        line,
        [
          { transform: `rotate(${angle}deg) scaleX(0)` },
          { transform: `rotate(${angle}deg) scaleX(1)` },
        ],
        {
          duration: 200,
          delay: (index / Math.max(1, points.length - 2)) * 400,
          easing: 'ease-out',
        },
      );
    });
    marks.forEach((mark, index) => {
      const glow = decoration('gg-v4-victory-glow', mark);
      animate(
        glow,
        [
          { transform: 'scale(.85)', opacity: 0 },
          { transform: 'scale(1.2)', opacity: 0.55 },
          { transform: 'scale(1)', opacity: 0 },
        ],
        {
          duration: 280,
          delay: (index / Math.max(1, marks.length - 1)) * 320,
          easing: 'ease-in-out',
        },
      );
    });
    schedule(() => {
      animations.forEach((job) => job.cancel());
      animations.clear();
      decorations.forEach((node) => node.remove());
      decorations.clear();
    }, COMPLETION_TIMING.celebration);
  }
  function outcome(callback: () => void) {
    if (!current()) return;
    stopped = true;
    clearMotion();
    detach();
    callback();
  }
  function showSheet() {
    if (!current() || sheet) return;
    clearMotion();
    sheet = createCompletionSheet({
      ...options,
      animations: !reduced(),
      onNewGame: () => outcome(options.onNewGame),
      onReturnHome: () => outcome(options.onReturnHome),
      onClose: () => outcome(options.onClose),
      extraAction: options.extraAction
        ? {
            label: options.extraAction.label,
            onSelect: () => outcome(options.extraAction!.onSelect),
          }
        : undefined,
    });
    sheet.addEventListener('cancel', clearMotion, { capture: true });
    sheet.addEventListener(
      'click',
      (event) => {
        if (event.target instanceof Element && event.target.closest('button')) clearMotion();
      },
      { capture: true },
    );
    options.host.append(sheet);
    if (movable()) sheet.dataset.statsPending = 'true';
    if (options.present) options.present(sheet);
    else openDialog(sheet, { history: options.history ?? false });
    if (movable())
      schedule(() => {
        if (!sheet?.open) return;
        delete sheet.dataset.statsPending;
        sheet.querySelectorAll<HTMLElement>('.gg-v4-stat').forEach((stat, index) =>
          animate(
            stat,
            [
              { transform: 'translateY(6px)', opacity: 0 },
              { transform: 'translateY(0)', opacity: 1 },
            ],
            {
              duration: COMPLETION_TIMING.statDuration,
              delay: index * COMPLETION_TIMING.stagger,
              easing: 'ease-out',
            },
          ),
        );
      }, SHEET_MOTION.duration);
  }
  function preference() {
    if (!current() || !reduced()) return;
    clearMotion();
    if (sheet) sheet.getAnimations?.().forEach((job) => job.cancel());
    else showSheet();
  }
  function cancel() {
    stopped = true;
    clearMotion();
    detach();
    if (sheet) {
      destroyDialog(sheet);
      sheet = undefined;
    }
  }
  function visibility() {
    if (document.hidden) cancel();
  }
  function resize() {
    clearMotion();
    if (current() && !sheet) showSheet();
  }
  function route() {
    cancel();
  }
  function back() {
    if (!sheet) cancel();
    else clearMotion();
  }
  const removal = new MutationObserver(() => {
    if (!options.host.isConnected || !options.board.isConnected) dispose();
  });
  function detach() {
    media?.removeEventListener('change', preference);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('hashchange', route);
    window.removeEventListener('popstate', back);
    window.removeEventListener('resize', resize);
    removal.disconnect();
  }
  function dispose() {
    if (disposed) return;
    cancel();
    disposed = true;
  }
  return {
    start({ celebration = true }: { celebration?: boolean } = {}) {
      if (started || stopped || disposed) return;
      started = true;
      if (!current() || document.hidden) {
        cancel();
        return;
      }
      options.board.classList.add('gg-v4-victory-board');
      media?.addEventListener('change', preference);
      document.addEventListener('visibilitychange', visibility);
      window.addEventListener('hashchange', route);
      window.addEventListener('popstate', back);
      window.addEventListener('resize', resize);
      removal.observe(document.documentElement, { childList: true, subtree: true });
      if (celebration && movable()) {
        celebrate();
        schedule(showSheet, COMPLETION_TIMING.sheet);
      } else showSheet();
    },
    cancel,
    dispose,
    setAnimations(value: boolean) {
      if (disposed || stopped) return;
      enabled = value;
      preference();
    },
  };
}
