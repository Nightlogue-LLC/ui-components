import type { Meta, StoryObj } from '@storybook/html-vite';
import { createMonthlyTrophy } from './month-fixtures.js';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createMonthCard, type MonthCardOptions } from './month-card.js';
import { MONTHS, monthDates } from './month-model.js';
const november = MONTHS[1]!,
  dates = monthDates(november.monthKey);
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Monthly/MonthCard',
  parameters: {
    nlTheme: 'moonlit-oxblood',
    docs: {
      description: {
        component:
          'One image definition and one mask. The built-in card illustrations are temporary art, not the final monthly 5:8 WebPs. Replay is a review control; production restores only after puzzle completion. Grid uses filled/hollow pips, arrows and Home/End. Grace includes the first three calendar days of the next month.',
      },
    },
  },
  args: {
    manifest: november,
    localDate: '2026-11-30',
    restoredDates: dates.slice(0, 12),
    showGrid: false,
    reducedMotion: false,
    haptics: true,
    light: fn(),
    medium: fn(),
    success: fn(),
    onStorage: fn(),
    onPlayDate: fn(),
    onSave: fn(),
    onShare: fn(),
  },
  render: (args, context) =>
    compareModes(context, () => createMonthCard(args), { theme: 'moonlit-oxblood' }),
} satisfies Meta<MonthCardOptions>;
export default meta;
type Story = StoryObj<MonthCardOptions>;
export const EmptyMonthDay1: Story = {
  args: { localDate: '2026-11-01', restoredDates: [], showGrid: true },
};
export const FortyPercent: Story = {};
export const NinetyPercent: Story = { args: { restoredDates: dates.slice(0, 27) } };
export const Complete: Story = { args: { restoredDates: dates } };
export const FragmentaryPastMonth: Story = {
  args: {
    localDate: '2026-12-04',
    restoredDates: dates.filter((_, i) => i % 3 === 0),
    showGrid: true,
  },
};
export const ArchiveGrace: Story = {
  args: { localDate: '2026-12-03', restoredDates: dates.slice(0, 12), showGrid: true },
};
export const RestoringToday: Story = {
  args: { localDate: '2026-11-13', restoreDate: '2026-11-13' },
};
export const FinalPieceReplay: Story = {
  args: { restoredDates: dates.slice(0, 29), restoreDate: dates[29] },
};
export const Month28Days: Story = {
  args: {
    manifest: MONTHS[0],
    localDate: '2026-02-28',
    restoredDates: monthDates('2026-02').slice(0, 11),
    showGrid: true,
  },
};
export const Month31Days: Story = {
  args: {
    manifest: MONTHS[2],
    localDate: '2026-12-31',
    restoredDates: monthDates('2026-12').slice(0, 12),
    showGrid: true,
  },
};
export const ReducedMotion: Story = { args: { reducedMotion: true, restoreDate: '2026-11-13' } };
export const KeyboardGrid: Story = { args: { showGrid: true } };
export const Mobile393: Story = { globals: { viewport: { value: 'mobile393', isRotated: false } } };
export const Mobile360: Story = { globals: { viewport: { value: 'mobile360', isRotated: false } } };

export const TrophyTab: Story = {
  render: (args, context) =>
    compareModes(context, () => createMonthlyTrophy(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
