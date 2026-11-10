import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, expect, userEvent, within } from 'storybook/test';
import { createToolToggle, type ControlsOptions } from './controls.js';
import { compareModes } from '../../lib/stage.js';
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Controls/ToolToggle',
  parameters: { nlTheme: 'moonlit-oxblood' },
  args: { tool: 'star', disabled: false, haptics: true, tick: fn(), onTool: fn() },
  argTypes: {
    tool: { control: 'select', options: ['star', 'exclude'] },
    disabled: { control: 'boolean' },
    haptics: { control: 'boolean' },
  },
  render: (args) => createToolToggle(args),
} satisfies Meta<ControlsOptions>;
export default meta;
type Story = StoryObj<ControlsOptions>;
export const StarSelected: Story = {};
export const ExclusionSelected: Story = { args: { tool: 'exclude' } };
export const Disabled: Story = { args: { disabled: true } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) =>
    compareModes(context, () => createToolToggle(args), { theme: 'moonlit-oxblood' }),
};
export const KeyboardDemo: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const star = canvas.getByRole('button', { name: 'Place star' });
    star.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('button', { name: 'Exclude cell' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Exclude cell' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};

export const ReducedMotion: Story = { args: { reducedMotion: true } };
