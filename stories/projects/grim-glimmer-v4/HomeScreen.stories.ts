import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createHome, type HomeOptions } from './home.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Home/HomeScreen',
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
  render: (args) => createHome(args),
} satisfies Meta<HomeOptions>;
export default meta;
type Story = StoryObj<HomeOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createHome(args), { theme: 'moonlit-oxblood', bleed: true }),
};
export const InProgress: Story = { args: { inProgress: true } };
export const QuietHome: Story = { args: { dailyEnabled: false, solved: 0, streak: 0 } };
export const SolvedDraw: Story = { args: { daily: 'solved' } };
export const LongTitle: Story = { args: { title: 'The Cartographer’s Midnight Orchard' } };
export const ReturnToHome: Story = { args: { launch: 'return' } };

export const ResumeAndNewPuzzle: Story = {
  args: { inProgress: true, reducedMotion: true, launch: 'return' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Continue Stars & Spires, Medium 8 by 8, 3 minutes 12 seconds',
      }),
    );
    await expect(args.onResume).toHaveBeenCalledOnce();
    await expect(args.onNewPuzzle).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'New puzzle' }));
    await expect(args.onNewPuzzle).toHaveBeenCalledOnce();
    await expect(canvasElement.querySelector('button button')).toBeNull();
  },
};
export const FontReadyFit: Story = {
  args: { launch: 'return', reducedMotion: true },
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const home = canvasElement.querySelector<HTMLElement>('.gg-v4-home')!;
    await expect(home.scrollHeight).toBeLessThanOrEqual(home.clientHeight + 1);
    await expect(
      home.querySelector('.gg-v4-home-logo')!.getBoundingClientRect().height,
    ).toBeGreaterThanOrEqual(96);
    await expect(
      home.querySelector('.gg-v4-tarot-hit')!.getBoundingClientRect().width,
    ).toBeGreaterThan(140);
  },
};
