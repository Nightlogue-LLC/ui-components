/** Toolbar value meaning "use the story's own default theme". */
export const AUTO_THEME = 'auto';

/** The theme shared (project-neutral) stories use when the toolbar is on Auto. */
export const DEFAULT_THEME = 'neutral';

/**
 * Which theme a story should render with:
 *  - the toolbar's explicit choice, if the user picked a theme; otherwise
 *  - the story's own default (`parameters.nlTheme`, e.g. a project theme on project stories); otherwise
 *  - `neutral`, the generic default.
 * Keeping "Auto" as a real toolbar value (instead of locking a global per story) means the toolbar
 * stays usable everywhere, including switching a project story to another theme.
 */
export function resolveTheme(context: {
  globals: Record<string, unknown>;
  parameters: { nlTheme?: string };
}): string {
  const value = context.globals.theme;
  const chosen = typeof value === 'string' ? value : AUTO_THEME;
  return chosen === AUTO_THEME ? (context.parameters.nlTheme ?? DEFAULT_THEME) : chosen;
}
