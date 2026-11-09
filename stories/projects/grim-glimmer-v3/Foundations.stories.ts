import type { Meta, StoryObj } from '@storybook/html-vite';
import { compareModes } from '../../lib/stage.js';
import { specimen, theme } from './shared.js';
const meta = {
  title: 'Projects/Grim & Glimmer — Editorial V3/Foundations',
  parameters: { nlTheme: theme },
  render: () => specimen('all'),
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (_, context) => compareModes(context, () => specimen('all'), { theme }),
};
