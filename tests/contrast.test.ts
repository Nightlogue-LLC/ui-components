// @vitest-environment node
//
// Contrast policy for project themes (see stories/lib/contrast-pairs.ts). Runs on every theme in
// src/themes/ except the neutral placeholder, in both modes, on literal token values.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColor } from '../stories/lib/contrast.js';
import { contrastPairs } from '../stories/lib/contrast-pairs.js';
import { parseThemeModes } from '../stories/lib/theme-tokens.js';

const themesDir = fileURLToPath(new URL('../src/themes/', import.meta.url));
// `neutral` is the architecture-proof example, not a product look, so it is not held to the policy.
const projectThemes = readdirSync(themesDir).filter(
  (d) => d !== 'neutral' && existsSync(join(themesDir, d, `${d}.css`)),
);

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // #767676 on white is the classic "just passes AA" gray (4.54:1).
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('is symmetric and accepts hex shorthand and rgb()', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(contrastRatio('#000', '#fff'), 10);
    expect(parseColor('rgb(10, 20, 30)')).toEqual([10, 20, 30]);
    expect(parseColor('rgba(10 20 30 / 0.5)')).toEqual([10, 20, 30]);
  });
});

describe.each(projectThemes)('%s theme contrast', (theme) => {
  const modes = parseThemeModes(readFileSync(join(themesDir, theme, `${theme}.css`), 'utf8'));

  for (const mode of ['light', 'dark'] as const) {
    it.each(contrastPairs.filter((p) => p.enforced))(`${mode}: $label`, (pair) => {
      const fg = modes[mode][pair.fg];
      const bg = modes[mode][pair.bg];
      expect(fg, `${pair.fg} must be a literal color`).toBeDefined();
      expect(bg, `${pair.bg} must be a literal color`).toBeDefined();
      expect(contrastRatio(fg!, bg!)).toBeGreaterThanOrEqual(pair.min);
    });
  }
});
