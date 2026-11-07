import type { StoryContext } from '@storybook/html-vite';
import { applyTheme } from '../../src/core/index.js';
import { el } from './dom.js';
import { resolveTheme } from './theme-choice.js';
import type { ModeName } from './theme-tokens.js';

type Globals = Pick<StoryContext, 'globals' | 'parameters'>;

const MODES: readonly ModeName[] = ['light', 'dark'];

/**
 * Renders the same content twice, side by side: one stage in light mode and one in dark, both
 * using `options.theme` (default: the toolbar's Theme, or the story's own default while on Auto). Each pane applies its own [data-nl-theme]
 * scope with the library's applyTheme, so the panes are independent of each other and of the
 * toolbar's Mode. Use with `parameters: { nlStage: 'self' }`.
 *
 * `factory` is called once per pane (and told the pane's mode) because a DOM node can only live in
 * one place. `bleed` removes the pane padding so full-width screens keep true phone proportions.
 */
export function compareModes(
  context: Globals,
  factory: (mode: ModeName) => Node,
  options: { theme?: string; bleed?: boolean } = {},
): HTMLElement {
  const theme = options.theme ?? resolveTheme(context);
  return el(
    'div',
    { className: 'sb-compare' },
    MODES.map((mode) => {
      const pane = el(
        'section',
        { className: `sb-compare__pane${options.bleed ? ' sb-compare__pane--bleed' : ''}` },
        [
          el('p', { className: 'sb-compare__label', text: mode === 'light' ? 'Light' : 'Dark' }),
          factory(mode),
        ],
      );
      pane.setAttribute('aria-label', `${mode} mode`);
      applyTheme(pane, theme, mode);
      return pane;
    }),
  );
}

/** A responsive grid of labelled examples (a labelled grid of states). */
export function stateGrid(items: readonly { label: string; node: Node }[]): HTMLElement {
  return el(
    'div',
    { className: 'sb-grid' },
    items.map((item) =>
      el('div', { className: 'sb-cell sb-cell--state' }, [
        el('span', { className: 'sb-cell__label', text: item.label }),
        item.node,
      ]),
    ),
  );
}
