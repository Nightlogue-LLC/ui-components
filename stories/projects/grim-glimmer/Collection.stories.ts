import type { Meta, StoryObj } from '@storybook/html-vite';
import { createPuzzleCollection } from '../../../src/projects/grim-glimmer/index.js';
import { el } from '../../lib/dom.js';
import { compareModes } from '../../lib/stage.js';
import { THEME, card, sampleCards } from './shared.js';
import { mainScreenDemo } from './main-screen-demo.js';

function cardStates(): HTMLElement {
  return el('div', { className: 'sb-gg-states' }, [
    card('Play', 'play', 2),
    card('Continue', 'continue', 3, true),
    card('Coming Soon', 'coming-soon', 6),
  ]);
}

const meta = {
  title: 'Projects/Grim & Glimmer/Collection',
  tags: ['autodocs'],
  parameters: {
    nlTheme: THEME,
    nlStage: 'self',
    docs: {
      description: {
        component: `
The home collection: one column of compact landscape cards (120px tall), static preview on the left
(~35%), smaller puzzle title and restrained status on the right. The home heading and eyebrow
use a reduced mobile-first type scale independent of other screens. **Play** and **Continue** are native buttons;
**Coming Soon** is a static, visibly unavailable card that is not actionable (no tab stop). The three-item bottom navigation switches between Collection, Achievements and Settings.
There is no Journal destination or game-details route. Gameplay retains its separate header. The wordmark is app-owned artwork, so these stories only reserve a
labelled slot for it.

\`\`\`ts
import { createPuzzleCollection, createPuzzleCollectionCard } from '@nightlogue-llc/ui-components/projects/grim-glimmer';

list.append(createPuzzleCollection([
  createPuzzleCollectionCard({ title: 'Tents & Trees', status: 'continue', preview, onOpen: open }),
], { label: 'Puzzles' }));
\`\`\`

Previews are generic placeholder boards (no final artwork). "Ghosts & Graves" is a sample Coming Soon title.
`,
      },
    },
  },
  render: () => document.createElement('div'),
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** The whole home screen, in light and dark, at the true width of the selected viewport. */
export const HomeScreen: Story = {
  parameters: { nlStage: 'self' },
  render: (_args, context) =>
    compareModes(context, () => mainScreenDemo('collection'), { theme: THEME, bleed: true }),
};

/** Play, Continue and Coming Soon side by side. */
export const CardStatuses: Story = {
  render: (_args, context) => compareModes(context, () => cardStates(), { theme: THEME }),
};

/** Deliberately long titles: up to three whole lines, then an ellipsis; never clipped. Try 320px. */
export const LongTitles: Story = {
  render: (_args, context) =>
    compareModes(
      context,
      () =>
        el('div', { className: 'nl-grim-glimmer-screen' }, [
          createPuzzleCollection(sampleCards(), { label: 'Sample puzzle cards' }),
        ]),
      { theme: THEME, bleed: true },
    ),
};
