import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import {
  createRitualDraw,
  createDrawReplay,
  DRAW_STATES,
  type RitualDrawOptions,
} from './ritual-draw.js';
import { monthDates, MONTHS } from './month-model.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/DailyDraw/Ritual',
  parameters: {
    nlTheme: 'moonlit-oxblood',
    docs: {
      description: {
        component:
          'Monthly ritual proposal. No date is printed; local calendar date still selects the puzzle seed and piece. Moon phase is approximate. Toggle feature off to preview hidden; production adoption remains off.',
      },
    },
  },
  args: {
    enabled: true,
    state: 'unplayed',
    now: '2026-11-10T16:18:00',
    progress: 0.4,
    streak: 3,
    revealProgress: 0.5,
    reducedMotion: false,
    haptics: true,
    sound: false,
    light: fn(),
    medium: fn(),
    flipSound: fn(),
    onReveal: fn(),
    onBegin: fn(),
    onDayChange: fn(),
  },
  argTypes: {
    state: { control: 'select', options: DRAW_STATES },
    revealProgress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
  render: (args, context) =>
    compareModes(context, () => createRitualDraw(args), { theme: 'moonlit-oxblood' }),
} satisfies Meta<RitualDrawOptions>;
export default meta;
type Story = StoryObj<RitualDrawOptions>;
export const Unplayed: Story = {};
export const RevealingScrub: Story = { args: { state: 'revealing' } };
export const RevealedUnstarted: Story = {
  args: { state: 'revealed-unstarted', restoredDates: monthDates(MONTHS[1]!.monthKey).slice(0, 9) },
};
export const InProgress: Story = {
  args: { state: 'in-progress', restoredDates: monthDates(MONTHS[1]!.monthKey).slice(0, 9) },
};
export const Solved: Story = {
  args: { state: 'solved', restoredDates: monthDates(MONTHS[1]!.monthKey).slice(0, 10) },
};
export const SolvedNoStreak: Story = { args: { state: 'solved', streak: 1 } };
export const Hidden: Story = { args: { enabled: false } };
export const FlipReplay: Story = {
  render: (args, context) =>
    compareModes(context, () => createDrawReplay(args), { theme: 'moonlit-oxblood' }),
};
export const ReducedMotion: Story = {
  args: { reducedMotion: true },
  render: (args, context) =>
    compareModes(context, () => createDrawReplay(args), { theme: 'moonlit-oxblood' }),
};
export const Mobile393: Story = { globals: { viewport: { value: 'mobile393', isRotated: false } } };
export const Mobile360: Story = { globals: { viewport: { value: 'mobile360', isRotated: false } } };
