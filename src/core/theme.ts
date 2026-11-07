/** Attribute that scopes a theme's custom properties to an element's subtree. */
export const THEME_ATTRIBUTE = 'data-nl-theme';

/** Optional attribute selecting a theme's color mode, e.g. `[data-nl-theme='x'][data-nl-mode='dark']`. */
export const MODE_ATTRIBUTE = 'data-nl-mode';

export type ColorMode = 'light' | 'dark';

/**
 * Activates a theme for `root` and everything inside it.
 *
 * Themes are scoped by attribute, not applied globally, so several themes can coexist on one page
 * (the Storybook catalog relies on this) and a theme's CSS never leaks outside its own subtree.
 * Pass `document.documentElement` for an app-wide theme.
 */
export function applyTheme(root: Element, theme: string, mode?: ColorMode): void {
  root.setAttribute(THEME_ATTRIBUTE, theme);
  if (mode) {
    root.setAttribute(MODE_ATTRIBUTE, mode);
  } else {
    root.removeAttribute(MODE_ATTRIBUTE);
  }
}
