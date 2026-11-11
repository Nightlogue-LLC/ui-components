/** Finite editorial jobs; one interruption boundary for unmount, OS changes and visibility. */
export function ritualMotion(reducedMotion = false, onInterrupt?: () => void) {
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let mounted = false,
    generation = 0;
  const jobs = new Map<HTMLElement, Animation>(),
    timers = new Set<ReturnType<typeof setTimeout>>();
  const reduced = () => reducedMotion || media?.matches === true;
  function cancel() {
    generation++;
    jobs.forEach((job) => job.cancel());
    jobs.clear();
    timers.forEach(clearTimeout);
    timers.clear();
  }
  function interrupt() {
    cancel();
    onInterrupt?.();
  }
  const visibility = () => {
    if (document.hidden) interrupt();
  };
  return {
    reduced,
    cancel,
    mount() {
      if (mounted) return;
      mounted = true;
      media?.addEventListener('change', interrupt);
      document.addEventListener('visibilitychange', visibility);
    },
    dispose() {
      mounted = false;
      cancel();
      media?.removeEventListener('change', interrupt);
      document.removeEventListener('visibilitychange', visibility);
    },
    after(ms: number, callback: () => void) {
      const token = generation;
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (mounted && generation === token) callback();
      }, ms);
      timers.add(timer);
      return timer;
    },
    async run(
      node: HTMLElement,
      frames: Keyframe[],
      duration: number,
      extra: KeyframeAnimationOptions = {},
    ) {
      if (!mounted || document.hidden) return false;
      const token = generation;
      const previous = jobs.get(node);
      previous?.cancel();
      if (typeof node.animate !== 'function') return token === generation;
      const job = node.animate(frames, { duration, easing: 'ease-out', fill: 'both', ...extra });
      jobs.set(node, job);
      try {
        await job.finished;
        if (jobs.get(node) === job) {
          jobs.delete(node);
          job.cancel();
        }
        return mounted && token === generation;
      } catch {
        return false;
      }
    },
  };
}
