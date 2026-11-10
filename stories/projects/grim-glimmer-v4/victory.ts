import {
  createSuccessSheet,
  createSuccessMessagePicker,
} from '../../../src/projects/grim-glimmer/success-sheet.js';
import { openDialog, closeDialog, getDialogBody } from '../../../src/components/dialog/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { createV4Board, fixture, type Size } from './board.js';
import { SHEET_MOTION } from '../../../src/core/motion.js';
import { el } from '../../lib/dom.js';
import './victory.css';

export const VICTORY_TIMING = {
  celebration: 600,
  sheet: 700,
  stats: 700 + SHEET_MOTION.duration,
  stagger: 60,
  statDuration: 180,
} as const;
export const VICTORY_MESSAGES = [
  'Every star is in place.',
  'A little order beneath the night.',
  'The spires have found their stars.',
] as const;
export interface VictoryOptions {
  size?: 6 | 15;
  reducedMotion?: boolean;
  haptics?: boolean;
  success?: () => void;
  message?: string;
  messageMode?: 'fixed' | 'bank';
  messages?: readonly string[];
  showStats?: boolean;
  time?: string;
  hints?: number;
  mistakes?: number;
  tryMedium?: boolean;
  onHome?: () => void;
  onNext?: () => void;
  onMedium?: () => void;
  onDismiss?: () => void;
}
function statistics(options: VictoryOptions) {
  const root = el('p', { className: 'gg-v4-victory-stats' });
  const values = [
    `TIME ${options.time ?? '02:14'}`,
    `HINTS ${options.hints ?? 0}`,
    `MISTAKES ${options.mistakes ?? 1}`,
  ];
  root.setAttribute('aria-label', values.join(', '));
  values.forEach((value, index) => {
    if (index) {
      const dot = el('span', { text: '·', className: 'gg-v4-stat-separator' });
      dot.setAttribute('aria-hidden', 'true');
      root.append(dot);
    }
    const stat = el('span', { className: 'gg-v4-stat', text: value });
    stat.setAttribute('aria-hidden', 'true');
    root.append(stat);
  });
  return root;
}
/** Reuses the shipped completion API; only this proposed composition changes. */
export function createVictorySheet(
  options: VictoryOptions,
  message: string | (() => string),
  dismissed?: () => void,
) {
  let medium = false;
  const sheet = createSuccessSheet({
    title: 'Puzzle Complete',
    message,
    animations: options.reducedMotion !== true,
    labels: { newGame: 'Next Puzzle', returnHome: 'Return Home', close: 'Close completion' },
    onNewGame: () => {
      medium = false;
      dismissed?.();
      options.onNext?.();
    },
    onReturnHome: () => {
      medium = false;
      dismissed?.();
      options.onHome?.();
    },
    onClose: () => {
      const chosen = medium;
      medium = false;
      dismissed?.();
      if (chosen) options.onMedium?.();
      else options.onDismiss?.();
    },
  });
  sheet.classList.add('gg-v4-victory-sheet');
  sheet.querySelector('.nl-bottom-sheet__handle')?.remove();
  sheet.querySelector('.nl-grim-glimmer-success-sheet__star')?.remove();
  const body = getDialogBody(sheet);
  const rule = el('div', { className: 'gg-v4-victory-rule' }, [el('span', { text: '✦' })]);
  rule.setAttribute('aria-hidden', 'true');
  body.prepend(rule);
  if (options.showStats !== false) rule.after(statistics(options));
  if (options.tryMedium)
    body.append(
      createButton({
        label: 'Try Medium →',
        variant: 'ghost',
        size: 'sm',
        onClick: () => {
          medium = true;
          closeDialog(sheet);
        },
      }),
    );
  return sheet;
}
export function solvedCells(size: Size) {
  return fixture(size).map((state, index) =>
    state === 'fixed' ? state : index % (size + 2) === 0 ? 'placed' : 'empty',
  );
}
function solvedBoard(size: 6 | 15) {
  const board = createV4Board({
    size,
    cells: solvedCells(size),
    interactive: false,
    hint: false,
    conflict: false,
    rowStates: Array.from({ length: size }, () => 'satisfied' as const),
    columnStates: Array.from({ length: size }, () => 'satisfied' as const),
  });
  board.classList.add('gg-v4-victory-board');
  board.setAttribute(
    'aria-label',
    'Illustrative solved-board presentation; not a validated puzzle',
  );
  return board;
}
class VictoryHost extends HTMLElement {
  cleanup?: () => void;
  disconnectedCallback() {
    this.cleanup?.();
  }
}
if (!customElements.get('gg-v4-victory-host'))
  customElements.define('gg-v4-victory-host', VictoryHost);
export function createVictoryPreview(
  options: VictoryOptions = {},
  mode: 'sheet' | 'solved' | 'sequence' = 'sequence',
) {
  const size = options.size ?? 6;
  const root = document.createElement('gg-v4-victory-host') as VictoryHost;
  root.className = 'gg-v4-victory-stage gg-v4-scope';
  root.dataset.solved = String(mode === 'solved');
  const title = el('h1', { text: 'Stars & Spires' });
  const chip = el('span', { className: 'gg-v4-solved-chip', text: 'Solved' });
  chip.hidden = mode !== 'solved';
  const subtitle = el(
    'p',
    { className: 'gg-v4-victory-subtitle', text: `EASY · ${size}×${size} ` },
    [chip],
  );
  const board = solvedBoard(size);
  const well = el('div', { className: 'gg-v4-victory-well' }, [board]);
  const status = el('p', {
    className: 'gg-v4-victory-status',
    text:
      mode === 'solved' ? 'Solved preview · read-only' : 'Replay the proposed completion sequence.',
  });
  status.setAttribute('role', 'status');
  const bank = createSuccessMessagePicker(options.messages ?? VICTORY_MESSAGES);
  const animations = new Set<Animation>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let sheet: HTMLDialogElement | undefined;
  let generation = 0;
  let disposed = false;
  const reduced = () =>
    options.reducedMotion === true ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  function clearMotion() {
    timers.forEach(clearTimeout);
    timers.clear();
    animations.forEach((animation) => animation.cancel());
    animations.clear();
    board
      .querySelectorAll('.gg-v4-victory-links, .gg-v4-victory-glow')
      .forEach((node) => node.remove());
  }
  function schedule(callback: () => void, delay: number, token: number) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!disposed && generation === token) callback();
    }, delay);
    timers.add(timer);
  }
  function animate(node: HTMLElement, frames: Keyframe[], timing: KeyframeAnimationOptions) {
    if (reduced() || typeof node.animate !== 'function') return;
    const animation = node.animate(frames, { fill: 'both', ...timing });
    animations.add(animation);
    void animation.finished.then(
      () => {
        if (animations.delete(animation)) animation.cancel();
      },
      () => {
        animations.delete(animation);
      },
    );
  }
  function celebrate() {
    const grid = board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
    const stars = [...grid.children].filter((cell) =>
      cell.classList.contains('nl-grim-glimmer-board__cell--placed'),
    ) as HTMLElement[];
    const links = el('div', { className: 'gg-v4-victory-links' });
    links.setAttribute('aria-hidden', 'true');
    grid.append(links);
    const points = stars.map((star) => {
      const index = Number(star.dataset.index);
      return { x: ((index % size) + 0.5) / size, y: (Math.floor(index / size) + 0.5) / size };
    });
    points.slice(1).forEach((point, index) => {
      const from = points[index]!;
      const length = Math.hypot(point.x - from.x, point.y - from.y);
      const angle = (Math.atan2(point.y - from.y, point.x - from.x) * 180) / Math.PI;
      const line = el('span', { className: 'gg-v4-victory-link' });
      line.style.cssText = `left:calc(${from.x * 100}% + ${0.5 - from.x}px);top:calc(${from.y * 100}% + ${0.5 - from.y}px);width:calc(${length * 100}% - ${length}px);transform:rotate(${angle}deg);`;
      links.append(line);
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
    stars.forEach((star, index) => {
      const glow = el('span', { className: 'gg-v4-victory-glow' });
      glow.setAttribute('aria-hidden', 'true');
      star.append(glow);
      animate(
        glow,
        [
          { transform: 'scale(.85)', opacity: 0 },
          { transform: 'scale(1.2)', opacity: 0.55 },
          { transform: 'scale(1)', opacity: 0 },
        ],
        {
          duration: 280,
          delay: (index / Math.max(1, stars.length - 1)) * 320,
          easing: 'ease-in-out',
        },
      );
    });
  }
  function stats(token: number) {
    if (!sheet?.open || disposed || token !== generation) return;
    sheet.querySelectorAll<HTMLElement>('.gg-v4-stat').forEach((stat, index) =>
      animate(
        stat,
        [
          { transform: 'translateY(6px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        {
          duration: VICTORY_TIMING.statDuration,
          delay: index * VICTORY_TIMING.stagger,
          easing: 'ease-out',
        },
      ),
    );
  }
  function showSheet(token: number) {
    if (disposed || token !== generation) return;
    const current = () => !disposed && token === generation;
    const guarded = {
      ...options,
      onHome: () => {
        if (current()) options.onHome?.();
      },
      onNext: () => {
        if (current()) options.onNext?.();
      },
      onMedium: () => {
        if (current()) options.onMedium?.();
      },
      onDismiss: () => {
        if (current()) options.onDismiss?.();
      },
    };
    sheet = createVictorySheet(
      guarded,
      options.messageMode === 'bank' ? bank : (options.message ?? 'Every star is in place.'),
      () => {
        if (disposed || token !== generation) return;
        clearMotion();
        status.textContent = 'Solved · completed board remains read-only.';
      },
    );
    const animateStats = !reduced() && typeof sheet.animate === 'function';
    if (animateStats) sheet.dataset.statsPending = 'true';
    root.append(sheet);
    const stopSequenceEffects = () => {
      if (!current()) return;
      clearMotion();
      if (sheet) delete sheet.dataset.statsPending;
    };
    sheet.addEventListener('cancel', stopSequenceEffects, { capture: true });
    sheet.addEventListener(
      'click',
      (event) => {
        if (event.target instanceof Element && event.target.closest('button'))
          stopSequenceEffects();
      },
      { capture: true },
    );
    // Native/fallback focus and dismissal come from the shared foundation. No history mutations in Storybook.
    openDialog(sheet);
    if (animateStats)
      schedule(
        () => {
          if (sheet) delete sheet.dataset.statsPending;
          stats(token);
        },
        SHEET_MOTION.duration,
        token,
      );
  }
  function start(sheetOnly = false) {
    generation++;
    const token = generation;
    clearMotion();
    if (sheet) {
      closeDialog(sheet);
      sheet.getAnimations?.().forEach((animation) => animation.cancel());
      sheet.remove();
      sheet = undefined;
    }
    chip.hidden = false;
    root.dataset.solved = 'true';
    status.textContent = 'Puzzle complete · solved preview is read-only.';
    if (options.haptics) options.success?.();
    if (sheetOnly || reduced()) showSheet(token);
    else {
      celebrate();
      schedule(() => showSheet(token), VICTORY_TIMING.sheet, token);
    }
  }
  const replay = createButton({
    label: mode === 'sheet' ? 'Open completion sheet' : 'Replay victory',
    onClick: () => {
      replay.focus({ preventScroll: true });
      start(mode === 'sheet');
    },
  });
  const back = createButton({
    label: 'Simulate Back',
    variant: 'ghost',
    size: 'sm',
    onClick: () => {
      if (sheet?.open) sheet.dispatchEvent(new Event('cancel', { cancelable: true }));
      else if (timers.size > 0) {
        generation++;
        clearMotion();
        status.textContent = 'Solved · completion replay cancelled.';
        replay.focus({ preventScroll: true });
        options.onDismiss?.();
      }
    },
  });
  root.append(
    el('header', { className: 'gg-v4-victory-header' }, [title, subtitle]),
    well,
    status,
    el('div', { className: 'gg-v4-victory-review-actions' }, [replay, back]),
  );
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const preference = () => {
    if (reduced()) {
      const pending = timers.size > 0 && !sheet?.open;
      clearMotion();
      if (sheet) {
        delete sheet.dataset.statsPending;
        sheet.getAnimations?.().forEach((animation) => animation.cancel());
      }
      if (pending) showSheet(generation);
    }
  };
  const visibility = () => {
    if (document.hidden) {
      generation++;
      clearMotion();
      if (sheet?.open) closeDialog(sheet);
      status.textContent = 'Sequence interrupted · solved board retained.';
    }
  };
  // Attach only on interaction; disposal removes every listener and pending operation.
  replay.addEventListener('click', () => {
    media?.removeEventListener('change', preference);
    media?.addEventListener('change', preference);
    document.removeEventListener('visibilitychange', visibility);
    document.addEventListener('visibilitychange', visibility);
  });
  root.cleanup = () => {
    disposed = true;
    generation++;
    clearMotion();
    media?.removeEventListener('change', preference);
    document.removeEventListener('visibilitychange', visibility);
    if (sheet?.open) {
      closeDialog(sheet);
      sheet.getAnimations?.().forEach((animation) => animation.cancel());
    }
  };
  return root;
}
/** Static comparison avoids competing top-layer modals in a two-theme story. */
export function createVictoryComparison(options: VictoryOptions = {}) {
  const root = createVictoryPreview(options, 'solved');
  root.querySelector('.gg-v4-victory-review-actions')?.remove();
  const sheet = createVictorySheet(
    { ...options, reducedMotion: true },
    options.message ?? 'Every star is in place.',
  );
  const panel = sheet.querySelector<HTMLElement>('.nl-dialog__panel')!;
  panel.setAttribute('inert', '');
  const specimen = el('section', { className: 'gg-v4-victory-sheet gg-v4-victory-inline' }, [
    panel,
  ]);
  specimen.setAttribute('aria-label', 'Static completion sheet comparison');
  root.append(specimen);
  return root;
}
