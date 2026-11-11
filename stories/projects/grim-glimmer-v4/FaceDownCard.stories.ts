import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createFaceDownPreview, type HomeOptions } from './home.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Home/FaceDownCard',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    reducedMotion: false,
    haptics: true,
    tick: fn(),
    inProgress: false,
    title: 'Stars & Spires',
    date: '2026-11-10',
    dailyEnabled: true,
    daily: 'unplayed',
    solved: 14,
    streak: 3,
    launch: 'cold',
    ambient: true,
    onPlay: fn(),
    onResume: fn(),
    onNewPuzzle: fn(),
    onDaily: fn(),
    onCard: fn(),
    onLocked: fn(),
    onNavigate: fn(),
  },
  argTypes: {
    reducedMotion: { control: 'boolean' },
    daily: { control: 'select', options: ['unplayed', 'in-progress', 'solved', 'hidden'] },
    launch: { control: 'select', options: ['cold', 'return'] },
  },
  render: (args) => createFaceDownPreview(args),
} satisfies Meta<HomeOptions>;
export default meta;
type Story = StoryObj<HomeOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createFaceDownPreview(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};

export const LockedFeedback: Story = {
  play: async ({ canvasElement, args }) => {
    const locked = within(canvasElement).getByRole('button', {
      name: 'Unrevealed puzzle II, locked, not yet available',
    });
    await userEvent.click(locked);
    await expect(args.tick).toHaveBeenCalledOnce();
    await expect(args.onPlay).not.toHaveBeenCalled();
    await expect(args.onNavigate).not.toHaveBeenCalled();
  },
};
