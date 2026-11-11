import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createHeaderPreview, type SupportOptions } from './home-support.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Header/PuzzleHeader',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'bleed' },
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
export const Playground: Story = {};
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
