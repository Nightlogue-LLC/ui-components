export type StreakDirection = 'horizontal' | 'diagonal';

export interface StreakGlowOptions {
  /** The consumer supplies its own artwork or content. */
  content: Node;
  direction?: StreakDirection;
  /** One-pass duration in milliseconds (500–10000). Defaults to 2200. */
  durationMs?: number;
}

/** Brand-neutral light sweep. The consumer owns the artwork and color token. */
export function createStreakGlow(options: StreakGlowOptions): HTMLSpanElement {
  const { direction = 'diagonal', durationMs = 2200 } = options;
  if (!Number.isFinite(durationMs) || durationMs < 500 || durationMs > 10000) {
    throw new RangeError('durationMs must be between 500 and 10000');
  }
  const glow = document.createElement('span');
  glow.className = 'nl-streak-glow nl-streak-glow--active';
  glow.classList.add(`nl-streak-glow--${direction}`);
  glow.style.setProperty('--nl-streak-glow-duration', `${durationMs}ms`);
  const content = document.createElement('span');
  content.className = 'nl-streak-glow__content';
  content.append(options.content);
  glow.append(content);
  return glow;
}

/** Restart the CSS sweep without changing its content. */
export function replayStreakGlow(glow: HTMLElement): void {
  if (!glow.classList.contains('nl-streak-glow')) {
    throw new TypeError('Expected a StreakGlow element');
  }
  glow.classList.remove('nl-streak-glow--active');
  void glow.offsetWidth;
  glow.classList.add('nl-streak-glow--active');
}
