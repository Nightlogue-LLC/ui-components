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

/**
 * Optional theme hooks: a theme MAY define these, and components that read them MUST supply a
 * fallback at the point of use, e.g. `var(--nl-shadow-card, none)`. That is what keeps themes
 * that don't define them (such as `neutral`) rendering exactly as before.
 * tests/architecture.test.ts enforces the fallback rule.
 */
export const optionalThemeTokens = [
  /** Serif/editorial family for display headings. Fall back to `var(--nl-font-family)`. */
  '--nl-font-family-display',
  /** Subtle elevation for cards. Fall back to `none`. */
  '--nl-shadow-card',
  /** Elevation for dialogs/overlays. Fall back to `none`. */
  '--nl-shadow-dialog',
] as const;

export type OptionalThemeToken = (typeof optionalThemeTokens)[number];
