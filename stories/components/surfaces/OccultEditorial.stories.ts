import type { Meta, StoryObj } from '@storybook/html-vite';
import { createButton } from '../../../src/components/button/index.js';
import { createEditorialCallout } from '../../../src/components/editorial-callout/index.js';
import { createGrainSurface } from '../../../src/components/grain-surface/index.js';
import { createRecessedSlot } from '../../../src/components/recessed-slot/index.js';
import {
  createTactileTile,
  updateTactileTile,
} from '../../../src/components/tactile-tile/index.js';
import { el } from '../../lib/dom.js';
import { compareModes } from '../../lib/stage.js';

const symbols = [
  ['🜁', 'Air'],
  ['🜂', 'Fire'],
  ['🜄', 'Water'],
  ['🜃', 'Earth'],
  ['☉', 'Sol'],
  ['☽', 'Luna'],
  ['☿', 'Mercury'],
  ['♀', 'Venus'],
  ['♂', 'Mars'],
] as const;

function study(): HTMLElement {
  const selectedStates = symbols.map((_, i) => [0, 4, 8].includes(i));
  const tiles = symbols.map(([glyph, label], i) => {
    const tile = createTactileTile({
      label,
      glyph,
      caption: `${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][i]}. ${label.toUpperCase()}`,
      selected: selectedStates[i],
      onClick: () => {
        selectedStates[i] = !selectedStates[i];
        updateTactileTile(tile, {
          label,
          glyph,
          caption: `${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][i]}. ${label.toUpperCase()}`,
          selected: selectedStates[i],
        });
      },
    });
    return createRecessedSlot({ content: tile });
  });

  const grid = el('div', { className: 'sb-occult-study__grid' }, tiles);
  const callout = createEditorialCallout({
    title: 'OCCULT INSIGHT',
    description:
      'Align the elemental triad with Sol and Mars to channel the required resonance through the grid.',
  });
  const button = createButton({
    label: 'TRANSMUTE GRID',
    onClick: () => {
      tiles.forEach((slot, i) => {
        selectedStates[i] = false;
        const tile = slot.querySelector('button');
        const symbol = symbols[i];
        if (tile && symbol) {
          updateTactileTile(tile, {
            label: symbol[1],
            glyph: symbol[0],
            caption: `${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][i]}. ${symbol[1].toUpperCase()}`,
            selected: false,
          });
        }
      });
    },
  });
  button.classList.add('sb-occult-study__action');

  const panel = el('section', { className: 'sb-occult-study' }, [
    el('p', { className: 'sb-occult-study__eyebrow', text: 'RITUAL II · ALIGNMENT' }),
    el('h2', { className: 'sb-occult-study__heading', text: 'THE ECLIPSE' }),
    el('p', {
      className: 'sb-occult-study__hint',
      text: 'Tap glyphs in sequence to unlock',
    }),
    grid,
    callout,
    button,
  ]);
  const canvas = createGrainSurface({ content: panel });
  canvas.classList.add('sb-occult-study__canvas');
  return canvas;
}

const meta = {
  title: 'Components/Surfaces/Occult Editorial',
  globals: { mode: 'dark' },
  tags: ['autodocs'],
  render: study,
  parameters: {
    nlTheme: 'grim-glimmer',
    docs: {
      description: {
        component:
          'Framework-independent RecessedSlot, TactileTile, EditorialCallout, and GrainSurface in a responsive 3x3 study. Each component works outside Grim & Glimmer; the active theme supplies its colors and textures. The existing Button provides the bottom action. Glyphs and sample text are story fixtures, not shared component assets.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const InteractiveStudy: Story = {};

export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (_args, context) => compareModes(context, () => study(), { theme: 'grim-glimmer' }),
};

export const TilesOnly: Story = {
  render: () => study().querySelector('.sb-occult-study__grid') ?? el('div'),
};
