// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseThemeModes } from '../stories/lib/theme-tokens.js';
import { contrastRatio } from '../stories/lib/contrast.js';
const modes = parseThemeModes(
  readFileSync(
    new URL('../src/themes/moonlit-oxblood/moonlit-oxblood.css', import.meta.url),
    'utf8',
  ),
);
it.each(['light', 'dark'] as const)(
  '%s keeps spires and stars legible on distinct occupied fills',
  (mode) => {
    const t = modes[mode];
    const fixed = t['--nl-grim-glimmer-cell-fixed-bg']!;
    const star = t['--nl-grim-glimmer-cell-star-bg']!;
    expect(fixed).not.toBe(star);
    expect(fixed).not.toBe(t['--nl-color-surface']);
    expect(star).not.toBe(t['--nl-color-surface']);
    expect(contrastRatio(t['--nl-moonlit-spire']!, fixed)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(t['--nl-moonlit-star']!, star)).toBeGreaterThanOrEqual(3);
  },
);
it('separates dark spires from confirmed and tentative ivory stars by hue', () => {
  expect(modes.dark['--nl-moonlit-spire']).toBe('#b87a8c');
  expect(modes.dark['--nl-moonlit-star']).toBe('#f4f0f2');
});
