import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import {
  createScreenPreview,
  createDissolvePreview,
  type MotionOptions,
} from './motion-fixtures.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Motion/Transitions',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: { size: 6, reviewSpeed: 0.25, reducedMotion: false, onTransaction: fn() },
  argTypes: {
    reviewSpeed: {
      control: 'select',
      options: [0.25, 0.5, 1],
      description: 'Review playback only: quarter, half, or normal speed.',
    },
    size: { control: 'select', options: [5, 6, 8, 15] },
    reducedMotion: { control: 'boolean' },
  },
  render: (args) => createScreenPreview(args),
} satisfies Meta<MotionOptions>;
export default meta;
type Story = StoryObj<MotionOptions>;
export const ScreenPush: Story = {};
export const BoardDissolve: Story = { render: (args) => createDissolvePreview(args) };
export const DenseDissolve: Story = {
  args: { size: 15 },
  render: (args) => createDissolvePreview(args),
};
export const ReducedMotion: Story = {
  args: { reducedMotion: true },
  render: (args) => createDissolvePreview(args),
};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createDissolvePreview(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};

export const NormalTiming: Story = { args: { reviewSpeed: 1 } };
