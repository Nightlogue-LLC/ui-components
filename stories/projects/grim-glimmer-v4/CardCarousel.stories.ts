import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createCarouselPreview, type HomeOptions } from './home.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Home/CardCarousel',
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
  render: (args) => createCarouselPreview(args),
} satisfies Meta<HomeOptions>;
export default meta;
type Story = StoryObj<HomeOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createCarouselPreview(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};

export const KeyboardAndSettledFeedback: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const playable = canvas.getByRole('button', { name: 'Play Stars & Spires' });
    playable.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Show card II' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    await expect(args.tick).toHaveBeenCalledOnce();
    await userEvent.keyboard('{Home}');
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Show card I' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    await expect(playable).toHaveFocus();
    await expect(args.tick).toHaveBeenCalledTimes(2);
  },
};
