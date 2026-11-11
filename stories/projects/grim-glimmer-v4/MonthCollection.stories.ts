import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createMonthCollection } from './month-collection.js';
import { MONTHS, monthDates } from './month-model.js';
type Args = Parameters<typeof createMonthCollection>[0];
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Monthly/Collection',
  parameters: { nlTheme: 'moonlit-oxblood' },
  args: {
    manifests: MONTHS,
    progress: MONTHS.map((manifest, i) => ({
      version: 1 as const,
      monthKey: manifest.monthKey,
      seed: manifest.seed,
      restoredDates: monthDates(manifest.monthKey).filter((_, index) => index % (i + 2) === 0),
    })),
    onOpen: fn(),
  },
  render: (args, context) =>
    compareModes(context, () => createMonthCollection(args), { theme: 'moonlit-oxblood' }),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const FragmentaryMonths: Story = {};
export const NoPieces: Story = { args: { progress: [] } };
export const Mobile360: Story = { globals: { viewport: { value: 'mobile360', isRotated: false } } };
