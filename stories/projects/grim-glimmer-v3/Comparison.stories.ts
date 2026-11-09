import type { Meta, StoryObj } from '@storybook/html-vite';
import { applyTheme } from '../../../src/core/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { el } from '../../lib/dom.js';
import { specimen } from './shared.js';
const meta = {
  title: 'Projects/Grim & Glimmer — Editorial V3/Current versus proposed',
  parameters: { nlStage: 'self' },
  render: () =>
    el(
      'div',
      { className: 'sb-compare' },
      (['light', 'dark'] as const).flatMap((mode) =>
        ['grim-glimmer', 'moonlit-oxblood'].map((theme) => {
          const proposed = theme === 'moonlit-oxblood';
          const pane = el('section', { className: 'sb-compare__pane' }, [
            el('h2', { text: (proposed ? 'Moonlit Oxblood' : 'Current') + ' · ' + mode }),
            proposed
              ? specimen('buttons')
              : el('div', { className: 'sb-row' }, [
                  createButton({ label: 'New game' }),
                  createButton({ label: 'Continue', variant: 'secondary' }),
                  createButton({ label: 'View board', variant: 'ghost' }),
                  createButton({ label: 'Restart', disabled: true }),
                ]),
          ]);
          applyTheme(pane, theme, mode);
          return pane;
        }),
      ),
    ),
} satisfies Meta;
export default meta;
export const LightDarkComparison: StoryObj<typeof meta> = {};
