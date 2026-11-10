import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { createVictoryPreview, createVictoryComparison, type VictoryOptions } from './victory.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Victory/Sequence',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    size: 6,
    messageMode: 'bank',
    showStats: true,
    reducedMotion: false,
    haptics: true,
    success: fn(),
    onHome: fn(),
    onNext: fn(),
    onMedium: fn(),
    onDismiss: fn(),
  },
  argTypes: {
    size: { control: 'select', options: [6, 15] },
    reducedMotion: { control: 'boolean' },
    haptics: { control: 'boolean' },
  },
  render: (args) => createVictoryPreview(args),
} satisfies Meta<VictoryOptions>;
export default meta;
type Story = StoryObj<VictoryOptions>;
export const Sequence6x6: Story = {};
export const Sequence15x15: Story = { args: { size: 15 } };
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const HapticsOff: Story = { args: { haptics: false } };
export const LightDarkFinalState: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createVictoryComparison(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
