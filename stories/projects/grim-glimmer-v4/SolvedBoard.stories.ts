import type { Meta, StoryObj } from '@storybook/html-vite';
import { createVictoryPreview, type VictoryOptions } from './victory.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Victory/SolvedBoard',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: { size: 6 },
  argTypes: { size: { control: 'select', options: [6, 15] } },
  render: (args) => createVictoryPreview(args, 'solved'),
} satisfies Meta<VictoryOptions>;
export default meta;
type Story = StoryObj<VictoryOptions>;
export const Board6x6: Story = {};
export const Board15x15: Story = { args: { size: 15 } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createVictoryPreview(args, 'solved'), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
