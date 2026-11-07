import type { Decorator } from '@storybook/html-vite';
import { applyTheme } from '../src/core/index.js';
import { resolveTheme } from '../stories/lib/theme-choice.js';
import type { Mode } from './themes.js';

/**
 * How a story is placed on the canvas (`parameters.nlStage`):
 *  - 'default': wrapped in ONE themed stage, using the toolbar's Theme and Mode.
 *  - 'bleed':   like default, but edge to edge with no padding (full-width screens).
 *  - 'self':    NOT wrapped. The story applies its own theme scopes, e.g. light and dark side by
 *               side in comparison stories. See stories/lib/stage.ts.
 */
export type StageKind = 'default' | 'bleed' | 'self';

declare module '@storybook/html-vite' {
  interface Parameters {
    nlStage?: StageKind;
    /** The story's own default theme, used while the toolbar Theme is on Auto. */
    nlTheme?: string;
  }
}

/**
 * Puts the story inside a stage element and activates the toolbar's theme on that element only,
 * with the library's own mechanism ([data-nl-theme] / [data-nl-mode] via applyTheme). Nothing is
 * applied to <html> or <body>, so a theme can never leak outside the stage (and the rest of the
 * Storybook canvas and docs page keep their own look).
 */
export const withThemeStage: Decorator = (storyFn, context) => {
  const content = storyFn();
  const kind = context.parameters.nlStage ?? 'default';
  if (kind === 'self') return content;

  const theme = resolveTheme(context);
  const mode = (context.globals.mode === 'dark' ? 'dark' : 'light') satisfies Mode;

  const stage = document.createElement('div');
  stage.className = `sb-stage sb-stage--${kind}`;
  // In the docs page several stories share one page: do not force full-viewport height there.
  if (context.viewMode === 'docs') stage.classList.add('sb-stage--docs');
  applyTheme(stage, theme, mode);
  stage.append(content);
  return stage;
};
