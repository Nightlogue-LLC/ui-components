import { describe, expect, it } from 'vitest';
import { createStreakGlow, replayStreakGlow } from './streak-glow.js';

describe('StreakGlow', () => {
  it('preserves consumer content and defaults to a diagonal 2200ms sweep', () => {
    const star = document.createElement('span');
    const glow = createStreakGlow({ content: star });
    expect(glow.classList.contains('nl-streak-glow--diagonal')).toBe(true);
    expect(glow.classList.contains('nl-streak-glow--active')).toBe(true);
    expect(glow.style.getPropertyValue('--nl-streak-glow-duration')).toBe('2200ms');
    expect(glow.querySelector('.nl-streak-glow__content')?.firstChild).toBe(star);
  });

  it('accepts horizontal movement and a custom duration', () => {
    const glow = createStreakGlow({
      content: document.createTextNode('Done'),
      direction: 'horizontal',
      durationMs: 1800,
    });
    expect(glow.classList.contains('nl-streak-glow--horizontal')).toBe(true);
    expect(glow.style.getPropertyValue('--nl-streak-glow-duration')).toBe('1800ms');
  });

  it.each([0, 499, 10001, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid duration %s',
    (durationMs) => {
      expect(() =>
        createStreakGlow({ content: document.createElement('span'), durationMs }),
      ).toThrow(RangeError);
    },
  );

  it('can replay without replacing artwork', () => {
    const icon = document.createElement('span');
    const glow = createStreakGlow({ content: icon });
    replayStreakGlow(glow);
    expect(glow.classList.contains('nl-streak-glow--active')).toBe(true);
    expect(glow.querySelector('.nl-streak-glow__content')?.firstChild).toBe(icon);
    expect(() => replayStreakGlow(document.createElement('span'))).toThrow(TypeError);
  });
});
