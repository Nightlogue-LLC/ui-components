// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { auditOnyx } from '../stories/projects/grim-glimmer-v3/onyx-contrast.js';
import { parseThemeModes } from '../stories/lib/theme-tokens.js';
const css = readFileSync(
  new URL('../src/themes/onyx-crimson/onyx-crimson.css', import.meta.url),
  'utf8',
);
const blue = readFileSync(
  new URL('../src/themes/onyx-crimson-blue/onyx-crimson-blue.css', import.meta.url),
  'utf8',
);
it('audits supplied Onyx values with alpha compositing', () => {
  const result = auditOnyx(css, blue);
  expect(result).toHaveLength(42);
  for (const r of result.filter((r) =>
    ['text', 'muted / exclusion', 'spire', 'selected border'].includes(r.role),
  ))
    expect(r.ratio, JSON.stringify(r)).toBeGreaterThanOrEqual(r.minimum);
  console.log('ONYX_FAILURES', JSON.stringify(result.filter((r) => !r.pass)));
});
it('resolves surface aliases separately for each mode', () => {
  const a = parseThemeModes(css),
    b = parseThemeModes(blue);
  expect(a.light['--nl-color-bg']).toBe('#f5f5f5');
  expect(a.light['--nl-color-surface']).toBe(a.light['--nl-color-bg']);
  expect(a.dark['--nl-color-surface']).toBe('#0d0d0d');
  expect(b.dark['--nl-color-surface']).toBe('#003049');
});
