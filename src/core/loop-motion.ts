/** One visibility/reduced-motion lifecycle for all new continuous decorative loops. */
export function createLoopMotion(
  targets: () => { node: HTMLElement; frames: Keyframe[]; duration: number; delay?: number }[],
  reducedMotion = false,
) {
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const jobs = new Set<Animation>();
  let mounted = false,
    disposed = false,
    enabled = true;
  function clear() {
    jobs.forEach((job) => job.cancel());
    jobs.clear();
  }
  function refresh() {
    clear();
    if (!mounted || disposed || !enabled || reducedMotion || media?.matches || document.hidden)
      return;
    for (const target of targets()) {
      const job = target.node.animate?.(target.frames, {
        duration: target.duration,
        delay: target.delay ?? 0,
        iterations: Infinity,
        easing: 'ease-in-out',
      });
      if (job) {
        jobs.add(job);
        // Cancellation is expected when a preview unmounts or the OS requests less motion.
        void job.finished.catch(() => undefined);
      }
    }
  }
  function visibility() {
    if (document.hidden) jobs.forEach((job) => job.pause());
    else if (jobs.size) jobs.forEach((job) => job.play());
    else refresh();
  }
  return {
    mount() {
      if (mounted || disposed) return;
      mounted = true;
      document.addEventListener('visibilitychange', visibility);
      media?.addEventListener('change', refresh);
      refresh();
    },
    setEnabled(value: boolean) {
      if (disposed || enabled === value) return;
      enabled = value;
      refresh();
    },
    setReducedMotion(value: boolean) {
      if (disposed || reducedMotion === value) return;
      reducedMotion = value;
      refresh();
    },
    dispose() {
      disposed = true;
      mounted = false;
      clear();
      document.removeEventListener('visibilitychange', visibility);
      media?.removeEventListener('change', refresh);
    },
  };
}
