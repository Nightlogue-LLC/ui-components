import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { type HomeOptions } from './home.js';
import { createDailyDraw } from './home-parts.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Home/DailyDraw',
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
  render: (args) =>
    createDailyDraw({
      date: args.date ?? '2026-11-10',
      state: args.daily ?? 'unplayed',
      onOpen: args.onDaily,
    }),
} satisfies Meta<HomeOptions>;
export default meta;
type Story = StoryObj<HomeOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(
      context,
      () =>
        createDailyDraw({
          date: args.date ?? '2026-11-10',
          state: args.daily ?? 'unplayed',
          onOpen: args.onDaily,
        }),
      { theme: 'moonlit-oxblood', bleed: true },
    ),
};
export const InProgress: Story = { args: { daily: 'in-progress' } };
export const SolvedToday: Story = { args: { daily: 'solved' } };
export const Hidden: Story = { args: { daily: 'hidden' } };

export const PlaceholderOnly: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Tonight’s Draw' }));
    await expect(args.onDaily).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-11-10', puzzle: null, status: 'placeholder' }),
    );
  },
};
