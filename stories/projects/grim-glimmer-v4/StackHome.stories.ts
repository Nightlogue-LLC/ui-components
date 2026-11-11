import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createStackHome, type StackHomeOptions } from './deck-fixtures.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Home/StackHome',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    initialCard: 0,
    reducedMotion: false,
    haptics: true,
    firstVisit: true,
    launch: 'cold',
    dailyEnabled: true,
    tick: fn(),
    onPlay: fn(),
    onResume: fn(),
    onNewPuzzle: fn(),
    onLocked: fn(),
    onCard: fn(),
    onNavigate: fn(),
  },
  argTypes: { launch: { control: 'select', options: ['cold', 'return'] } },
  render: (args) => createStackHome(args),
} satisfies Meta<StackHomeOptions>;
export default meta;
type Story = StoryObj<StackHomeOptions>;
export const Default: Story = {};
export const Mobile393: Story = { globals: { viewport: { value: 'mobile393', isRotated: false } } };
export const Mobile360: Story = { globals: { viewport: { value: 'mobile360', isRotated: false } } };
export const InProgress: Story = { args: { inProgress: true } };
export const ReturnToHome: Story = { args: { launch: 'return', firstVisit: false } };
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createStackHome(args), { theme: 'moonlit-oxblood', bleed: true }),
};

export const DailyDisabled: Story = { args: { dailyEnabled: false } };

export const DailyRevealed: Story = { args: { draw: { state: 'revealed-unstarted' } } };
export const DailyInProgress: Story = { args: { draw: { state: 'in-progress', progress: 0.4 } } };
export const DailySolved: Story = { args: { draw: { state: 'solved', streak: 3 } } };
