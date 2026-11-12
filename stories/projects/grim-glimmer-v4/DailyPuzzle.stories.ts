import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import {
  createRitualDraw,
  type RitualDrawOptions,
} from '../../../src/projects/grim-glimmer/ritual-draw.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/DailyDraw/DailyPuzzle',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
  args: {
    enabled: true,
    puzzle: { title: '8 × 8 Trees & Tents', action: 'Begin' },
    onOpenPuzzle: fn(),
    clock: () => new Date(2026, 10, 12, 16),
  },
  render: (args) => createRitualDraw(args),
} satisfies Meta<RitualDrawOptions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Begin: Story = {};
export const Resume: Story = {
  args: { puzzle: { title: '8 × 8 Trees & Tents', action: 'Resume' }, state: 'in-progress' },
};
export const Replay: Story = {
  args: { puzzle: { title: '8 × 8 Trees & Tents', action: 'Replay' } },
};
export const Unavailable: Story = {
  args: { puzzle: { title: 'Daily puzzle', action: 'unavailable' }, onOpenPuzzle: undefined },
};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createRitualDraw(args), { theme: 'moonlit-oxblood', bleed: true }),
};
