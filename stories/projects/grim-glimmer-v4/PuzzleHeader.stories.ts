import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createHeaderPreview, type SupportOptions } from './home-support.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Header/PuzzleHeader',
  parameters: {
    nlTheme: 'moonlit-oxblood',
    nlStage: 'bleed',
    docs: {
      description: {
        component:
          'Historical Phase 7 header/progress reference. The current three-line naming proposal and supplied glyph review are in Header / TarotGameplayHeader. This comparison is retained without changing its original layout.',
      },
    },
  },
  args: {
    reducedMotion: false,
    placed: 2,
    total: 5,
    difficulty: 'Easy',
    onBack: fn(),
    onMenu: fn(),
    onCurrent: fn(),
    onNavigate: fn(),
  },
  argTypes: {
    reducedMotion: { control: 'boolean' },
    difficulty: { control: 'select', options: ['Easy', 'Medium', 'Hard'] },
  },
  render: (args) => createHeaderPreview(args),
} satisfies Meta<SupportOptions>;
export default meta;
type Story = StoryObj<SupportOptions>;
export const Playground: Story = { name: 'Earlier header comparison' };
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createHeaderPreview(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
export const EmptyProgress: Story = { args: { placed: 0, total: 0 } };
export const FullProgress: Story = { args: { placed: 5, total: 5 } };
