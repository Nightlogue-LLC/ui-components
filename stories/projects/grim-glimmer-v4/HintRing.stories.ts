import type { Meta, StoryObj } from '@storybook/html-vite';
import { createHintPreview, type MotionOptions } from './motion-fixtures.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Motion/HintRing',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: { size: 6, reducedMotion: false },
  argTypes: {
    size: { control: 'select', options: [5, 6, 8, 15] },
    reducedMotion: { control: 'boolean' },
  },
  render: (args) => createHintPreview(args),
} satisfies Meta<MotionOptions>;
export default meta;
type Story = StoryObj<MotionOptions>;
export const TargetPulse: Story = {};
export const DenseBoard: Story = { args: { size: 15 } };
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createHintPreview(args), { theme: 'moonlit-oxblood', bleed: true }),
};
