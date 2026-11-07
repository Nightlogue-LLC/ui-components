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
 *
 * Typography is expressed as SEMANTIC ROLES, never as font names. A theme maps each role to
 * whatever families it ships (loaded by its own @font-face rules, as theme assets); shared
 * components only ever read the role tokens and never reference or import a font:
 *
 *   ui       functional text: buttons, controls, instructions, numbers  -> --nl-font-family
 *   display  expressive titles such as puzzle names
 *   heading  primary heading hierarchy: screens, sections, modals
 *   label    small editorial labels and supporting text
 *
 * Fallback for a missing role is the UI family, e.g.
 * `var(--nl-font-family-heading, var(--nl-font-family))`.
 */
export const optionalThemeTokens = [
  // --- families -------------------------------------------------------------------------------
  /** Expressive titles (puzzle names). */
  '--nl-font-family-display',
  /** Primary heading hierarchy (screen, section and modal headings, success messages). */
  '--nl-font-family-heading',
  /** Small editorial labels and decorative supporting text. Never functional UI text. */
  '--nl-font-family-label',
  // --- weights --------------------------------------------------------------------------------
  '--nl-font-weight-display',
  /** Major headings. */
  '--nl-font-weight-heading',
  /** Softer editorial text set in the heading family. */
  '--nl-font-weight-heading-soft',
  '--nl-font-weight-label',
  // --- responsive type scale (usually clamp()) ---------------------------------------------------
  '--nl-font-size-display-lg',
  '--nl-font-size-display-md',
  '--nl-font-size-heading-lg',
  '--nl-font-size-heading-md',
  '--nl-font-size-heading-sm',
  '--nl-font-size-label',
  // --- rhythm ---------------------------------------------------------------------------------
  '--nl-line-height-display',
  '--nl-line-height-heading',
  '--nl-letter-spacing-label',
  // --- elevation ------------------------------------------------------------------------------
  /** Subtle elevation for cards. Fall back to `none`. */
  '--nl-shadow-card',
  /** Elevation for dialogs/overlays. Fall back to `none`. */
  '--nl-shadow-dialog',
] as const;

export type OptionalThemeToken = (typeof optionalThemeTokens)[number];
