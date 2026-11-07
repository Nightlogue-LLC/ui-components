import type { Meta, StoryObj } from '@storybook/html-vite';
import { createButton } from '../../../src/components/button/index.js';
import { createEditorialCallout } from '../../../src/components/editorial-callout/index.js';
import { createGrainSurface } from '../../../src/components/grain-surface/index.js';
import { createRecessedSlot } from '../../../src/components/recessed-slot/index.js';
import { createTactileTile, updateTactileTile } from '../../../src/components/tactile-tile/index.js';
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
      caption: label,
      selected: selectedStates[i],
      onClick: () => {
        selectedStates[i] = !selectedStates[i];
        updateTactileTile(tile, { label, glyph, caption: label, selected: selectedStates[i] });
      },
    });
    return createRecessedSlot({ content: tile });
  });

  const grid = el('div', { className: 'sb-occult-study__grid' }, tiles);
  const callout = createEditorialCallout({
    title: 'Occult insight',
    description: 'Toggle the glyphs to compare raised, recessed and selected tile treatments.',
  });
  const button = createButton({
    label: 'Reset tiles',
    onClick: () => {
      tiles.forEach((slot, i) => {
        selectedStates[i] = false;
        const tile = slot.querySelector('button');
        const symbol = symbols[i];
        if (tile && symbol) {
          updateTactileTile(tile, {
            label: symbol[1],
            glyph: symbol[0],
            caption: symbol[1],
            selected: false,
          });
        }
      });
    },
  });
  button.classList.add('sb-occult-study__action');

  const panel = el('section', { className: 'sb-occult-study' }, [
    el('h2', { className: 'sb-occult-study__heading', text: 'Tile Study' }),
    el('p', { className: 'sb-occult-study__hint', text: 'Recessed slots · tactile tiles · editorial callout' }),
    grid,
    callout,
    button,
  ]);
  return createGrainSurface({ content: panel });
}

const meta = {
  title: 'Components/Surfaces/Occult Editorial',
  tags: ['autodocs'],
  render: study,
  parameters: {
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
  render: (_args, context) => compareModes(context, () => study()),
};

export const TilesOnly: Story = {
  render: () => study().querySelector('.sb-occult-study__grid') ?? el('div'),
};
