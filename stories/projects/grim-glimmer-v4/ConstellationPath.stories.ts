import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { compareModes } from '../../lib/stage.js';
import { createConstellationPath, type SupportOptions } from './home-support.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Progress/ConstellationPath',
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
  render: (args) => createConstellationPath(args),
} satisfies Meta<SupportOptions>;
export default meta;
type Story = StoryObj<SupportOptions>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createConstellationPath(args), {
      theme: 'moonlit-oxblood',
      bleed: true,
    }),
};
