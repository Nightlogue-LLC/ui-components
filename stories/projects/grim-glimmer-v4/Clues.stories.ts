import type { Meta, StoryObj } from '@storybook/html-vite';
import { boardStage, type ClueState, type Palette } from './board.js';
import { compareModes } from '../../lib/stage.js';
interface Args {
  status: ClueState;
  palette: Palette;
}
const build = (args: Args) =>
  boardStage({
    size: 6,
    palette: args.palette,
    rowStates: Array<ClueState>(6).fill(args.status),
    columnStates: ['default', 'satisfied', 'over', 'default', 'satisfied', 'over'],
    interactive: false,
    conflict: false,
    hint: false,
  });
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Board/Clues',
  parameters: {
    nlTheme: 'moonlit-oxblood',
    nlStage: 'bleed',
    docs: {
      description: {
        component:
          'Dimmed accent numerals with diagonal strikes for satisfied clues; terracotta over-count numerals with superscript exclamation marks.',
      },
    },
  },
  args: { status: 'default', palette: 'current' },
  argTypes: {
    status: { control: 'select', options: ['default', 'satisfied', 'over'] },
    palette: { control: 'select', options: ['current', 'proposal'] },
  },
  render: build,
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const SatisfiedCrossedOut: Story = { args: { status: 'satisfied' } };
export const Default: Story = {};
export const SatisfiedIncludingZero: Story = { args: { status: 'satisfied' } };
export const OverIncludingZero: Story = { args: { status: 'over' } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => build(args), { theme: 'moonlit-oxblood', bleed: true }),
};
