import type { Meta, StoryObj } from '@storybook/html-vite';
import { boardStage, type ClueState, type Palette } from './board.js';
import { compareModes } from '../../lib/stage.js';
interface Args {
  status: ClueState;
  palette: Palette;
  dimSatisfied: boolean;
}
const build = (args: Args) =>
  boardStage({
    size: 6,
    palette: args.palette,
    dimSatisfied: args.dimSatisfied,
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
          'Clue states are supplied mock reports. First clue is zero. Satisfied numerals dim to 35%, but the check mark and accessible status remain; turn dimSatisfied off for the full-contrast alternative. Over counts have an error color and a visible exclamation mark.',
      },
    },
  },
  args: { status: 'default', palette: 'current', dimSatisfied: true },
  argTypes: {
    status: { control: 'select', options: ['default', 'satisfied', 'over'] },
    palette: { control: 'select', options: ['current', 'proposal'] },
    dimSatisfied: { control: 'boolean' },
  },
  render: build,
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Default: Story = {};
export const SatisfiedIncludingZero: Story = { args: { status: 'satisfied' } };
export const OverIncludingZero: Story = { args: { status: 'over' } };
export const FullContrastSatisfied: Story = { args: { status: 'satisfied', dimSatisfied: false } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => build(args), { theme: 'moonlit-oxblood', bleed: true }),
};
