import { createLoopMotion } from '../../../src/core/loop-motion.js';
export { createLoopMotion } from '../../../src/core/loop-motion.js';
import { HOME_TIMING } from './home-model.js';
/** Finite entrance + bounded ambient jobs, separate from production navigation. */
export function createHomeMotion(
  root: HTMLElement,
  options: { reducedMotion?: boolean; launch?: 'cold' | 'return'; ambient?: boolean } = {},
) {
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const finite = new Set<Animation>();
  const owners = new Map<HTMLElement, Animation>();
  let mounted = false;
  const reduced = () => options.reducedMotion === true || media?.matches === true;
  function cancel(set: Set<Animation>) {
    set.forEach((job) => job.cancel());
    set.clear();
    owners.clear();
  }
  function animate(
    node: HTMLElement | undefined | null,
    frames: Keyframe[],
    timing: KeyframeAnimationOptions,
    set = finite,
  ) {
    if (!node || typeof node.animate !== 'function') return;
    const previous = owners.get(node);
    if (previous) {
      previous.cancel();
      set.delete(previous);
    }
    const job = node.animate(frames, timing);
    owners.set(node, job);
    set.add(job);
    if (timing.iterations !== Infinity)
      void job.finished.then(
        () => {
          if (set.delete(job)) job.cancel();
          if (owners.get(node) === job) owners.delete(node);
        },
        () => {
          set.delete(job);
          if (owners.get(node) === job) owners.delete(node);
        },
      );
  }
  function replay() {
    cancel(finite);
    if (!mounted || document.hidden || options.launch === 'return') return;
    if (reduced()) {
      animate(root, [{ opacity: 0 }, { opacity: 1 }], {
        duration: HOME_TIMING.reduced,
        easing: 'ease-out',
      });
      return;
    }
    animate(root.querySelector('.gg-v4-home-logo'), [{ opacity: 0 }, { opacity: 1 }], {
      duration: HOME_TIMING.logo,
      fill: 'backwards',
    });
    root.querySelectorAll<HTMLElement>('.gg-v4-home-tagline').forEach((node) =>
      animate(
        node,
        [
          { transform: 'scaleX(0)', opacity: 0 },
          { transform: 'scaleX(1)', opacity: 1 },
        ],
        { duration: 400, fill: 'backwards' },
      ),
    );
    animate(root.querySelector('.gg-v4-daily:not([hidden])'), [{ opacity: 0 }, { opacity: 1 }], {
      duration: 280,
      delay: HOME_TIMING.dailyDelay,
      fill: 'backwards',
    });
    root
      .querySelectorAll<HTMLElement>('.gg-v4-carousel-item:not([data-clone]) > .gg-v4-tarot')
      .forEach((node, i) =>
        animate(
          node,
          [
            { transform: 'translateY(16px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 },
          ],
          {
            duration: HOME_TIMING.cardDuration,
            delay: HOME_TIMING.cardDelay + i * HOME_TIMING.cardStagger,
            easing: 'ease-out',
            fill: 'backwards',
          },
        ),
      );
    animate(
      root.querySelector('.gg-v4-tarot-sheen'),
      [
        { transform: 'translateX(-180%)', opacity: 0 },
        { transform: 'translateX(-180%)', opacity: 0.5, offset: 0.1 },
        { transform: 'translateX(280%)', opacity: 0 },
      ],
      {
        duration: HOME_TIMING.sheen,
        delay: HOME_TIMING.sheenDelay,
        easing: 'ease-in-out',
        fill: 'both',
      },
    );
  }
  const ambient = createLoopMotion(
    () =>
      options.ambient === false
        ? []
        : [...root.querySelectorAll<HTMLElement>('.gg-v4-ambient-star')].map((node, index) => ({
            node,
            frames: [{ opacity: 0.25 }, { opacity: 0.8 }, { opacity: 0.25 }],
            duration: 4000 + index * 400,
            delay: index * 170,
          })),
    options.reducedMotion,
  );
  function visibility() {
    if (document.hidden) cancel(finite);
  }
  function changed() {
    cancel(finite);
  }
  return {
    replay,
    mount() {
      if (mounted) return;
      mounted = true;
      document.addEventListener('visibilitychange', visibility);
      media?.addEventListener('change', changed);
      ambient.mount();
      replay();
    },
    dispose() {
      mounted = false;
      cancel(finite);
      ambient.dispose();
      document.removeEventListener('visibilitychange', visibility);
      media?.removeEventListener('change', changed);
    },
    shake(node: HTMLElement) {
      if (!mounted || reduced() || document.hidden) return;
      animate(
        node,
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-3px)' },
          { transform: 'translateX(3px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 200, easing: 'ease-out' },
      );
    },
  };
}
