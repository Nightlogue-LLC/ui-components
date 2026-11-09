// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { contrastRatio } from '../stories/lib/contrast.js';
import { parseThemeModes } from '../stories/lib/theme-tokens.js';
const modes = parseThemeModes(
  readFileSync(
    new URL('../src/themes/grim-glimmer-v3/grim-glimmer-v3.css', import.meta.url),
    'utf8',
  ),
);
it('editorial labels and flat button text meet AA in both modes', () => {
  for (const tokens of Object.values(modes)) {
    for (const background of ['--nl-color-bg', '--nl-color-surface']) {
      expect(
        contrastRatio(tokens['--nl-grim-glimmer-v3-label']!, tokens[background]!),
      ).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      contrastRatio(
        tokens['--nl-grim-glimmer-v3-button-ink']!,
        tokens['--nl-button-primary-background']!,
      ),
    ).toBeGreaterThanOrEqual(4.5);
  }
});
