import type { Meta, StoryObj } from '@storybook/html-vite';
import { CELL_STATES, createV4Cell, type Palette } from './board.js';
import { compareModes } from '../../lib/stage.js';
import { el } from '../../lib/dom.js';

interface Args {
  state: (typeof CELL_STATES)[number];
  palette: Palette;
  annotation: 'none' | 'hint' | 'conflict';
}
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Board/Cell',
  parameters: {
    nlTheme: 'moonlit-oxblood',
    docs: {
      description: {
        component:
          'Isolated V4 proposal. Existing SVG masks and board semantics; current tokens by default, scoped proposed palette through Controls. Hint ring is static in Phase 1.',
      },
    },
  },
  args: { state: 'placed', palette: 'current', annotation: 'none' },
  argTypes: {
    state: { control: 'select', options: CELL_STATES },
    palette: { control: 'select', options: ['current', 'proposal'] },
    annotation: { control: 'select', options: ['none', 'hint', 'conflict'] },
  },
  render: (args) =>
    createV4Cell(
      args.state,
      args.palette,
      args.annotation === 'none' ? undefined : args.annotation,
    ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Playground: Story = {};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(
      context,
      () =>
        el('div', { className: 'gg-v4-specimens' }, [
          ...CELL_STATES.map((state) =>
            el('figure', {}, [
              createV4Cell(state, args.palette),
              el('figcaption', { text: state }),
            ]),
          ),
          el('figure', {}, [
            createV4Cell('placed', args.palette, 'conflict'),
            el('figcaption', { text: 'Conflict ring' }),
          ]),
          el('figure', {}, [
            createV4Cell('empty', args.palette, 'hint'),
            el('figcaption', { text: 'Hint target' }),
          ]),
        ]),
      { theme: 'moonlit-oxblood' },
    ),
};
