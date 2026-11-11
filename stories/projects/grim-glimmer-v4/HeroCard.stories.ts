import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { type HomeOptions } from './home.js';
import { createHeroCard } from './home-parts.js';
import { el } from '../../lib/dom.js';
function part(card: HTMLElement) {
  const node = el('div', { className: 'gg-v4-scope gg-v4-card-review' }, [card]);
  return node;
}
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Home/HeroCard',
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
  render: (args) => part(createHeroCard(args)),
} satisfies Meta<HomeOptions>;
export default meta;
type Story = StoryObj<HomeOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => part(createHeroCard(args)), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const InProgress: Story = { args: { inProgress: true } };
export const LongTitle: Story = { args: { title: 'The Cartographer’s Midnight Orchard' } };
