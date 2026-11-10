import { SHEET_MOTION } from '../../../src/core/motion.js';
import type { BoardCellState } from '../../../src/projects/grim-glimmer/index.js';
import { el } from '../../lib/dom.js';
import './motion.css';

export const V4_MOTION = {
  star: 200,
  ring: 280,
  x: 120,
  erase: 100,
  hint: 1600,
  screen: SHEET_MOTION.duration * 2,
  dissolveFade: 480,
  dissolveCap: 1200,
} as const;
export function dissolveTiming(index: number, size: number) {
  const center = (size - 1) / 2;
  const distance = Math.hypot(Math.floor(index / size) - center, (index % size) - center);
  return {
    duration: V4_MOTION.dissolveFade,
    delay: Math.min(V4_MOTION.dissolveCap - V4_MOTION.dissolveFade, distance * 48),
  };
}
interface Job {
  animations: Animation[];
  cleanup: () => void;
  complete?: () => void;
}
/** Story-only motion ownership: a newer operation always invalidates old completion work. */
export function createMotionSystem(
  options: { reducedMotion?: boolean; hint?: HTMLElement; reviewSpeed?: 0.25 | 0.5 | 1 } = {},
) {
  const jobs = new Map<HTMLElement, Job>();
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let pulse: Animation | undefined;
  let mounted = false;
  const reduced = () => options.reducedMotion === true || media?.matches === true;
  const allowed = (node: HTMLElement) =>
    !reduced() && !document.hidden && typeof node.animate === 'function';
  function stop(node: HTMLElement) {
    const job = jobs.get(node);
    if (!job) return;
    jobs.delete(node);
    job.animations.forEach((animation) => animation.cancel());
    job.cleanup();
  }
  function cancel() {
    [...jobs.keys()].forEach(stop);
  }
  function own(
    node: HTMLElement,
    animations: Animation[],
    cleanup: () => void,
    complete?: () => void,
  ) {
    const job = { animations, cleanup, complete };
    jobs.set(node, job);
    void Promise.all(animations.map((animation) => animation.finished)).then(
      () => {
        if (jobs.get(node) !== job) return;
        jobs.delete(node);
        complete?.();
        animations.forEach((animation) => animation.cancel());
        cleanup();
      },
      () => {
        if (jobs.get(node) === job) stop(node);
      },
    );
  }
  function run(node: HTMLElement, keyframes: Keyframe[], timing: KeyframeAnimationOptions) {
    const speed = options.reviewSpeed ?? 1;
    return node.animate(keyframes, {
      fill: 'both',
      ...timing,
      duration: typeof timing.duration === 'number' ? timing.duration / speed : timing.duration,
      delay: (timing.delay ?? 0) / speed,
    });
  }
  function change(cell: HTMLElement, before: BoardCellState, after: BoardCellState) {
    stop(cell);
    if (before === after || !allowed(cell)) return;
    const erase = after === 'empty' && ['placed', 'tentative', 'excluded'].includes(before);
    const placing = after === 'placed' || after === 'excluded';
    if (!erase && !placing) return;
    const nodes: HTMLElement[] = [];
    const animations: Animation[] = [];
    const append = (node: HTMLElement) => {
      node.setAttribute('aria-hidden', 'true');
      cell.append(node);
      nodes.push(node);
      return node;
    };
    if (erase || after === 'placed') {
      const glyph = append(
        el('span', {
          className: `nl-grim-glimmer-board__cell nl-grim-glimmer-board__cell--${erase ? before : after} gg-v4-motion-overlay`,
        }),
      );
      if (erase)
        animations.push(
          run(glyph, [{ opacity: 1 }, { opacity: 0 }], {
            duration: V4_MOTION.erase,
            easing: 'ease-out',
          }),
        );
      else {
        cell.classList.add('gg-v4-motion-hidden');
        animations.push(
          run(glyph, [{ transform: 'scale(.5)' }, { transform: 'scale(1)' }], {
            duration: V4_MOTION.star,
            easing: 'cubic-bezier(.34,1.56,.64,1)',
          }),
        );
        const ring = append(el('span', { className: 'gg-v4-placement-ring' }));
        animations.push(
          run(
            ring,
            [
              { transform: 'scale(.5)', opacity: 0.5 },
              { transform: 'scale(1.35)', opacity: 0 },
            ],
            { duration: V4_MOTION.ring, easing: 'ease-out' },
          ),
        );
      }
    } else {
      cell.classList.add('gg-v4-motion-hidden');
      for (const [index, angle] of [45, -45].entries()) {
        const axis = append(el('span', { className: 'gg-v4-motion-x-axis' }));
        axis.style.transform = `rotate(${angle}deg)`;
        const stroke = el('span', { className: 'gg-v4-motion-x-stroke' });
        axis.append(stroke);
        animations.push(
          run(stroke, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
            duration: V4_MOTION.x / 2,
            delay: (index * V4_MOTION.x) / 2,
            easing: 'ease-out',
          }),
        );
      }
    }
    own(cell, animations, () => {
      nodes.forEach((node) => node.remove());
      cell.classList.remove('gg-v4-motion-hidden');
    });
  }
  function changes(
    grid: HTMLElement,
    before: readonly BoardCellState[],
    after: readonly BoardCellState[],
  ) {
    after.forEach((state, index) => {
      if (before[index] !== state)
        change(grid.children[index] as HTMLElement, before[index]!, state);
    });
  }
  function screen(node: HTMLElement) {
    stop(node);
    if (!allowed(node)) return;
    own(
      node,
      [
        run(
          node,
          [
            { transform: 'translateX(24px)', opacity: 0 },
            { transform: 'translateX(0)', opacity: 1 },
          ],
          { ...SHEET_MOTION, duration: V4_MOTION.screen },
        ),
      ],
      () => undefined,
    );
  }
  function dissolve(grid: HTMLElement, size: number, complete: () => void) {
    cancel();
    if (!allowed(grid)) {
      complete();
      return;
    }
    const animations = [...grid.children].map((cell, index) =>
      run(cell as HTMLElement, [{ opacity: 1 }, { opacity: 0 }], {
        ...dissolveTiming(index, size),
        easing: 'ease-out',
      }),
    );
    own(grid, animations, () => undefined, complete);
  }
  function refreshHint() {
    pulse?.cancel();
    pulse = undefined;
    if (mounted && options.hint && allowed(options.hint))
      pulse = run(
        options.hint,
        [
          { transform: 'scale(.92)', opacity: 0.35 },
          { transform: 'scale(1.08)', opacity: 0.85 },
          { transform: 'scale(.92)', opacity: 0.35 },
        ],
        { duration: V4_MOTION.hint, easing: 'ease-in-out', iterations: Infinity },
      );
  }
  function preference() {
    if (reduced() || document.hidden) {
      const finish = reduced() ? [...jobs.values()].map((job) => job.complete) : [];
      cancel();
      finish.forEach((complete) => complete?.());
    }
    refreshHint();
  }
  function mount() {
    if (mounted) return;
    mounted = true;
    media?.addEventListener('change', preference);
    document.addEventListener('visibilitychange', preference);
    refreshHint();
  }
  function dispose() {
    mounted = false;
    cancel();
    pulse?.cancel();
    pulse = undefined;
    media?.removeEventListener('change', preference);
    document.removeEventListener('visibilitychange', preference);
  }
  return { changes, screen, dissolve, cancel, mount, dispose };
}
