/**
 * The theme contract: custom properties every theme MUST define.
 *
 * Shared components read colors only through these names, so any theme that defines all of them
 * works with every shared component. A test (tests/architecture.test.ts) enforces this for every
 * theme in src/themes/, and enforces that component CSS never reads a color token that is not
 * listed here.
 *
 * Add a name here only when a shared component actually needs it.
 */
export const requiredThemeTokens = [
  '--nl-color-bg',
  '--nl-color-surface',
  '--nl-color-surface-hover',
  '--nl-color-text',
  '--nl-color-border',
  '--nl-color-accent',
  '--nl-color-accent-hover',
  '--nl-color-accent-active',
  '--nl-color-on-accent',
  '--nl-color-focus-ring',
  '--nl-color-disabled-bg',
  '--nl-color-disabled-text',
] as const;

export type ThemeToken = (typeof requiredThemeTokens)[number];
