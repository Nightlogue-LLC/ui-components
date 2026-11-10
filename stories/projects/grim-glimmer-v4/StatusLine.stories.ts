import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { type HomeOptions } from './home.js';
import { createStatusLine } from './home-parts.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Home/StatusLine',
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
  render: (args) => createStatusLine(args.solved, args.streak),
} satisfies Meta<HomeOptions>;
export default meta;
type Story = StoryObj<HomeOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createStatusLine(args.solved, args.streak), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const SolvedOnly: Story = { args: { streak: 0 } };
export const Hidden: Story = { args: { solved: 0, streak: 0 } };
