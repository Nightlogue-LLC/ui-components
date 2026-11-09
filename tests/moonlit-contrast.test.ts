// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { auditMoonlit } from '../stories/projects/grim-glimmer-v3/moonlit-contrast.js';
it('audits every Moonlit role on all three surfaces, including alpha compositing', () => {
  const results = auditMoonlit(
    readFileSync(
      new URL('../src/themes/moonlit-oxblood/moonlit-oxblood.css', import.meta.url),
      'utf8',
    ),
  );
  expect(results).toHaveLength(54);
  for (const result of results) {
    if (['hairline', 'maybe/exclusion'].includes(result.role)) continue;
    expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(result.minimum);
  }
  console.log('MOONLIT_FAILURES', JSON.stringify(results.filter((r) => !r.pass)));
});

it('keeps supplied translucent values and reports their known contrast failures', () => {
  const results = auditMoonlit(
    readFileSync(
      new URL('../src/themes/moonlit-oxblood/moonlit-oxblood.css', import.meta.url),
      'utf8',
    ),
  );
  expect(
    results.filter((r) => !r.pass).map((r) => r.mode + ':' + r.role + ':' + r.background),
  ).toEqual([
    'light:maybe/exclusion:bg',
    'light:hairline:bg',
    'light:maybe/exclusion:surface',
    'light:hairline:surface',
    'light:maybe/exclusion:surface-high',
    'light:hairline:surface-high',
    'dark:hairline:bg',
    'dark:hairline:surface',
    'dark:hairline:surface-high',
  ]);
});
